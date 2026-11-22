#!/usr/bin/env node
/**
 * Do Claude Code, Pi and Codex all find the same rules and the same skills in
 * this repository?
 *
 *   node scripts/check-agent-files.mjs                  check the repository in the current folder
 *   node scripts/check-agent-files.mjs --root <dir>     check another folder
 *   node scripts/check-agent-files.mjs --skills <dir>   check only the skills in <dir>
 *
 * Prints one line per problem and exits 1 if there is any; exits 2 when it
 * cannot run (unknown option, no YAML parser).
 *
 * This comment is the one place that says what the check covers. Other
 * documents point here instead of repeating it. Every line under "It fails
 * when" has a test in check-agent-files.test.mjs.
 *
 * It fails when:
 * - AGENTS.md is missing, or AGENTS.override.md exists;
 * - CLAUDE.md does not start with the line `@AGENTS.md`, or holds after it
 *   another import (`@path`, anywhere in a line), a heading, a list item, or
 *   more than three lines of text;
 * - .claude/CLAUDE.md exists, or .claude/rules holds a .md file at any depth;
 * - .claude/skills or .agents/skills is missing, a skill is in only one of
 *   them, a skill exists as two copies, or either folder holds a broken link.
 *   None of this line is checked on Windows, where links may be plain files;
 * - a skill has no SKILL.md; its frontmatter is missing, is not valid YAML,
 *   is not a mapping, or repeats a plain top-level key; its name differs from
 *   its folder, is not lowercase words joined by "-", is over 64 characters,
 *   or is `run`, `review` or `code-review`, which Claude Code ships; its
 *   description is missing, empty, not text, or over 1024 characters.
 *
 * It does not see:
 * - whether the lines of text after the import in CLAUDE.md are a note or a
 *   rule;
 * - CLAUDE.local.md anywhere, and CLAUDE.md and AGENTS.md files outside the
 *   repository root (subfolders, the home folder);
 * - other things only one runtime reads: .claude/commands, skill folders in
 *   subfolders, settings files;
 * - other skill names a runtime ships. The three above are the ones seen to
 *   collide; Claude Code bundles more;
 * - on Windows, the skill folders, and a skill's frontmatter when
 *   .claude/skills is a plain file there;
 * - frontmatter that Bun's parser accepts and the `yaml` package refuses,
 *   when it runs on Bun without `yaml` (a repeated plain top-level key
 *   excepted). `yaml` is the parser Pi uses and is preferred when installed;
 *   on Node it is required (`npm i -D yaml`).
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/**
 * Names a runtime already uses. Claude Code ships `run` and `code-review`
 * (also called as `/review`); a project skill with one of these names can be
 * left out of the model's list or replaced there by the bundled one.
 */
const RESERVED = ["run", "review", "code-review"];

/** A YAML parse function: the `yaml` package if installed, otherwise Bun's own. */
export async function loadYaml() {
  try {
    return (await import("yaml")).parse;
  } catch {
    if (typeof Bun !== "undefined" && Bun.YAML) return (text) => Bun.YAML.parse(text);
    throw new Error('no YAML parser: run this with Bun, or add the "yaml" package (npm i -D yaml)');
  }
}

/** The frontmatter of a SKILL.md as a mapping, or a string saying what is wrong. */
function frontmatter(text, parse) {
  const block = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---(\n|$)/)?.[1];
  if (block === undefined) return "SKILL.md does not start with frontmatter";
  // Parsers disagree on a repeated key (Bun keeps one, `yaml` refuses). A
  // plain top-level key, which starts in column 0, is refused here whichever
  // parser runs; quoted or nested repeats are left to the parser.
  const keys = [...block.matchAll(/^([A-Za-z0-9_-]+)[ \t]*:/gm)].map((m) => m[1]);
  const repeated = keys.find((key, at) => keys.indexOf(key) !== at);
  if (repeated !== undefined) return `frontmatter repeats the key "${repeated}"`;
  let parsed;
  try {
    parsed = parse(block);
  } catch (err) {
    const why = err instanceof Error ? err.message.split("\n")[0] : String(err);
    return `frontmatter is not valid YAML (${why})`;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return "frontmatter is not a mapping";
  }
  return parsed;
}

/** True for a folder, and for a link to one: the runtimes follow links. */
function isFolder(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Skill folders under `dir`: name -> real path of its SKILL.md (null if it has
 * none). Links that lead nowhere are added to `broken`.
 */
function skillsIn(dir, broken = []) {
  const found = new Map();
  if (!isFolder(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const folder = join(dir, entry.name);
    if (entry.isSymbolicLink() && !existsSync(folder)) broken.push(entry.name);
    if (!isFolder(folder)) continue;
    const file = join(folder, "SKILL.md");
    found.set(entry.name, existsSync(file) ? realpathSync(file) : null);
  }
  return found;
}

/** Problems with the skills under `skillsDir`, one line each. Empty means fine. */
export function skillProblems(skillsDir, parse) {
  const problems = [];
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    const folder = join(skillsDir, entry.name);
    if (entry.isSymbolicLink() && !existsSync(folder)) {
      problems.push(`${entry.name}: broken link`);
      continue;
    }
    if (!isFolder(folder)) continue;
    const file = join(folder, "SKILL.md");
    if (!existsSync(file)) {
      problems.push(`${entry.name}: no SKILL.md`);
      continue;
    }
    const fields = frontmatter(readFileSync(file, "utf8"), parse);
    if (typeof fields === "string") {
      problems.push(`${entry.name}: ${fields}`);
      continue;
    }
    if (fields.name !== entry.name) {
      problems.push(`${entry.name}: name is ${JSON.stringify(fields.name)}, must match the folder`);
    }
    if (!NAME.test(entry.name) || entry.name.length > 64) {
      problems.push(`${entry.name}: name must be lowercase words joined by "-", 64 chars at most`);
    }
    if (RESERVED.includes(entry.name)) {
      problems.push(`${entry.name}: a runtime already ships a skill with this name`);
    }
    const description = fields.description;
    if (typeof description !== "string" || description.trim() === "") {
      problems.push(`${entry.name}: no description text, so Pi will not load it`);
    } else if (description.length > 1024) {
      problems.push(`${entry.name}: description is over 1024 characters`);
    }
  }
  return problems;
}

/** Problems with how the rules and the skill folders are wired at `root`. */
export function wiringProblems(root) {
  const problems = [];
  if (!existsSync(join(root, "AGENTS.md"))) problems.push("AGENTS.md is missing");
  if (existsSync(join(root, "AGENTS.override.md"))) {
    problems.push("AGENTS.override.md outranks AGENTS.md in Pi and Codex: remove it");
  }
  const claude = existsSync(join(root, "CLAUDE.md"))
    ? readFileSync(join(root, "CLAUDE.md"), "utf8")
    : "";
  const lines = claude.split("\n").filter((line) => line.trim() !== "");
  if (lines[0]?.trim() !== "@AGENTS.md") {
    problems.push("CLAUDE.md must start with the line @AGENTS.md");
  }
  // The import and a short note saying so. Another import anywhere in a line
  // (Claude Code follows `@path` in the middle of a sentence too), a heading,
  // a list or more than three lines of text is a second set of rules.
  const rest = lines.slice(1);
  const more = (line) => /(^|\s)@\S/.test(line) || /^\s*(#|[-*+]\s|\d+[.)]\s)/.test(line);
  if (rest.length > 3 || rest.some(more)) {
    problems.push("CLAUDE.md must only import AGENTS.md: put rules in AGENTS.md");
  }
  // Other places only Claude Code reads rules from.
  if (existsSync(join(root, ".claude", "CLAUDE.md"))) {
    problems.push(".claude/CLAUDE.md holds rules only Claude Code reads: move them to AGENTS.md");
  }
  const rulesDir = join(root, ".claude", "rules");
  let ruleFiles = [];
  try {
    if (isFolder(rulesDir)) ruleFiles = readdirSync(rulesDir, { recursive: true });
  } catch {
    // A folder that cannot be listed (a link that loops) is not a pass.
    ruleFiles = ["unreadable.md"];
  }
  if (ruleFiles.some((name) => String(name).endsWith(".md"))) {
    problems.push(".claude/rules holds rules only Claude Code reads: move them to AGENTS.md");
  }

  // Claude Code reads .claude/skills; Pi and Codex read .agents/skills. Either
  // may be a link to the other, or hold links to each skill.
  const claudeDir = join(root, ".claude", "skills");
  const agentsDir = join(root, ".agents", "skills");
  // A Windows clone without symlinks checks links out as plain files.
  if (process.platform !== "win32") {
    if (!isFolder(claudeDir)) problems.push(".claude/skills is missing or a broken link");
    if (!isFolder(agentsDir)) problems.push(".agents/skills is missing or a broken link");
    const brokenClaude = [];
    const brokenOthers = [];
    const forClaude = skillsIn(claudeDir, brokenClaude);
    const forOthers = skillsIn(agentsDir, brokenOthers);
    // When one folder is a link to the other, a broken link is reported once.
    const sameFolder =
      isFolder(claudeDir) && isFolder(agentsDir) && realpathSync(claudeDir) === realpathSync(agentsDir);
    for (const name of brokenClaude) problems.push(`.claude/skills/${name}: broken link`);
    if (!sameFolder) {
      for (const name of brokenOthers) problems.push(`.agents/skills/${name}: broken link`);
    }
    for (const name of new Set([...forClaude.keys(), ...forOthers.keys()])) {
      if (!forOthers.has(name)) {
        problems.push(`${name}: in .claude/skills only, so Pi and Codex will not find it`);
      } else if (!forClaude.has(name)) {
        problems.push(`${name}: in .agents/skills only, so Claude Code will not find it`);
      } else if (forClaude.get(name) !== forOthers.get(name)) {
        problems.push(`${name}: .claude/skills and .agents/skills hold two copies; link one`);
      }
    }
  }
  return problems;
}

const USAGE = "usage: check-agent-files.mjs [--root <dir>] | [--skills <dir>]";

/** `--root <dir>` or `--skills <dir>`, one at most. Anything else is an error. */
export function options(args) {
  if (args.length === 0) return { root: "." };
  const [flag, dir, ...extra] = args;
  if (extra.length > 0 || !dir || dir.startsWith("--")) throw new Error(USAGE);
  if (flag === "--root") return { root: dir };
  if (flag === "--skills") return { skills: dir };
  throw new Error(USAGE);
}

export async function main(args) {
  const chosen = options(args);
  const parse = await loadYaml();
  let problems;
  if (chosen.skills !== undefined) {
    if (!isFolder(resolve(chosen.skills))) throw new Error(`not a folder: ${chosen.skills}`);
    problems = skillProblems(resolve(chosen.skills), parse);
  } else {
    const root = resolve(chosen.root);
    if (!isFolder(root)) throw new Error(`not a folder: ${chosen.root}`);
    const skills = join(root, ".claude", "skills");
    problems = wiringProblems(root);
    if (isFolder(skills)) {
      // wiringProblems already named broken links, with the folder they are in.
      const named = problems.some((p) => p.endsWith(": broken link"));
      const inSkills = skillProblems(skills, parse);
      problems = problems.concat(named ? inSkills.filter((p) => !p.endsWith(": broken link")) : inSkills);
    }
  }
  for (const problem of problems) console.error(`agent files: ${problem}`);
  if (problems.length === 0) console.log("agent files ok");
  return problems.length === 0 ? 0 : 1;
}

/** True when this file is the program being run, also when reached through a link. */
function isProgram() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isProgram()) {
  try {
    process.exit(await main(process.argv.slice(2)));
  } catch (err) {
    console.error(`agent files: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }
}
