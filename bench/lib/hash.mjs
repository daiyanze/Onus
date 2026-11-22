import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { BENCH } from "./workspace.mjs";

function walk(dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/**
 * Identifies the bench itself: the fixture, the patches, the prompts and the
 * graders. Results with different hashes measured different tests and are
 * never averaged together.
 */
export function benchHash() {
  const h = createHash("sha256");
  for (const part of ["fixture", "patches", "prompts", "graders"]) {
    for (const f of walk(join(BENCH, part))) {
      h.update(relative(BENCH, f));
      h.update("\0");
      h.update(readFileSync(f));
      h.update("\0");
    }
  }
  return h.digest("hex").slice(0, 12);
}
