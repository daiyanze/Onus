// Small process helpers shared by the harness and the graders.
import { spawn, spawnSync } from "node:child_process";

/** Runs a command to completion. Never throws on a non-zero exit. */
export function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, ...opts });
  if (r.error) return { code: -1, stdout: "", stderr: String(r.error.message ?? r.error) };
  return { code: r.status ?? -1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** Like run, but throws with the output when the exit code is not 0. */
export function must(cmd, args, opts = {}) {
  const r = run(cmd, args, opts);
  if (r.code !== 0) throw new Error(`${cmd} ${args.join(" ")} failed (${r.code}): ${r.stderr || r.stdout}`);
  return r.stdout;
}

/** Runs a command with a time limit, collecting stdout and stderr. */
export function runAsync(cmd, args, { cwd, env, timeoutMs, input } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env, stdio: ["pipe", "pipe", "pipe"], detached: true });
    const out = [];
    const err = [];
    let timedOut = false;
    child.stdout.on("data", (b) => out.push(b));
    child.stderr.on("data", (b) => err.push(b));
    const timer = timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          try { process.kill(-child.pid, "SIGKILL"); } catch {}
        }, timeoutMs)
      : null;
    child.on("error", (e) => {
      if (timer) clearTimeout(timer);
      resolve({ code: -1, stdout: "", stderr: String(e.message), timedOut });
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      resolve({ code: code ?? -1, stdout: Buffer.concat(out).toString("utf8"), stderr: Buffer.concat(err).toString("utf8"), timedOut });
    });
    child.stdin.end(input ?? "");
  });
}

/** Git with a fixed identity and clock, so workspaces are the same every time. */
export function git(cwd, args) {
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "bench", GIT_AUTHOR_EMAIL: "bench@example.invalid",
    GIT_COMMITTER_NAME: "bench", GIT_COMMITTER_EMAIL: "bench@example.invalid",
    GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z", GIT_COMMITTER_DATE: "2026-01-01T00:00:00Z",
  };
  return must("git", ["-c", "init.defaultBranch=main", "-c", "commit.gpgsign=false", ...args], { cwd, env });
}
