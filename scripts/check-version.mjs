#!/usr/bin/env node
/**
 * The Onus release version is written in two places that must agree:
 *   - package.json "version"
 *   - .claude-plugin/plugin.json "version"
 *
 * Skills carry no version of their own. A petition names the wording it is
 * about by the content hash of that SKILL.md (`tr -d '\r' < SKILL.md | git hash-object --stdin`), which
 * changes with every edit and needs no bump; `git log --all
 * --find-object=<hash>` finds the commit that had it
 * (docs/plans/self-improvement.md, "Contract").
 *
 * Fails when the two versions differ, or when a skill's frontmatter still
 * carries the retired `onus-version` key.
 *
 *   node scripts/check-version.mjs [root]
 */
import { readFileSync, readdirSync, existsSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

export function checkVersions(root) {
  const errors = [];
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
  const pluginPath = join(root, ".claude-plugin", "plugin.json");
  if (existsSync(pluginPath)) {
    const plugin = JSON.parse(readFileSync(pluginPath, "utf8")).version;
    if (plugin !== pkg) errors.push(`.claude-plugin/plugin.json has ${plugin}, package.json has ${pkg}`);
  }
  const skillsDir = join(root, "skills");
  if (existsSync(skillsDir)) {
    for (const name of readdirSync(skillsDir).sort()) {
      const file = join(skillsDir, name, "SKILL.md");
      if (!existsSync(file)) continue;
      const fm = /^---\n([\s\S]*?)\n---/.exec(readFileSync(file, "utf8"));
      if (fm && /onus-version/.test(fm[1])) {
        errors.push(`skills/${name}/SKILL.md still has onus-version; skills are identified by their content hash`);
      }
    }
  }
  return { version: pkg, errors };
}

// Compare real paths, as the other check scripts do: a URL escapes spaces.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const { version, errors } = checkVersions(process.argv[2] ?? process.cwd());
  if (errors.length) {
    for (const e of errors) console.error(`version: ${e}`);
    process.exit(1);
  }
  console.log(`versions ok: ${version}`);
}
