#!/usr/bin/env node
// Runs bench trials and writes one result file per trial. See bench/README.md.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { grade } from "./graders/index.mjs";
import { benchHash } from "./lib/hash.mjs";
import { checkout, cleanup } from "./lib/method.mjs";
import { runAsync } from "./lib/proc.mjs";
import { prompt } from "./lib/prompt.mjs";
import { leaks, runtime, RUNTIME_NAMES } from "./lib/runtimes.mjs";
import { BENCH, CHECKPOINTS, prepare } from "./lib/workspace.mjs";

const USAGE = `usage: node bench/run.mjs --runtime <${RUNTIME_NAMES.join("|")}> [options]

  --arms <list>         comma list of: none, onus (the working tree), onus@<git ref>
                        default: none,onus
  --checkpoints <list>  comma list of ${CHECKPOINTS.join(", ")}; default: all
  --trials <n>          trials per arm and checkpoint; default 1
  --model <name>        passed to the runtime; the result folder is named after it
  --budget-usd <n>      Claude Code only: --max-budget-usd per trial
  --timeout-min <n>     per trial; default 30
  --logs <dir>          raw runtime output; default ~/.onus-bench/logs (never in the repo)
  --results <dir>       where result files go; default bench/results
  --strict              refuse to run when user-level instructions would leak into every arm
  --keep                keep each trial's workspace
  --dry-run             build the workspaces and print prompts and commands; run nothing`;

const { values: o } = parseArgs({
  options: {
    runtime: { type: "string" }, arms: { type: "string", default: "none,onus" },
    checkpoints: { type: "string", default: CHECKPOINTS.join(",") }, trials: { type: "string", default: "1" },
    model: { type: "string" }, "budget-usd": { type: "string" }, "timeout-min": { type: "string", default: "30" },
    logs: { type: "string", default: join(homedir(), ".onus-bench/logs") },
    results: { type: "string", default: join(BENCH, "results") },
    strict: { type: "boolean" }, keep: { type: "boolean" }, "dry-run": { type: "boolean" }, help: { type: "boolean" },
  },
});
if (o.help || !o.runtime) {
  console.log(USAGE);
  process.exit(o.help ? 0 : 2);
}

const rt = runtime(o.runtime);
const repo = join(BENCH, "..");
const checkpoints = o.checkpoints.split(",").map((s) => s.trim());
for (const c of checkpoints) if (!CHECKPOINTS.includes(c)) throw new Error(`unknown checkpoint ${c}`);
const trials = Number(o.trials);
const hash = benchHash();
const modelDir = (o.model ?? "default").replace(/[^\w.@-]+/g, "_");

const arms = o.arms.split(",").map((a) => a.trim()).map((a) => {
  if (a === "none") return { name: "none", method: null };
  const m = a.match(/^onus(?:@(.+))?$/);
  if (!m) throw new Error(`unknown arm ${a}`);
  const method = checkout(repo, m[1] ?? "worktree");
  return { name: `onus-${method.label}`, method };
});

let failures = 0;
try {
  for (let t = 1; t <= trials; t++) {
    for (const checkpoint of checkpoints) {
      for (const arm of arms) await trial(arm, checkpoint, t);
    }
  }
} finally {
  for (const arm of arms) if (arm.method) cleanup(arm.method);
}
process.exit(failures ? 1 : 0);

async function trial(arm, checkpoint, t) {
  const ws = prepare(checkpoint, arm.method);
  const text = prompt(checkpoint, ws.installed?.roles ?? null);
  const leaked = leaks(rt.name, ws.dir);
  const [cmd, args] = rt.command({ prompt: text, model: o.model, budget: o["budget-usd"], dir: ws.dir });
  const tag = `${rt.name} ${arm.name} ${checkpoint} #${t}`;
  if (leaked.length) console.warn(`${tag}: user-level files also load in this arm: ${leaked.join(", ")}`);
  if (o.strict && leaked.length) throw new Error("--strict: remove or move those files, or run on a clean account");
  if (o["dry-run"]) {
    console.log(`\n== ${tag}\nworkspace: ${ws.dir}${o.keep ? "" : " (removed; --keep keeps it)"}\ncommand: ${cmd} ${args.map((a) => (a === text ? "<prompt>" : a)).join(" ")}\n--- prompt\n${text}`);
    if (!o.keep) rmSync(ws.dir, { recursive: true, force: true });
    return;
  }

  console.log(`${tag}: running in ${ws.dir}`);
  const started = new Date();
  const r = await runAsync(cmd, args, { cwd: ws.dir, env: trialEnv(ws.dir), timeoutMs: Number(o["timeout-min"]) * 60_000 });
  const durationMs = Date.now() - started.getTime();
  const usage = rt.parse(r.stdout);
  const score = await grade(checkpoint, ws.dir, ws);

  const stamp = started.toISOString().replace(/[:.]/g, "-");
  const rel = join(rt.name, modelDir, arm.name, checkpoint, `${stamp}-t${t}`);
  mkdirSync(join(o.logs, rel), { recursive: true });
  writeFileSync(join(o.logs, rel, "stdout.jsonl"), r.stdout);
  writeFileSync(join(o.logs, rel, "stderr.txt"), r.stderr);
  writeFileSync(join(o.logs, rel, "prompt.md"), text);

  const result = {
    schema: 1,
    bench: hash,
    runtime: rt.name,
    model: o.model ?? null,
    modelReported: rt.reportedModel(r.stdout),
    arm: arm.name,
    method: arm.method ? { ref: arm.method.ref, sha: arm.method.sha, label: arm.method.label, roles: ws.installed.roles, rulesFrom: ws.installed.rulesFrom } : null,
    checkpoint,
    trial: t,
    startedAt: started.toISOString(),
    durationMs,
    exitCode: r.code,
    timedOut: r.timedOut,
    leakedUserFiles: leaked,
    usage,
    score,
  };
  const out = join(o.results, `${rel}.json`);
  mkdirSync(join(out, ".."), { recursive: true });
  writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
  if (!o.keep) rmSync(ws.dir, { recursive: true, force: true });
  if (r.code !== 0 || !usage) failures++;
  console.log(`${tag}: ${score.pass ? "pass" : "fail"}, ${usage?.total ?? "?"} tokens, ${Math.round(durationMs / 1000)}s -> ${out}`);
}

/**
 * The environment a runtime starts with: ours, minus what points back at
 * this checkout (npm's variables, the directory we were started from).
 */
function trialEnv(dir) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (/^npm_/i.test(k) || ["INIT_CWD", "OLDPWD", "PWD"].includes(k)) continue;
    env[k] = v;
  }
  env.PWD = dir;
  return env;
}
