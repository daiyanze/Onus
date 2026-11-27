#!/usr/bin/env node
/**
 * Is an exhibit, as the exhibit skill writes it, fit to post?
 *
 *   node check-exhibit.mjs [--section] <file.md>
 *
 * Without `--section` the file is a whole exhibit (a progress issue comment).
 * With it, the file is a PR description and only its `## Exhibit` section is
 * checked. Prints `exhibit ok` and exits 0, or one `<line>: <rule>: <message>`
 * per problem and exits 1. Exits 2 when it cannot run (no file, an unreadable
 * file, an unknown option). A relative picture path is read from the file's
 * folder.
 *
 * This comment is the one place that says what the check covers. Other
 * documents point here instead of repeating it. Every line under "It fails
 * when" has a test in check-exhibit.test.mjs. Record:
 * docs/plans/visible-progress.md, Design 4 and 5.
 *
 * Words used below:
 * - a fenced code block is allowed in one place only: in `## Progress`
 *   (the graph), opening and closing at the start of a line (three or more
 *   backticks with no backtick after them, or tildes; closed by a line of the
 *   same character, at least as long, and nothing else), both inside that
 *   section. Its lines are never headings, claims or counted words. Nothing
 *   else is treated as code: rather than follow every markdown rule for
 *   where a fence ends, the check refuses fences anywhere else, so a claim
 *   cannot hide in one;
 * - text inside a `code` span or an HTML comment is not a link: GitHub does
 *   not render it as one;
 * - an item is a list line (`- `, `* `, `+ ` or `1. `) with the lines that
 *   follow it up to a blank line or the next list line; a paragraph (lines
 *   up to a blank line) that is not an item is one too;
 * - a link is `[text](target)`, `<https://...>` or an http(s) URL, also in
 *   parentheses; a picture is `![text](target)`, an HTML `<img src=...>`, or
 *   a link whose target ends in .png, .jpg, .jpeg, .gif, .webp, .svg, .mp4,
 *   .webm or .mov, or is on github.com/user-attachments/ or
 *   private-user-images.githubusercontent.com (what GitHub inserts for a
 *   pasted image);
 * - a claim is an item of `Promised vs shown`, `Show`, `Changed since you
 *   accepted`, `Numbers` or `Not shown`; in `--section`, an item of `Show`,
 *   `Numbers` or `Not shown`, or anywhere in `## Exhibit` before its first
 *   `### ` heading.
 *
 * It fails when (whole exhibit):
 * - a `## ` heading is not one of, in this order: Bottom line, Needs you,
 *   Promised vs shown, Show, Changed since you accepted, Numbers, Track
 *   record, Progress, Not shown; or comes out of that order, or twice; or
 *   any text comes before the first `## ` heading (rule `heading`);
 * - a line that starts a code fence (three backticks or tildes, at any
 *   indentation) is not part of an allowed fence in `## Progress` (rule
 *   `fence`);
 * - there is no `## Bottom line`, or its first non-empty line is not
 *   `<🟢 On track|🟡 At risk|🔴 Off track> · <n> decision(s) need(s) you ·
 *   <done>/<total> done · updated <YYYY-MM-DD HH:MM>`, optionally followed by
 *   `· not pinned` and then `· in flight: unknown` (rule `bottom-line`);
 * - a `Needs you` item has no `pick:` (rule `needs-you-pick`) or no `risk:`
 *   (rule `needs-you-risk`);
 * - a `Promised vs shown` item does not start with `#<issue> AC<k>` and a
 *   `:` after the criterion (rule `promise-format`), or its criterion, between
 *   `AC<k>` and that `:`, is over eight words (rule `promise-long`);
 * - a `Track record` line holds a percentage and no `<n>/<m>` count (rule
 *   `track-percent`);
 * - the page runs past 300 words, not counting `Needs you` and `Promised vs
 *   shown`, headings, links, pictures and code blocks (rule `length`).
 *
 * It fails when (both modes):
 * - a claim item has no link (rule `claim-no-evidence`);
 * - every link of a claim item is a picture and the item does not hold
 *   `Look-only:` (rule `claim-image-only`);
 * - a `Numbers` item holding a digit has no `code` span, the command (rule
 *   `number-no-command`);
 * - a `Numbers` item that reads as a performance number (a time, a rate or a
 *   size unit, or "faster", "slower", "latency", "throughput") gives no run
 *   count (`<n> runs`, `runs: <n>` or `n=<n>`) (rule `number-no-runs`);
 * - a picture whose target is not an http(s) URL does not exist, relative to
 *   the file (rule `picture-missing`).
 *
 * It fails when (`--section`):
 * - there is no `## Exhibit` heading (rule `section-missing`);
 * - a line in it starts a code fence, at any indentation (rule `fence`);
 * - a `### ` heading inside it is not Show, Numbers or Not shown, or comes
 *   out of that order, or twice (rule `heading`).
 *
 * It does not see:
 * - whether a link points at real evidence, or at evidence of the right kind
 *   for the kind of work (a stored row rather than a page): the witness does;
 * - whether a number is true, or the command produces it;
 * - whether the bottom line's counts match GitHub: progress.mjs writes them;
 * - whether a Needs you item's pick or risk is sound;
 * - an http(s) picture's existence, without the `exists` option.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const PAGE_HEADINGS = [
  "Bottom line",
  "Needs you",
  "Promised vs shown",
  "Show",
  "Changed since you accepted",
  "Numbers",
  "Track record",
  "Progress",
  "Not shown",
];
export const SECTION_HEADINGS = ["Show", "Numbers", "Not shown"];
const PAGE_CLAIMS = ["Promised vs shown", "Show", "Changed since you accepted", "Numbers", "Not shown"];
const LENGTH_EXEMPT = ["Needs you", "Promised vs shown"];
const MAX_WORDS = 300;
const MAX_CRITERION_WORDS = 8;

const BOTTOM_LINE =
  /^(🟢 On track|🟡 At risk|🔴 Off track) · \d+ decisions? needs? you · \d+\/\d+ done · updated \d{4}-\d{2}-\d{2} \d{2}:\d{2}( · not pinned)?( · in flight: unknown)?$/u;
const ITEM = /^(\s*)([-*+]|\d+\.)\s+/;
const MD_LINK = /(!?)\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;
const IMG_TAG = /<img\b[^>]*\bsrc\s*=\s*["']?([^"'\s>]+)[^>]*>/gi;
const BARE_URL = /\bhttps?:\/\/[^\s)>\]"']+/g;
const PICTURE_EXT = /\.(png|jpe?g|gif|webp|svg|mp4|webm|mov)(\?[^\s]*)?$/i;
const PICTURE_HOST = /^https?:\/\/(github\.com\/user-attachments\/|private-user-images\.githubusercontent\.com\/)/i;
const FENCE_OPEN = /^(`{3,}|~{3,})(.*)$/;

const FENCE_LIKE = /^\s*(`{3,}|~{3,})/;

/**
 * Lines of allowed fences between from and to (0-based, end exclusive): a
 * fence at the start of a line that also closes before `to`.
 */
function allowedFences(lines, from, to) {
  const fenced = new Array(lines.length).fill(false);
  for (let i = from; i < to; i++) {
    const open = lines[i].match(FENCE_OPEN);
    if (!open || (open[1][0] === "`" && open[2].includes("`"))) continue;
    const char = open[1][0];
    const close = new RegExp(`^\\${char}{${open[1].length},}\\s*$`);
    let j = i + 1;
    while (j < to && !close.test(lines[j])) j++;
    if (j === to) continue;
    for (let k = i; k <= j; k++) fenced[k] = true;
    i = j;
  }
  return fenced;
}

/** A `fence` problem for each fence-like line from..to that is not allowed. */
function strayFences(lines, from, to, fenced, problems) {
  for (let i = from; i < to; i++) {
    if (!fenced[i] && FENCE_LIKE.test(lines[i])) {
      problems.push({ line: i + 1, rule: "fence", message: "code fences are allowed only in `## Progress`, at the start of a line; put a command in a `code` span" });
    }
  }
}

const HIDDEN = (text) => text.replace(/<!--[\s\S]*?-->/g, " ").replace(/(`+)[\s\S]*?\1/g, " ");
const isPicture = (target) => PICTURE_EXT.test(target) || PICTURE_HOST.test(target);
const PERF =
  /(\d(\.\d+)?\s?(ms|µs|us|ns|s|sec|secs|seconds|min|req\/s|rps|ops\/s|qps|kb|mb|gb|kib|mib|gib)\b)|\b(faster|slower|latency|throughput)\b/i;
const RUNS = /\b\d+\s+runs?\b|\bruns?:\s*\d+|\bn\s*=\s*\d+/i;

/** Links in a text: {target, picture}. */
function links(text) {
  const found = [];
  const rest = HIDDEN(text)
    .replace(IMG_TAG, (_, target) => {
      found.push({ target, picture: true });
      return " ";
    })
    .replace(MD_LINK, (_, bang, _label, target) => {
      found.push({ target, picture: bang === "!" || isPicture(target) });
      return " ";
    });
  for (const url of rest.match(BARE_URL) ?? []) found.push({ target: url, picture: isPicture(url) });
  return found;
}

/** Words of a line, without links, pictures and markdown punctuation. */
function words(line) {
  const text = line.replace(/<!--[\s\S]*?-->/g, " ").replace(IMG_TAG, " ").replace(MD_LINK, " ").replace(BARE_URL, " ").replace(ITEM, " ").replace(/[`*_>#|]/g, " ");
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/**
 * Splits lines from..to into sections by headings of one level, outside
 * fenced code. `before` holds the lines before the first such heading.
 * @returns {{before: Section, found: Section[]}} where Section is
 *   {name: string | null, line: number, body: {text: string, line: number, fenced: boolean}[]}
 */
function sections(lines, level, from = 0, to = lines.length, isFenced = []) {
  const mark = "#".repeat(level) + " ";
  const out = [];
  const before = { name: null, line: from + 1, body: [] };
  let current = before;
  for (let i = from; i < to; i++) {
    const text = lines[i];
    const fenced = Boolean(isFenced[i]);
    if (!fenced && text.startsWith(mark)) {
      current = { name: text.slice(mark.length).trim(), line: i + 1, body: [] };
      out.push(current);
    } else {
      current.body.push({ text, line: i + 1, fenced });
    }
  }
  return { before, found: out };
}

/** Claim units of a section body: each list line, or paragraph, with the lines after it up to a blank or the next list line. */
function items(body) {
  const out = [];
  let current = null;
  for (const { text, line, fenced } of body) {
    if (fenced || text.trim() === "") {
      current = null;
      continue;
    }
    const m = text.match(ITEM);
    if ((m && m[1].length === 0) || !current) {
      current = { line, text };
      out.push(current);
    } else {
      current.text += "\n" + text;
    }
  }
  return out;
}

const hasText = (body) => body.some((b) => !b.fenced && b.text.trim() !== "");

function checkHeadings(found, allowed, problems) {
  let last = -1;
  const seen = new Set();
  for (const s of found) {
    const at = allowed.indexOf(s.name);
    if (at === -1) {
      problems.push({ line: s.line, rule: "heading", message: `unknown heading "${s.name}"; allowed, in order: ${allowed.join(", ")}` });
      continue;
    }
    if (seen.has(s.name)) {
      problems.push({ line: s.line, rule: "heading", message: `"${s.name}" appears twice` });
    } else if (at < last) {
      problems.push({ line: s.line, rule: "heading", message: `"${s.name}" is out of order; allowed, in order: ${allowed.join(", ")}` });
    }
    seen.add(s.name);
    last = Math.max(last, at);
  }
}

function checkClaims(found, claimNames, exists, problems) {
  for (const s of found) {
    if (!claimNames.includes(s.name)) continue;
    for (const item of items(s.body)) {
      const ls = links(item.text);
      if (ls.length === 0) {
        problems.push({ line: item.line, rule: "claim-no-evidence", message: "a claim needs a link to its evidence" });
      } else if (ls.every((l) => l.picture) && !item.text.includes("Look-only:")) {
        problems.push({
          line: item.line,
          rule: "claim-image-only",
          message: "a picture alone proves nothing: link the state it changed, or mark the claim `Look-only:`",
        });
      }
      for (const l of ls) {
        if (l.picture && !/^https?:\/\//.test(l.target) && !exists(l.target)) {
          problems.push({ line: item.line, rule: "picture-missing", message: `picture not found: ${l.target}` });
        }
      }
      if (s.name === "Numbers" && /\d/.test(item.text.replace(IMG_TAG, " ").replace(MD_LINK, " ").replace(BARE_URL, " "))) {
        if (!/`[^`]+`/.test(item.text)) {
          problems.push({ line: item.line, rule: "number-no-command", message: "a number needs the command that produced it, in `code`" });
        }
        if (PERF.test(item.text) && !RUNS.test(item.text)) {
          problems.push({ line: item.line, rule: "number-no-runs", message: "a performance number needs its run count (`5 runs`, `n=5`)" });
        }
      }
    }
  }
}

/**
 * @param {string} markdown
 * @param {{mode?: 'page' | 'section', exists?: (target: string) => boolean}} [options]
 * @returns {{line: number, rule: string, message: string}[]}
 */
export function checkExhibit(markdown, { mode = "page", exists = () => true } = {}) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const problems = [];

  if (mode === "section") {
    const exhibit = sections(lines, 2).found.find((s) => s.name === "Exhibit");
    if (!exhibit) return [{ line: 1, rule: "section-missing", message: "no `## Exhibit` section" }];
    const end = exhibit.body.length ? exhibit.body[exhibit.body.length - 1].line : exhibit.line;
    strayFences(lines, exhibit.line, end, [], problems);
    const { before, found: sub } = sections(lines, 3, exhibit.line, end);
    checkHeadings(sub, SECTION_HEADINGS, problems);
    checkClaims([{ ...before, name: "Show" }, ...sub], SECTION_HEADINGS, exists, problems);
    return problems.sort((a, b) => a.line - b.line);
  }

  // Fences are allowed only inside Progress; find its lines before splitting the page.
  const progressAt = lines.findIndex((t) => t.trim() === "## Progress");
  let fenced = [];
  if (progressAt !== -1) {
    let end = progressAt + 1;
    const isPageHeading = (t) => t.startsWith("## ") && PAGE_HEADINGS.includes(t.slice(3).trim());
    while (end < lines.length && !isPageHeading(lines[end])) end++;
    fenced = allowedFences(lines, progressAt + 1, end);
  }
  strayFences(lines, 0, lines.length, fenced, problems);
  const { before, found } = sections(lines, 2, 0, lines.length, fenced);
  checkHeadings(found, PAGE_HEADINGS, problems);
  if (hasText(before.body)) {
    const first = before.body.find((b) => !b.fenced && b.text.trim() !== "");
    problems.push({ line: first.line, rule: "heading", message: "text before the first heading; an exhibit starts with `## Bottom line`" });
  }

  const bottom = found.find((s) => s.name === "Bottom line");
  if (!bottom) {
    problems.push({ line: 1, rule: "bottom-line", message: "no `## Bottom line`" });
  } else {
    const first = bottom.body.find((b) => !b.fenced && b.text.trim() !== "");
    if (!first || !BOTTOM_LINE.test(first.text.trim())) {
      problems.push({
        line: first ? first.line : bottom.line,
        rule: "bottom-line",
        message: "expected `<🟢 On track|🟡 At risk|🔴 Off track> · <n> decisions need you · <done>/<total> done · updated <YYYY-MM-DD HH:MM>[ · not pinned][ · in flight: unknown]`",
      });
    }
  }

  for (const s of found.filter((s) => s.name === "Needs you")) {
    for (const item of items(s.body)) {
      if (!/\bpick:/i.test(item.text)) problems.push({ line: item.line, rule: "needs-you-pick", message: "a decision needs the agent's `pick:`" });
      if (!/\brisk:/i.test(item.text)) problems.push({ line: item.line, rule: "needs-you-risk", message: "a decision needs its `risk:`, even when low" });
    }
  }

  for (const s of found.filter((s) => s.name === "Promised vs shown")) {
    for (const item of items(s.body)) {
      const first = item.text.split("\n")[0].replace(ITEM, "");
      const m = first.match(/^#\d+ AC\d+\s+([^:]*):/);
      if (!m) {
        problems.push({ line: item.line, rule: "promise-format", message: "expected `#<issue> AC<k> <criterion, up to eight words>: <status>`" });
      } else if (words(m[1]) > MAX_CRITERION_WORDS) {
        problems.push({ line: item.line, rule: "promise-long", message: `cite the criterion in at most ${MAX_CRITERION_WORDS} words` });
      }
    }
  }

  for (const s of found.filter((s) => s.name === "Track record")) {
    for (const b of s.body) {
      if (/\d(\.\d+)?\s?%/.test(b.text) && !/\d+\s*\/\s*\d+/.test(b.text)) {
        problems.push({ line: b.line, rule: "track-percent", message: "give counts (`3/4`), never a bare percentage" });
      }
    }
  }

  checkClaims(found, PAGE_CLAIMS, exists, problems);

  let count = 0;
  for (const s of found) {
    if (LENGTH_EXEMPT.includes(s.name)) continue;
    for (const b of s.body) if (!b.fenced) count += words(b.text);
  }
  if (count > MAX_WORDS) {
    problems.push({ line: 1, rule: "length", message: `${count} words outside Needs you and Promised vs shown; at most ${MAX_WORDS}` });
  }

  return problems.sort((a, b) => a.line - b.line);
}

/** Command line; returns the exit code. */
export function main(args) {
  let mode = "page";
  const files = [];
  for (const arg of args) {
    if (arg === "--section") mode = "section";
    else if (arg.startsWith("-")) throw new Error(`unknown option ${arg}; usage: check-exhibit.mjs [--section] <file.md>`);
    else files.push(arg);
  }
  if (files.length !== 1) throw new Error("usage: check-exhibit.mjs [--section] <file.md>");
  const file = resolve(files[0]);
  const text = readFileSync(file, "utf8");
  const exists = (target) => existsSync(resolve(dirname(file), target));
  const problems = checkExhibit(text, { mode, exists });
  for (const p of problems) console.error(`${p.line}: ${p.rule}: ${p.message}`);
  if (problems.length > 0) return 1;
  console.log("exhibit ok");
  return 0;
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
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    console.error(`exhibit: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }
}
