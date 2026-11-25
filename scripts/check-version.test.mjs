import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkVersions } from "./check-version.mjs";

function repo({ pkg = "1.2.3", plugin = "1.2.3", skill = "" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "onus-version-"));
  writeFileSync(join(root, "package.json"), JSON.stringify({ version: pkg }));
  if (plugin !== null) {
    mkdirSync(join(root, ".claude-plugin"));
    writeFileSync(join(root, ".claude-plugin", "plugin.json"), JSON.stringify({ version: plugin }));
  }
  mkdirSync(join(root, "skills", "a"), { recursive: true });
  writeFileSync(join(root, "skills", "a", "SKILL.md"), `---\nname: a\ndescription: d\n${skill}---\n\n# a\n`);
  return root;
}

test("equal versions pass", () => {
  assert.deepEqual(checkVersions(repo()).errors, []);
});

test("a plugin manifest with another version fails", () => {
  assert.match(checkVersions(repo({ plugin: "1.0.0" })).errors[0], /plugin.json has 1.0.0/);
});

test("no plugin manifest is fine", () => {
  assert.deepEqual(checkVersions(repo({ plugin: null })).errors, []);
});

test("a skill that still carries onus-version fails", () => {
  const { errors } = checkVersions(repo({ skill: 'metadata:\n  onus-version: "1.2.3"\n' }));
  assert.match(errors[0], /skills\/a\/SKILL.md still has onus-version/);
});

test("run directly from a path with a space, it still fails on a mismatch", () => {
  const root = repo({ plugin: "9.9.9" });
  const dir = join(mkdtempSync(join(tmpdir(), "onus version ")), "scripts");
  mkdirSync(dir);
  cpSync(join(dirname(fileURLToPath(import.meta.url)), "check-version.mjs"), join(dir, "check-version.mjs"));
  let code = 0;
  try {
    execFileSync(process.execPath, [join(dir, "check-version.mjs"), root], { stdio: "pipe" });
  } catch (e) {
    code = e.status;
  }
  assert.equal(code, 1);
});
