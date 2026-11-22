// How each runtime is started for one trial, and where it reads user-level
// instructions that would leak into every arm.
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { parsers } from "./usage.mjs";

const RUNTIMES = {
  claude: {
    // Project skills and CLAUDE.md load in print mode. bypassPermissions lets
    // it edit, run and commit without asking; use a disposable machine.
    command: ({ prompt, model, budget }) => [
      "claude",
      ["-p", prompt, "--output-format", "json", "--permission-mode", "bypassPermissions",
        ...(model ? ["--model", model] : []), ...(budget ? ["--max-budget-usd", String(budget)] : [])],
    ],
    userFiles: ["~/.claude/CLAUDE.md", "~/.claude/skills", "~/.claude/rules"],
    reportedModel: (stdout) => {
      try { return Object.keys(JSON.parse(stdout.trim().split("\n").pop()).modelUsage ?? {}).join(",") || null; } catch { return null; }
    },
  },
  codex: {
    // workspace-write keeps .git read-only in current Codex, so a trial could
    // not commit. Full access, in a throwaway workspace on a disposable machine.
    command: ({ prompt, model, dir }) => [
      "codex",
      ["exec", "--json", "--sandbox", "danger-full-access", "--skip-git-repo-check", "-C", dir,
        ...(model ? ["-m", model] : []), prompt],
    ],
    userFiles: ["~/.codex/AGENTS.md", "~/.codex/AGENTS.override.md", "~/.codex/skills", "~/.agents/skills"],
    reportedModel: () => null,
  },
  pi: {
    // -a trusts the workspace's own files for this one command, so its
    // .agents/skills and AGENTS.md load. No session file is kept.
    command: ({ prompt, model }) => [
      "pi",
      ["--mode", "json", "--no-session", "-a", ...(model ? ["--model", model] : []), prompt],
    ],
    userFiles: ["~/.pi/agent/AGENTS.md", "~/.pi/agent/skills", "~/.agents/skills"],
    reportedModel: (stdout) => {
      const m = stdout.match(/"role":"assistant"[^\n]*?"model":"([^"]+)"/);
      return m ? m[1] : null;
    },
  },
};

export const RUNTIME_NAMES = Object.keys(RUNTIMES);

export function runtime(name) {
  const r = RUNTIMES[name];
  if (!r) throw new Error(`unknown runtime ${name}; one of ${RUNTIME_NAMES.join(", ")}`);
  return { name, ...r, parse: parsers[name] };
}

/**
 * User-level instruction and skill files this runtime would also load, and
 * AGENTS.md or CLAUDE.md files in the folders above the workspace. Any of
 * them makes the "none" arm not none. Best effort: these are the known
 * locations, not every one a runtime may read.
 */
export function leaks(name, workspace) {
  const home = homedir();
  const found = RUNTIMES[name].userFiles.map((p) => p.replace(/^~/, home)).filter((p) => existsSync(p));
  for (let d = dirname(workspace); ; d = dirname(d)) {
    for (const f of ["AGENTS.md", "CLAUDE.md"]) if (existsSync(join(d, f))) found.push(join(d, f));
    if (dirname(d) === d) break;
  }
  return found;
}
