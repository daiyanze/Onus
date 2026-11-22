// Run with `node --test` (needs the `yaml` package) or `bun test`.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { loadYaml, options, skillProblems, wiringProblems } from "./check-agent-files.mjs";

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

  const tooLong = "a".repeat(65);
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
    "twice": `---\nname: twice\n${ok}\ndescription: Does another thing.\n---\n`,
    "tab-indent": `---\nname: tab-indent\n${ok}\nmetadata:\n\tkey: value\n---\n`,
    "not-a-mapping": "---\n- name\n- description\n---\n",
    long: `---\nname: long\ndescription: ${"x".repeat(1025)}\n---\n`,
    Bad_Name: `---\nname: Bad_Name\n${ok}\n---\n`,
    run: `---\nname: run\n${ok}\n---\n`,
    review: `---\nname: review\n${ok}\n---\n`,
    "code-review": `---\nname: code-review\n${ok}\n---\n`,
    [tooLong]: `---\nname: ${tooLong}\n${ok}\n---\n`,
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
  // The repeated key is named by this check, whichever parser is in use.
  assert.deepEqual(about("twice"), ['twice: frontmatter repeats the key "description"']);
  for (const name of ["run", "review", "code-review"]) {
    assert.match(about(name)[0], /already ships/);
  }
});

test("the yaml package is the parser when it is installed", async (t) => {
  const installed = await import("yaml").then(
    () => true,
    () => false,
  );
  if (!installed) return t.skip("the yaml package is not installed");
  // Bun's own parser accepts a repeated quoted key; `yaml`, which Pi uses, refuses it.
  assert.throws(() => parse('"a": 1\n"a": 2\n'));
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
  for (const more of [
    "A rule.\n".repeat(4),
    "@docs/more-rules.md\n",
    "For Claude Code, also follow @docs/claude-only-rules.md when you edit.\n",
    "# More rules\n",
    "- Always do this.\n",
    "1. Always do this.\n",
  ]) {
    writeFileSync(join(root, "CLAUDE.md"), `@AGENTS.md\n\n${more}`);
    assert.ok(wiringProblems(root).includes(onlyImport), JSON.stringify(more));
  }
  writeFileSync(join(root, "CLAUDE.md"), "@AGENTS.md\n\nThe rules are in AGENTS.md.\n");

  mkdirSync(join(root, ".claude", "rules"), { recursive: true });
  assert.ok(!wiringProblems(root).some((p) => p.startsWith(".claude/rules")));
  mkdirSync(join(root, ".claude", "rules", "frontend"));
  writeFileSync(join(root, ".claude", "rules", "frontend", "style.md"), "Use tabs.\n");
  assert.ok(wiringProblems(root).some((p) => p.startsWith(".claude/rules")), "a nested rules file");
  writeFileSync(join(root, ".claude", "rules", "style.md"), "Use tabs.\n");
  assert.ok(wiringProblems(root).some((p) => p.startsWith(".claude/rules")));
  writeFileSync(join(root, ".claude", "CLAUDE.md"), "Use tabs.\n");
  assert.ok(wiringProblems(root).some((p) => p.startsWith(".claude/CLAUDE.md")));

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

  // Skills for Pi and Codex only: Claude Code has no skills folder at all.
  const e = repository();
  skill(join(e, ".agents", "skills"), "next", text);
  assert.ok(wiringProblems(e).includes(".claude/skills is missing or a broken link"));

  // A link left behind that leads nowhere, in either folder.
  const f = repository();
  skill(join(f, ".claude", "skills"), "next", text);
  skill(join(f, ".agents", "skills"), "next", text);
  symlinkSync("../.claude/skills", join(f, ".agents", "skills", "skills"));
  symlinkSync(join(f, "gone"), join(f, ".claude", "skills", "old"));
  const found = wiringProblems(f);
  assert.ok(found.includes(".agents/skills/skills: broken link"), JSON.stringify(found));
  assert.ok(found.includes(".claude/skills/old: broken link"), JSON.stringify(found));

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

// The command line is what a project's check command runs, so it is tested as
// a program: exit codes, output, and being reached through a link.
const script = fileURLToPath(new URL("./check-agent-files.mjs", import.meta.url));
const run = (file, args, cwd) =>
  spawnSync(process.execPath, [file, ...args], { cwd, encoding: "utf8" });

function sound() {
  const root = repository();
  skill(join(root, ".claude", "skills"), "next", `---\nname: next\n${ok}\n---\n`);
  mkdirSync(join(root, ".agents"));
  symlinkSync(join(root, ".claude", "skills"), join(root, ".agents", "skills"));
  return root;
}

test("as a program: 0 and a line when sound, 1 and the problems when not", () => {
  const good = sound();
  for (const result of [run(script, ["--root", good]), run(script, [], good)]) {
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /agent files ok/);
  }

  const empty = mkdtempSync(join(tmpdir(), "cli-"));
  const bad = run(script, ["--root", empty]);
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /agent files: AGENTS\.md is missing/);
  // --root is honoured: the sound folder is not what gets checked.
  assert.equal(run(script, ["--root", empty], good).status, 1);

  // Default mode also reads the skills' frontmatter.
  const noText = sound();
  skill(join(noText, ".claude", "skills"), "next", "---\nname: next\n---\n");
  const result = run(script, ["--root", noText]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /next: no description text/);

  const only = run(script, ["--skills", join(noText, ".claude", "skills")]);
  assert.equal(only.status, 1);
});

test("as a program: reached through a link it still checks", { skip: process.platform === "win32" }, () => {
  const empty = mkdtempSync(join(tmpdir(), "cli-"));
  const links = mkdtempSync(join(tmpdir(), "cli-links-"));
  symlinkSync(script, join(links, "check.mjs"));
  symlinkSync(empty, join(links, "repo"));
  assert.equal(run(join(links, "check.mjs"), ["--root", empty]).status, 1);
  assert.equal(run(script, ["--root", join(links, "repo")]).status, 1);
});

test("as a program: an option it does not know is an error, not a pass", () => {
  const malformed = [["--root=x"], ["--rooot", "x"], ["--root"], ["--root", ""], ["--root", "a", "b"], ["x"]];
  for (const args of malformed) {
    assert.throws(() => options(args), /usage/, JSON.stringify(args));
  }
  const good = sound();
  const result = run(script, ["--root=/nowhere"], good);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage/);
  assert.equal(run(script, ["--root", join(good, "missing")]).status, 2);
});
