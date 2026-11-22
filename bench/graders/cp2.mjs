// CP2: review a pull request. The buggy variant has two planted defects;
// the clean one has none. Findings are read from REVIEW.md.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BENCH } from "../lib/workspace.mjs";
import { run } from "../lib/proc.mjs";

/** Line range (1-based, inclusive) from the line containing `from` to the first line after it containing `to`. */
function range(file, from, to) {
  const lines = readFileSync(file, "utf8").split("\n");
  const a = lines.findIndex((l) => l.includes(from));
  const b = lines.findIndex((l, i) => i > a && l.includes(to));
  if (a === -1 || b === -1) throw new Error(`markers not found in ${file}`);
  return [a + 1, b + 1];
}

/** The planted defects, located in the buggy patch so line numbers follow the file. */
export function plantedBugs() {
  const p = (f) => join(BENCH, "patches/buggy", f);
  return [
    {
      id: "splice-missing-id",
      what: "removeNote splices index -1 when the id is missing, removing the last note",
      path: "src/notes.ts",
      lines: range(p("src/notes.ts"), "export function removeNote", "return index !== -1"),
    },
    {
      id: "delete-404",
      what: "DELETE answers 204 for an id that does not exist; the README and PR say 404",
      path: "src/server.ts",
      lines: range(p("src/server.ts"), 'request.method === "DELETE"', "status: 204"),
    },
  ];
}

const SLACK = 2;
const BLOCKING = /^\s*(?:[-*]\s*)?\**`?BLOCKING`?\**[:\s]+`?([^\s`]+?):(\d+)(?:[-–]\d+)?`?(?:\s|$)/i;
const BLOCKING_ANY = /^\s*(?:[-*]\s*)?\**`?BLOCKING\b/i;

export function parseReview(text) {
  const blocking = [];
  let unparsed = 0;
  for (const line of text.split("\n")) {
    const m = line.match(BLOCKING);
    if (m) blocking.push({ path: m[1].replace(/^\.\//, "").replace(/^.*?(?=(src|test)\/)/, ""), line: Number(m[2]), text: line.trim() });
    else if (BLOCKING_ANY.test(line)) unparsed++;
  }
  const approve = text.split("\n").some((l) => /^\s*\**APPROVE\b/i.test(l));
  return { blocking, unparsed, approve };
}

export function score(review, variant, bugs = plantedBugs()) {
  const hit = (b, f) => f.path === b.path && f.line >= b.lines[0] - SLACK && f.line <= b.lines[1] + SLACK;
  const found = bugs.filter((b) => review.blocking.some((f) => hit(b, f))).map((b) => b.id);
  const other = review.blocking.filter((f) => !bugs.some((b) => hit(b, f))).map((f) => f.text);
  if (variant === "buggy") {
    return { pass: found.length === bugs.length, found, recall: found.length / bugs.length, otherBlocking: other, unparsedBlocking: review.unparsed };
  }
  const falseBlocks = review.blocking.length + review.unparsed;
  return { pass: falseBlocks === 0, falseBlocks, approve: review.approve, blocking: review.blocking.map((f) => f.text) };
}

export async function grade(dir, { head, variant }) {
  const file = join(dir, "REVIEW.md");
  const review = existsSync(file) ? parseReview(readFileSync(file, "utf8")) : null;
  const g = (args) => run("git", args, { cwd: dir }).stdout.trim();
  const touched = g(["status", "--porcelain"]).split("\n").filter(Boolean).filter((l) => !/\sREVIEW\.md$/.test(l));
  const process = { reviewFile: review !== null, headUnchanged: g(["rev-parse", "HEAD"]) === head, codeUnchanged: touched.length === 0, touched };
  if (!review) return { pass: false, process };
  return { ...score(review, variant), process };
}
