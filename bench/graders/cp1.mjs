// CP1: fix a bug that only shows on the running server. The fixture's unit
// tests pass before the fix; this grader drives the real HTTP surface.
import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BENCH } from "../lib/workspace.mjs";
import { run } from "../lib/proc.mjs";
import { changes, startServer } from "./common.mjs";

const ids = (list) => (Array.isArray(list) ? list.map((n) => n.id) : null);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export async function grade(dir, { base }) {
  const tests = run("bun", ["test"], { cwd: dir }).code === 0;

  const e2e = { tagLower: false, tagUpper: false, all: false, post: false, error: null };
  const server = await startServer(dir);
  try {
    if (!server.url) throw new Error(server.error);
    const get = async (q) => (await fetch(`${server.url}/api/notes${q}`)).json().catch(() => null);
    e2e.tagLower = same(ids(await get("?tag=work")), [1, 3]);
    e2e.tagUpper = same(ids(await get("?tag=Work")), [1, 3]);
    e2e.all = same(ids(await get("")), [1, 2, 3, 4]);
    const post = await fetch(`${server.url}/api/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "grader", tags: ["x"] }),
    });
    e2e.post = post.status === 201;
  } catch (e) {
    e2e.error = String(e.message ?? e);
  } finally {
    server.stop();
  }
  const e2ePass = e2e.tagLower && e2e.tagUpper && e2e.all && e2e.post;

  // Would the tests the agent left behind have caught the bug? Run them
  // against the fixture as it was.
  let testCatchesBug = false;
  if (tests && existsSync(join(dir, "test"))) {
    const old = mkdtempSync(join(tmpdir(), "notes-old-"));
    cpSync(join(BENCH, "fixture"), old, { recursive: true });
    rmSync(join(old, "test"), { recursive: true, force: true });
    cpSync(join(dir, "test"), join(old, "test"), { recursive: true });
    testCatchesBug = run("bun", ["test"], { cwd: old }).code !== 0;
    rmSync(old, { recursive: true, force: true });
  }

  const c = changes(dir, base);
  const pr = run("git", ["cat-file", "-e", "HEAD:PULL_REQUEST.md"], { cwd: dir }).code === 0;
  return {
    pass: tests && e2ePass,
    tests,
    e2e: { pass: e2ePass, ...e2e },
    testCatchesBug,
    process: {
      branch: c.branch,
      offMain: c.branch !== "main",
      committed: c.commits > 0,
      clean: c.dirty.length === 0,
      prFile: pr,
    },
    diff: c.diff,
  };
}
