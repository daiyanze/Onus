// Builds the repository one trial works in. Only the fixture (and, for a
// method arm, the method) goes in; graders and patches stay in bench/.
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { install } from "./method.mjs";
import { git } from "./proc.mjs";

export const BENCH = join(dirname(fileURLToPath(import.meta.url)), "..");
export const CHECKPOINTS = ["cp1", "cp2-buggy", "cp2-clean"];

const overlay = (from, to) => cpSync(join(BENCH, from), to, { recursive: true });

/**
 * A fresh git repository for `checkpoint`. Returns its path, the commit the
 * graders compare against, and what the method install resolved.
 */
export function prepare(checkpoint, method) {
  if (!CHECKPOINTS.includes(checkpoint)) throw new Error(`unknown checkpoint ${checkpoint}`);
  const dir = mkdtempSync(join(tmpdir(), "notes-"));
  overlay("fixture", dir);
  if (checkpoint !== "cp1") {
    rmSync(join(dir, "issues"), { recursive: true, force: true });
    overlay("patches/cp2-base", dir);
  }
  const installed = method ? install(method, dir, join(BENCH, "fixture-rules")) : null;
  git(dir, ["init", "-q"]);
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "Initial commit"]);
  const base = git(dir, ["rev-parse", "HEAD"]).trim();
  if (checkpoint !== "cp1") {
    git(dir, ["checkout", "-q", "-b", "feature/delete-note"]);
    overlay(`patches/${checkpoint === "cp2-buggy" ? "buggy" : "clean"}`, dir);
    git(dir, ["add", "-A"]);
    git(dir, ["commit", "-q", "-m", "feat: delete a note"]);
  }
  const head = git(dir, ["rev-parse", "HEAD"]).trim();
  return { dir, base, head, installed };
}
