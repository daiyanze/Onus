// The bench's own tests: parsers, workspaces, graders, and one full run with
// a fake runtime. Needs node, git and bun.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import * as cp1 from "../graders/cp1.mjs";
import * as cp2 from "../graders/cp2.mjs";
import { checkout, cleanup, development } from "../lib/method.mjs";
import { run } from "../lib/proc.mjs";
import { prompt } from "../lib/prompt.mjs";
import * as usage from "../lib/usage.mjs";
import { BENCH, prepare } from "../lib/workspace.mjs";

const REPO = join(BENCH, "..");
const sh = (cwd, cmd, args) => execFileSync(cmd, args, { cwd, stdio: "pipe" }).toString();
const commit = (dir) => {
  sh(dir, "git", ["add", "-A"]);
  sh(dir, "git", ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "work"]);
};
const fixServer = (dir) =>
  writeFileSync(join(dir, "src/server.ts"), readFileSync(join(dir, "src/server.ts"), "utf8").replace("tag.trim)", "tag.trim())"));
const SERVER_TEST = `import { expect, test } from "bun:test";
import { handle } from "../src/server.ts";
test("GET ?tag=work", async () => {
  const res = await handle(new Request("http://x/api/notes?tag=work"));
  expect((await res.json()).map((n) => n.id)).toEqual([1, 3]);
});
`;

test("claude usage prefers modelUsage and keeps the cost", () => {
  const out = JSON.stringify({
    type: "result", is_error: false, num_turns: 7, total_cost_usd: 0.42,
    usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100, cache_creation_input_tokens: 20 },
    modelUsage: {
      a: { inputTokens: 10, outputTokens: 5, cacheReadInputTokens: 100, cacheCreationInputTokens: 20 },
      b: { inputTokens: 1, outputTokens: 2, cacheReadInputTokens: 3, cacheCreationInputTokens: 4 },
    },
  });
  const u = usage.claude(`noise\n${out}\n`);
  assert.equal(u.input, 11);
  assert.equal(u.total, 11 + 7 + 103 + 24);
  assert.equal(u.costUsd, 0.42);
  assert.equal(u.turns, 7);
  const main = usage.claude(JSON.stringify({ type: "result", usage: { input_tokens: 3, output_tokens: 4 } }));
  assert.equal(main.total, 7);
  assert.match(main.note, /main agent only/);
  assert.equal(usage.claude("not json"), null);
});

test("codex usage sums turn.completed and reports no cost", () => {
  const ev = (i, c, o, r) => JSON.stringify({ type: "turn.completed", usage: { input_tokens: i, cached_input_tokens: c, output_tokens: o, reasoning_output_tokens: r } });
  const u = usage.codex([JSON.stringify({ type: "thread.started" }), ev(100, 80, 10, 4), ev(50, 40, 5, 1)].join("\n"));
  assert.deepEqual([u.input, u.cacheRead, u.output, u.reasoning, u.total, u.turns, u.costUsd], [150, 120, 15, 5, 165, 2, null]);
  assert.equal(usage.codex("{}"), null);
});

test("pi usage counts assistant messages and tool results with nested usage", () => {
  const u = (i, o, c) => ({ input: i, output: o, cacheRead: 1, cacheWrite: 2, totalTokens: i + o + 3, cost: { total: c } });
  const lines = [
    { type: "message_end", message: { role: "assistant", usage: u(10, 5, 0.1) } },
    { type: "message_end", message: { role: "toolResult", usage: u(4, 1, 0.05) } },
    { type: "message_end", message: { role: "user" } },
    { type: "message_update", message: { role: "assistant", usage: u(999, 999, 9) } },
  ].map((l) => JSON.stringify(l));
  const r = usage.pi(lines.join("\n"));
  assert.deepEqual([r.input, r.output, r.cacheRead, r.cacheWrite, r.total, r.turns], [14, 6, 2, 4, 26, 1]);
  assert.ok(Math.abs(r.costUsd - 0.15) < 1e-9);
});

test("every arm gets the same prompt apart from the skill line", () => {
  const none = prompt("cp2-buggy", null);
  const onus = prompt("cp2-buggy", { review: "cross-examine" });
  assert.equal(onus.replace("Use the `cross-examine` skill for this.\n\n", ""), none);
  assert.ok(!none.includes("{{"));
  assert.ok(!prompt("cp1", { issue: "take-case" }).includes("{{"));
});

test("the none arm has no method; a method arm has one copy of each skill", () => {
  const plain = prepare("cp1", null);
  for (const f of ["AGENTS.md", "CLAUDE.md", ".claude", ".agents", "docs"]) assert.ok(!existsSync(join(plain.dir, f)), f);
  assert.ok(existsSync(join(plain.dir, "issues/1.md")));
  const method = checkout(REPO, "worktree");
  const ws = prepare("cp1", method);
  assert.deepEqual(readdirSync(join(ws.dir, ".agents/skills")), readdirSync(join(REPO, "skills")));
  const agents = readFileSync(join(ws.dir, "AGENTS.md"), "utf8");
  assert.ok(!agents.includes("{{"), "role placeholders filled");
  assert.ok(agents.includes(ws.installed.roles.issue));
  assert.ok(!readFileSync(join(ws.dir, "docs/development.md"), "utf8").includes("<agent label>"));
  cleanup(method);
  for (const w of [plain, ws]) rmSync(w.dir, { recursive: true, force: true });
});

test("the development template keeps its text and gets the fixture's checklist", () => {
  const t = "# A\n\n## Review checklist\n\nIntro.\n\n1. <Does it?>\n2. <...>\n\n## Lessons\n\nLabel `<agent label>`.\n";
  assert.equal(development(t, "1. Real question?"), "# A\n\n## Review checklist\n\nIntro.\n\n1. Real question?\n\n## Lessons\n\nLabel `agent-ok`.\n");
});

test("an older ref installs with its own skill names", { skip: run("git", ["cat-file", "-e", "1776fc4^{commit}"], { cwd: REPO }).code !== 0 && "1776fc4 not in this clone" }, () => {
  const method = checkout(REPO, "1776fc4");
  const ws = prepare("cp1", method);
  assert.deepEqual(ws.installed.roles, { issue: "next", run: "long-run", review: "pr-review" });
  assert.equal(ws.installed.rulesFrom, "fallback");
  assert.ok(readFileSync(join(ws.dir, "AGENTS.md"), "utf8").includes("`next` skill"));
  cleanup(method);
  rmSync(ws.dir, { recursive: true, force: true });
});

test("cp2 workspaces: the branch differs from main by the patch only", () => {
  for (const cp of ["cp2-buggy", "cp2-clean"]) {
    const ws = prepare(cp, null);
    assert.equal(sh(ws.dir, "git", ["rev-parse", "--abbrev-ref", "HEAD"]).trim(), "feature/delete-note");
    const files = sh(ws.dir, "git", ["diff", "--name-only", "main"]).trim().split("\n").sort();
    assert.deepEqual(files, ["PULL_REQUEST.md", "README.md", "src/notes.ts", "src/server.ts", "test/notes.test.ts"]);
    assert.ok(!existsSync(join(ws.dir, "issues")));
    assert.equal(run("bun", ["test"], { cwd: ws.dir }).code, 0, "the patch's own tests pass");
    rmSync(ws.dir, { recursive: true, force: true });
  }
});

test("cp1 grader: the untouched fixture fails on the real surface though its tests pass", async () => {
  const ws = prepare("cp1", null);
  const s = await cp1.grade(ws.dir, ws);
  assert.equal(s.tests, true);
  assert.equal(s.e2e.pass, false);
  assert.equal(s.pass, false);
  assert.equal(s.process.committed, false);
  rmSync(ws.dir, { recursive: true, force: true });
});

test("cp1 grader: a fix passes; a test that would catch the bug is credited", async () => {
  const ws = prepare("cp1", null);
  sh(ws.dir, "git", ["checkout", "-q", "-b", "fix"]);
  fixServer(ws.dir);
  writeFileSync(join(ws.dir, "PULL_REQUEST.md"), "# fix\n");
  commit(ws.dir);
  let s = await cp1.grade(ws.dir, ws);
  assert.equal(s.pass, true);
  assert.equal(s.testCatchesBug, false, "the fixture's own tests do not catch it");
  assert.deepEqual([s.process.offMain, s.process.committed, s.process.clean, s.process.prFile], [true, true, true, true]);
  assert.equal(s.diff.srcLines, 2);
  writeFileSync(join(ws.dir, "test/server.test.ts"), SERVER_TEST);
  s = await cp1.grade(ws.dir, ws);
  assert.equal(s.testCatchesBug, true);
  assert.equal(s.process.clean, false);
  rmSync(ws.dir, { recursive: true, force: true });
});

test("cp2 grader: finds, misses and false blocks", async () => {
  const bugs = cp2.plantedBugs();
  const both = `BLOCKING src/notes.ts:${bugs[0].lines[0] + 2} splice\n- **BLOCKING** \`src/server.ts:${bugs[1].lines[0]}\` 204\nNOTE style`;
  assert.equal(cp2.score(cp2.parseReview(both), "buggy").pass, true);
  const one = cp2.score(cp2.parseReview(`BLOCKING ./src/notes.ts:${bugs[0].lines[1]} x\nBLOCKING test/notes.test.ts:3 no 404 test`), "buggy");
  assert.deepEqual([one.pass, one.recall, one.otherBlocking.length], [false, 0.5, 1]);
  const far = cp2.score(cp2.parseReview("BLOCKING src/notes.ts:1 imports"), "buggy");
  assert.equal(far.recall, 0);
  assert.equal(cp2.score(cp2.parseReview("APPROVE"), "clean").pass, true);
  const fb = cp2.score(cp2.parseReview("BLOCKING src/server.ts:3 nit\nBLOCKING: no tests"), "clean");
  assert.deepEqual([fb.pass, fb.falseBlocks], [false, 2]);

  const ws = prepare("cp2-buggy", null);
  assert.equal((await cp2.grade(ws.dir, { ...ws, variant: "buggy" })).process.reviewFile, false);
  writeFileSync(join(ws.dir, "REVIEW.md"), both);
  const g = await cp2.grade(ws.dir, { ...ws, variant: "buggy" });
  assert.deepEqual([g.pass, g.process.codeUnchanged, g.process.headUnchanged], [true, true, true]);
  writeFileSync(join(ws.dir, "src/notes.ts"), "changed");
  assert.equal((await cp2.grade(ws.dir, { ...ws, variant: "buggy" })).process.codeUnchanged, false);
  rmSync(ws.dir, { recursive: true, force: true });
});

test("the planted bugs are real: each shows on the running server", async () => {
  for (const [variant, expectDel, expectIds] of [["buggy", 204, [1, 2, 3]], ["clean", 404, [1, 2, 3, 4]]]) {
    const ws = prepare(`cp2-${variant}`, null);
    const { startServer } = await import("../graders/common.mjs");
    const s = await startServer(ws.dir);
    try {
      assert.equal((await fetch(`${s.url}/api/notes/99`, { method: "DELETE" })).status, expectDel);
      assert.deepEqual((await (await fetch(`${s.url}/api/notes`)).json()).map((n) => n.id), expectIds);
    } finally {
      s.stop();
    }
    rmSync(ws.dir, { recursive: true, force: true });
  }
});

test("run.mjs: a full run with a fake runtime writes graded results with usage", () => {
  const results = mkdtempSync(join(tmpdir(), "bench-results-"));
  const logs = mkdtempSync(join(tmpdir(), "bench-logs-"));
  const env = { ...process.env, PATH: `${join(BENCH, "test/fake-bin")}:${process.env.PATH}` };
  const r = run("node", [join(BENCH, "run.mjs"), "--runtime", "pi", "--arms", "none,onus", "--results", results, "--logs", logs], { env });
  assert.equal(r.code, 0, r.stderr + r.stdout);
  const files = run("find", [results, "-name", "*.json"]).stdout.trim().split("\n").sort();
  assert.equal(files.length, 6);
  for (const f of files) {
    const j = JSON.parse(readFileSync(f, "utf8"));
    assert.equal(j.score.pass, true, `${f}: ${JSON.stringify(j.score)}`);
    assert.equal(j.usage.total, 120 + 10 + 16);
    assert.equal(j.modelReported, "fake-model");
    assert.match(j.bench, /^[0-9a-f]{12}$/);
    if (j.checkpoint === "cp1") assert.equal(j.score.testCatchesBug, true);
  }
  assert.ok(files.some((f) => f.includes("/none/")) && files.some((f) => f.includes("/onus-")));
  const out = join(results, "RESULTS.md");
  const rep = run("node", [join(BENCH, "report.mjs"), "--results", results, "--out", out]);
  assert.equal(rep.code, 0, rep.stderr);
  const table = readFileSync(out, "utf8");
  assert.match(table, /\| pi \| default \| none \| cp1 \| 1 \| 1\/1 \| test catches bug 1\/1; src lines 2\.0 \| 146 \(146-146\) \| \$0\.020 \|/);
  assert.match(table, /\| cp2-buggy \| 1 \| 1\/1 \| recall 1\.00 \|/);
  assert.match(table, /\| cp2-clean \| 1 \| 1\/1 \| false blocks 0\.00 \|/);
  rmSync(results, { recursive: true, force: true });
  rmSync(logs, { recursive: true, force: true });
});
