import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { run } from "../lib/proc.mjs";

const freePort = () =>
  new Promise((resolve, reject) => {
    const s = createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

/** Starts the workspace's server and waits until it answers. */
export async function startServer(dir, timeoutMs = 8000) {
  const port = await freePort();
  const child = spawn("bun", ["src/server.ts"], { cwd: dir, env: { ...process.env, PORT: String(port) }, stdio: "ignore", detached: true });
  const stop = () => { try { process.kill(-child.pid, "SIGKILL"); } catch {} };
  const url = `http://127.0.0.1:${port}`;
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (child.exitCode !== null) return { url: null, error: `server exited with ${child.exitCode}`, stop };
    try {
      await fetch(`${url}/`);
      return { url, stop };
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  stop();
  return { url: null, error: "server did not answer", stop };
}

/** What the trial changed relative to `base`, committed or not. */
export function changes(dir, base) {
  const g = (args) => run("git", args, { cwd: dir }).stdout.trim();
  const branch = g(["rev-parse", "--abbrev-ref", "HEAD"]);
  const commits = Number(g(["rev-list", "--count", `${base}..HEAD`]) || 0);
  const dirty = g(["status", "--porcelain"]).split("\n").filter(Boolean);
  const files = {};
  for (const line of g(["diff", "--numstat", base]).split("\n").filter(Boolean)) {
    const [add, del, path] = line.split("\t");
    files[path] = { add: Number(add) || 0, del: Number(del) || 0 };
  }
  for (const line of g(["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean)) {
    files[line] ??= { add: null, del: 0, untracked: true };
  }
  const sum = (pred) => Object.entries(files).filter(([p]) => pred(p)).reduce((t, [, f]) => t + (f.add ?? 0) + f.del, 0);
  return {
    branch,
    commits,
    dirty,
    diff: {
      files: Object.keys(files).sort(),
      srcLines: sum((p) => p.startsWith("src/")),
      testLines: sum((p) => p.startsWith("test/")),
      otherFiles: Object.keys(files).filter((p) => !/^(src|test)\//.test(p) && p !== "PULL_REQUEST.md").sort(),
    },
  };
}
