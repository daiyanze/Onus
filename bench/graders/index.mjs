import * as cp1 from "./cp1.mjs";
import * as cp2 from "./cp2.mjs";

export function grade(checkpoint, dir, ws) {
  if (checkpoint === "cp1") return cp1.grade(dir, ws);
  return cp2.grade(dir, { ...ws, variant: checkpoint === "cp2-buggy" ? "buggy" : "clean" });
}
