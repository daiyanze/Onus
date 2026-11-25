import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkVersions, skillVersion } from "./check-version.mjs";

function repo({ pkg = "1.2.3", plugin = "1.2.3", skills = { a: "1.2.3" } } = {}) {
  const root = mkdtempSync(join(tmpdir(), "onus-version-"));
  writeFileSync(join(root, "package.json"), JSON.stringify({ version: pkg }));
  if (plugin !== null) {
    mkdirSync(join(root, ".claude-plugin"));
    writeFileSync(join(root, ".claude-plugin", "plugin.json"), JSON.stringify({ version: plugin }));
  }
  for (const [name, v] of Object.entries(skills)) {
    mkdirSync(join(root, "skills", name), { recursive: true });
    const meta = v === null ? "" : `metadata:\n  onus-version: "${v}"\n`;
    writeFileSync(join(root, "skills", name, "SKILL.md"), `---\nname: ${name}\ndescription: d\n${meta}---\n\n# ${name}\n`);
  }
  return root;
}

test("all equal passes", () => {
  assert.deepEqual(checkVersions(repo()).errors, []);
});

test("a skill without onus-version fails", () => {
  const { errors } = checkVersions(repo({ skills: { a: "1.2.3", b: null } }));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /skills\/b\/SKILL.md has no metadata.onus-version/);
});

test("a skill with another version than package.json fails", () => {
  const { errors } = checkVersions(repo({ skills: { a: "1.2.2" } }));
  assert.match(errors[0], /onus-version 1.2.2, package.json has 1.2.3/);
});

test("a plugin manifest with another version fails", () => {
  const { errors } = checkVersions(repo({ plugin: "1.0.0" }));
  assert.match(errors[0], /plugin.json has 1.0.0/);
});

test("no plugin manifest is fine", () => {
  assert.deepEqual(checkVersions(repo({ plugin: null })).errors, []);
});

test("onus-version outside metadata does not count", () => {
  assert.equal(skillVersion("---\nname: a\nonus-version: 1.2.3\n---\n"), null);
});

test("unquoted value is read", () => {
  assert.equal(skillVersion("---\nname: a\nmetadata:\n  onus-version: 0.4.0\n---\n"), "0.4.0");
});

import { execFileSync } from "node:child_process";
import { cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

test("run directly from a path with a space, it still fails on a mismatch", () => {
  const root = repo({ pkg: "9.9.9" });
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

test("the one-line form metadata: {onus-version: ...} is read", () => {
  assert.equal(skillVersion('---\nname: a\nmetadata: {onus-version: "0.4.0"}\n---\n'), "0.4.0");
});
