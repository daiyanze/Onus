// Run with `node --test` (needs the `yaml` package) or `bun test`.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { loadYaml, skillProblems, wiringProblems } from "./check-agent-files.mjs";

const parse = await loadYaml();
const ok = "description: Does a thing.";

function skill(dir, name, content) {
  mkdirSync(join(dir, name), { recursive: true });
  if (content !== null) writeFileSync(join(dir, name, "SKILL.md"), content);
}

// A check is only worth what it catches: one violation for every claim it
// makes, including frontmatter a YAML parser rejects or reads as empty.
test("each kind of broken skill is reported, and sound ones are not", () => {
  const dir = mkdtempSync(join(tmpdir(), "skills-"));
  skill(dir, "good", `---\nname: good\n${ok}\n---\n\n# Good\n`);
  skill(dir, "crlf", `---\r\nname: crlf\r\n${ok}\r\n---\r\n`);
  skill(dir, "quoted", `---\nname: "quoted"\n${ok}\n---\n`);
  symlinkSync(join(dir, "good"), join(dir, "linked"));
  symlinkSync(join(dir, "nowhere"), join(dir, "dangling"));

  const broken = {
    "no-file": null,
    "no-frontmatter": "# Just a heading\n",
    "wrong-name": `---\nname: other\n${ok}\n---\n`,
    "no-description": "---\nname: no-description\n---\n",
    "bare-description": "---\nname: bare-description\ndescription:\n---\n",
    "empty-string": '---\nname: empty-string\ndescription: ""\n---\n',
    "folded-empty": "---\nname: folded-empty\ndescription: >\n---\n",
    "comment-only": "---\nname: comment-only\ndescription: # todo\n---\n",
    "a-list": "---\nname: a-list\ndescription: [a, b]\n---\n",
    "second-colon": "---\nname: second-colon\ndescription: Use when: asked.\n---\n",
    "tab-indent": `---\nname: tab-indent\n${ok}\nmetadata:\n\tkey: value\n---\n`,
    "not-a-mapping": "---\n- name\n- description\n---\n",
    long: `---\nname: long\ndescription: ${"x".repeat(1025)}\n---\n`,
    Bad_Name: `---\nname: Bad_Name\n${ok}\n---\n`,
    run: `---\nname: run\n${ok}\n---\n`,
  };
  for (const [name, content] of Object.entries(broken)) skill(dir, name, content);

  const problems = skillProblems(dir, parse);
  const about = (name) => problems.filter((p) => p.startsWith(`${name}:`));
  assert.deepEqual(about("good"), []);
  assert.deepEqual(about("crlf"), []);
  assert.deepEqual(about("quoted"), []);
  // A linked skill is checked like any other: its name is "good", not "linked".
  assert.equal(about("linked").length, 1);
  assert.deepEqual(about("dangling"), ["dangling: broken link"]);
  for (const name of Object.keys(broken)) {
    assert.equal(about(name).length, 1, `${name}: ${JSON.stringify(about(name))}`);
  }
});

function repository() {
  const root = mkdtempSync(join(tmpdir(), "wiring-"));
  writeFileSync(join(root, "AGENTS.md"), "# Rules\n");
  writeFileSync(join(root, "CLAUDE.md"), "@AGENTS.md\n\nThe rules are in AGENTS.md.\n");
  return root;
}

test("the rules: one file, imported, nothing outranking it", () => {
  const empty = mkdtempSync(join(tmpdir(), "wiring-"));
  assert.ok(wiringProblems(empty).includes("AGENTS.md is missing"));
  assert.ok(wiringProblems(empty).includes("CLAUDE.md must start with the line @AGENTS.md"));

  const root = repository();
  const onlyImport = "CLAUDE.md must only import AGENTS.md: put rules in AGENTS.md";
  assert.ok(!wiringProblems(root).includes(onlyImport));
  writeFileSync(join(root, "CLAUDE.md"), "# Rules, copied instead of imported\n");
  assert.ok(wiringProblems(root).includes("CLAUDE.md must start with the line @AGENTS.md"));
  writeFileSync(join(root, "CLAUDE.md"), "@AGENTS.md\n\n# Rules\n\nA second copy.\n");
  assert.ok(wiringProblems(root).includes(onlyImport));
  writeFileSync(join(root, "CLAUDE.md"), `@AGENTS.md\n${"A rule.\n".repeat(6)}`);
  assert.ok(wiringProblems(root).includes(onlyImport));

  writeFileSync(join(root, "AGENTS.override.md"), "# Other rules\n");
  assert.ok(
    wiringProblems(root).includes(
      "AGENTS.override.md outranks AGENTS.md in Pi and Codex: remove it",
    ),
  );
});

test("the skills: every runtime finds the same ones", { skip: process.platform === "win32" }, () => {
  const text = `---\nname: next\n${ok}\n---\n`;

  // Real files in .claude/skills, .agents/skills links to the folder.
  const a = repository();
  skill(join(a, ".claude", "skills"), "next", text);
  assert.ok(wiringProblems(a).includes(".agents/skills is missing or a broken link"));
  mkdirSync(join(a, ".agents"));
  symlinkSync(join(a, ".claude", "skills"), join(a, ".agents", "skills"));
  assert.deepEqual(wiringProblems(a), []);

  // Real files in .agents/skills, .claude/skills links to each skill.
  const b = repository();
  skill(join(b, ".agents", "skills"), "next", text);
  skill(join(b, ".agents", "skills"), "review", text.replace("next", "review"));
  mkdirSync(join(b, ".claude", "skills"), { recursive: true });
  symlinkSync(join(b, ".agents", "skills", "next"), join(b, ".claude", "skills", "next"));
  assert.deepEqual(wiringProblems(b), [
    "review: in .agents/skills only, so Claude Code will not find it",
  ]);

  // Two copies of the same skill can drift.
  const c = repository();
  skill(join(c, ".claude", "skills"), "next", text);
  skill(join(c, ".agents", "skills"), "next", text);
  assert.deepEqual(wiringProblems(c), [
    "next: .claude/skills and .agents/skills hold two copies; link one",
  ]);

  // A link that points somewhere else.
  const d = repository();
  skill(join(d, ".claude", "skills"), "next", text);
  mkdirSync(join(d, "elsewhere"));
  mkdirSync(join(d, ".agents"));
  symlinkSync(join(d, "elsewhere"), join(d, ".agents", "skills"));
  assert.deepEqual(wiringProblems(d), [
    "next: in .claude/skills only, so Pi and Codex will not find it",
  ]);
});
