#!/usr/bin/env node
/**
 * The Onus version must be the same in every place it is written, so a
 * petition can say which wording it is about (docs/plans/self-improvement.md,
 * "Contract"):
 *   - package.json "version"
 *   - .claude-plugin/plugin.json "version"
 *   - every skills/<name>/SKILL.md frontmatter: metadata: { onus-version }
 *
 * Fails when a skill has no onus-version, or any of them differs from
 * package.json. It does not check that the version was bumped: that stays a
 * rule for the owner (README, "Versions").
 *
 *   node scripts/check-version.mjs [root]
 */
import { readFileSync, readdirSync, existsSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

export function skillVersion(text) {
  const fm = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!fm) return null;
  // The flow form: metadata: {onus-version: "x.y.z"}
  const flow = /^metadata:\s*\{([^}]*)\}\s*$/m.exec(fm[1]);
  if (flow) {
    const v = /(?:^|,)\s*["']?onus-version["']?\s*:\s*["']?([^"',\s}]+)["']?/.exec(flow[1]);
    return v ? v[1] : null;
  }
  // The block form: metadata:\n  onus-version: "x.y.z"
  const block = /^metadata:\s*\n((?:[ \t]+.*\n?)*)/m.exec(fm[1] + "\n");
  if (!block) return null;
  const v = /^[ \t]+onus-version:\s*["']?([^"'\s]+)["']?\s*$/m.exec(block[1]);
  return v ? v[1] : null;
}

export function checkVersions(root) {
  const errors = [];
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
  const pluginPath = join(root, ".claude-plugin", "plugin.json");
  if (existsSync(pluginPath)) {
    const plugin = JSON.parse(readFileSync(pluginPath, "utf8")).version;
    if (plugin !== pkg) errors.push(`.claude-plugin/plugin.json has ${plugin}, package.json has ${pkg}`);
  }
  const skillsDir = join(root, "skills");
  for (const name of readdirSync(skillsDir).sort()) {
    const file = join(skillsDir, name, "SKILL.md");
    if (!existsSync(file)) continue;
    const v = skillVersion(readFileSync(file, "utf8"));
    if (v === null) errors.push(`skills/${name}/SKILL.md has no metadata.onus-version`);
    else if (v !== pkg) errors.push(`skills/${name}/SKILL.md has onus-version ${v}, package.json has ${pkg}`);
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
