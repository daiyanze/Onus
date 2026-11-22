// The method a trial installs: Onus's skills and templates at a git ref (or
// the working tree), turned into the files an adopted project would have.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { must, run } from "./proc.mjs";

/** The skill a prompt or rule means, by role. Names changed across versions. */
export const ROLES = {
  issue: ["take-case", "next"],
  run: ["docket", "long-run"],
  review: ["cross-examine", "pr-review", "review"],
};

/** Extracts `skills/` (and `bench/fixture-rules/` when the ref has it) at `ref`. */
export function checkout(repo, ref) {
  const dir = mkdtempSync(join(tmpdir(), "onus-method-"));
  if (ref === "worktree") {
    cpSync(join(repo, "skills"), join(dir, "skills"), { recursive: true });
    if (existsSync(join(repo, "bench/fixture-rules"))) {
      cpSync(join(repo, "bench/fixture-rules"), join(dir, "bench/fixture-rules"), { recursive: true });
    }
    const version = JSON.parse(readFileSync(join(repo, "package.json"), "utf8")).version;
    const sha = must("git", ["rev-parse", "--short=7", "HEAD"], { cwd: repo }).trim();
    const dirty = run("git", ["status", "--porcelain", "--", "skills", "bench/fixture-rules"], { cwd: repo }).stdout.trim() !== "";
    return { dir, ref, label: `${version}+${sha}${dirty ? "-dirty" : ""}`, sha };
  }
  const sha = must("git", ["rev-parse", "--short=7", `${ref}^{commit}`], { cwd: repo }).trim();
  const paths = ["skills"];
  if (run("git", ["cat-file", "-e", `${sha}:bench/fixture-rules`], { cwd: repo }).code === 0) paths.push("bench/fixture-rules");
  const tar = join(dir, "method.tar");
  must("git", ["archive", "--format=tar", "-o", tar, sha, ...paths], { cwd: repo });
  must("tar", ["-xf", tar, "-C", dir]);
  rmSync(tar);
  const version = JSON.parse(must("git", ["show", `${sha}:package.json`], { cwd: repo })).version;
  return { dir, ref, label: `${version}+${sha}`, sha };
}

/** Which skill name this version uses for each role. */
export function resolveRoles(skillsDir) {
  const have = new Set(readdirSync(skillsDir));
  const out = {};
  for (const [role, names] of Object.entries(ROLES)) out[role] = names.find((n) => have.has(n)) ?? null;
  return out;
}

const fill = (text, roles) => text.replace(/\{\{skill:(\w+)\}\}/g, (_, r) => roles[r] ?? r);

/**
 * Writes the method into `workspace`: AGENTS.md, CLAUDE.md, docs/, and every
 * skill in .claude/skills with .agents/skills linking to it.
 * `fallbackRules` is used when the ref has no bench/fixture-rules.
 */
export function install(method, workspace, fallbackRules) {
  const skills = join(method.dir, "skills");
  const roles = resolveRoles(skills);
  const templates = readdirSync(skills)
    .map((s) => join(skills, s, "templates"))
    .find((t) => existsSync(join(t, "CLAUDE.template.md")));
  if (!templates) throw new Error(`no templates in ${method.ref}`);
  const own = join(method.dir, "bench/fixture-rules");
  const rulesDir = existsSync(own) ? own : fallbackRules;
  const rules = (f) => readFileSync(join(rulesDir, f), "utf8");

  mkdirSync(join(workspace, ".claude"), { recursive: true });
  cpSync(skills, join(workspace, ".claude/skills"), { recursive: true });
  mkdirSync(join(workspace, ".agents"), { recursive: true });
  symlinkSync("../.claude/skills", join(workspace, ".agents/skills"));

  writeFileSync(join(workspace, "AGENTS.md"), fill(rules("AGENTS.md"), roles));
  writeFileSync(join(workspace, "CLAUDE.md"), readFileSync(join(templates, "CLAUDE.template.md"), "utf8"));
  mkdirSync(join(workspace, "docs"), { recursive: true });
  writeFileSync(join(workspace, "docs/lessons.md"), readFileSync(join(templates, "docs/lessons.md"), "utf8"));
  writeFileSync(join(workspace, "docs/development.md"), development(readFileSync(join(templates, "docs/development.md"), "utf8"), rules("review-checklist.md")));
  return { roles, rulesFrom: rulesDir === own ? method.label : "fallback" };
}

/** The template with the fixture's label and review checklist filled in. */
export function development(template, checklist) {
  let text = template.replaceAll("<agent label>", "agent-ok");
  const start = text.indexOf("## Review checklist");
  if (start !== -1) {
    const end = text.indexOf("\n## ", start + 1);
    const section = text.slice(start, end === -1 ? undefined : end);
    const kept = section.split("\n").filter((l) => !/^\d+\.\s+</.test(l)).join("\n").trimEnd();
    text = text.slice(0, start) + `${kept}\n\n${checklist.trim()}\n` + (end === -1 ? "" : text.slice(end));
  }
  return text;
}

export function cleanup(method) {
  rmSync(method.dir, { recursive: true, force: true });
}

