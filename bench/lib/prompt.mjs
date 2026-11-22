import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BENCH } from "./workspace.mjs";

/**
 * The prompt for a checkpoint. Every arm gets the same words, except that a
 * method arm is told which of its skills to use. `roles` is null for "none".
 */
export function prompt(checkpoint, roles) {
  const file = checkpoint === "cp1" ? "cp1.md" : "cp2.md";
  const shared = readFileSync(join(BENCH, "prompts/shared.md"), "utf8").trim();
  return readFileSync(join(BENCH, "prompts", file), "utf8")
    .replace("{{shared}}", shared)
    .replace(/\{\{use:(\w+)\}\}/g, (_, role) => (roles?.[role] ? `Use the \`${roles[role]}\` skill for this.` : ""))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
