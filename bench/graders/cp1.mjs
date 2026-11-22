// CP1: fix a bug that only shows on the running server. The fixture's unit
// tests pass before the fix; this grader drives the real HTTP surface.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { BENCH } from "../lib/workspace.mjs";
import { run } from "../lib/proc.mjs";
import { changes, startServer } from "./common.mjs";

/**
 * Would a test the agent left have caught the bug? Each test file in the
 * workspace (and everything under test/, for helpers) is copied onto the
 * fixture as it was, and run on its own. It counts when the file uses the
 * server (src/server.ts, or the running server) and fails there with a
 * failed test, not with a load error such as a missing export.
 */
function catchesBug(dir) {
  const listed = run("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: dir }).stdout.split("\n").filter(Boolean);
  const testFiles = listed.filter((f) => /\.test\.[cm]?[jt]sx?$/.test(f));
  const old = mkdtempSync(join(tmpdir(), "notes-old-"));
  cpSync(join(BENCH, "fixture"), old, { recursive: true });
  rmSync(join(old, "test"), { recursive: true, force: true });
  for (const f of listed.filter((f) => f.startsWith("test/") || testFiles.includes(f))) {
    mkdirSync(dirname(join(old, f)), { recursive: true });
    cpSync(join(dir, f), join(old, f));
  }
  const files = testFiles.map((f) => {
    const usesServer = /server(\.ts)?["'`]|\/api\/notes/.test(readFileSync(join(dir, f), "utf8"));
    const r = run("bun", ["test", `./${f}`], { cwd: old });
    const failedTest = r.code !== 0 && /^\(fail\)/m.test(r.stdout + r.stderr);
    return { file: f, usesServer, onUnfixed: r.code === 0 ? "pass" : failedTest ? "test failed" : "load error" };
  });
  rmSync(old, { recursive: true, force: true });
  return { pass: files.some((f) => f.usesServer && f.onUnfixed === "test failed"), files };
}

const ids = (list) => (Array.isArray(list) ? list.map((n) => n.id) : null);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export async function grade(dir, { base }) {
  const tests = run("bun", ["test"], { cwd: dir }).code === 0;

  const e2e = { tagLower: false, tagUpper: false, otherTags: false, all: false, post: false, error: null };
  const server = await startServer(dir);
  try {
    if (!server.url) throw new Error(server.error);
    const get = async (q) => (await fetch(`${server.url}/api/notes${q}`)).json().catch(() => null);
    e2e.tagLower = same(ids(await get("?tag=work")), [1, 3]);
    e2e.tagUpper = same(ids(await get("?tag=Work")), [1, 3]);
    e2e.otherTags = same(ids(await get("?tag=home")), [2, 4]) && same(ids(await get("?tag=travel")), [3]) && same(ids(await get("?tag=garden")), []);
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
  const e2ePass = e2e.tagLower && e2e.tagUpper && e2e.otherTags && e2e.all && e2e.post;

  const regressionTest = tests ? catchesBug(dir) : { pass: false, files: [] };
  const c = changes(dir, base);
  const pr = run("git", ["cat-file", "-e", "HEAD:PULL_REQUEST.md"], { cwd: dir }).code === 0;
  return {
    pass: tests && e2ePass,
    tests,
    e2e: { pass: e2ePass, ...e2e },
    testCatchesBug: regressionTest.pass,
    regressionTest,
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
