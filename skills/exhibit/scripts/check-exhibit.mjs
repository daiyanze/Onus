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
 * file, an unknown option, markdown-it not installed). A relative picture
 * path is read from the file's folder.
 *
 * This comment is the one place that says what the check covers. Other
 * documents point here instead of repeating it. Every line under "It fails
 * when" has a test in check-exhibit.test.mjs. Record:
 * docs/plans/visible-progress.md, Design 4 and 5.
 *
 * The format. An exhibit is written by the exhibit skill, not by hand. The
 * check reads it with markdown-it, as GitHub renders it (CommonMark and
 * GFM tables), and accepts only these blocks:
 * - an ATX heading: `## ` (in `--section`, inside `## Exhibit`: `### `);
 * - a paragraph;
 * - a list one level deep whose items hold only paragraphs;
 * - in `## Progress` only, a fenced code block (the graph).
 * Inline, the only HTML is an `<img>` whose attributes are double-quoted,
 * among src, alt, title, width and height, with an https src. Footnotes and
 * `$...$` (GitHub renders math) are refused too. Without markdown-it the
 * check does not run: it exits 2 and says so.
 *
 * Words used below:
 * - a link is what GitHub renders as one: `[text](target)`, a reference
 *   link, `<https://...>`, or a bare http(s) URL at a line's start or after
 *   a space, `*`, `_`, `~` or `(`. Its text must hold a letter or a digit,
 *   or a picture. Nothing inside a picture (alt text, title, attributes)
 *   and nothing in a `code` span is a link;
 * - a picture is `![text](target)`, an allowed `<img>`, or a link whose
 *   target ends in .png, .jpg, .jpeg, .gif, .webp, .svg, .mp4, .webm or
 *   .mov, or is on github.com/user-attachments/ or
 *   private-user-images.githubusercontent.com (what GitHub inserts for a
 *   pasted image);
 * - an item is a list item, or a paragraph that is not in a list;
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
 * - a fenced code block is outside `## Progress`, or inside a list item
 *   (rule `fence`);
 * - a block is none of those above: a quote, a table, an HTML block,
 *   indented code, a rule, another heading level or a setext heading, a
 *   nested list; or the page has a footnote or `$...$` (rule `format`);
 * - inline HTML is not an allowed `<img>`, comments included (rule
 *   `markup`);
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
 *   shown`, headings, link text, pictures and code blocks (rule `length`).
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
 * - a fenced code block is in it (rule `fence`);
 * - a block in it is none of those above, with `### ` headings (rule
 *   `format`), or its inline HTML is not an allowed `<img>` (rule `markup`);
 * - a `### ` heading inside it is not Show, Numbers or Not shown, or comes
 *   out of that order, or twice (rule `heading`).
 *
 * It does not see:
 * - whether a link points at real evidence, or at evidence of the right kind
 *   for the kind of work (a stored row rather than a page): the witness does;
 * - whether a number is true, or the command produces it;
 * - whether the bottom line's counts match GitHub: progress.mjs writes them;
 * - whether a Needs you item's pick or risk is sound;
 * - an http(s) picture's existence, without the `exists` option;
 * - links GitHub adds that markdown-it does not (`#123` references, `www.`
 *   links): the check reads them as text, so it is stricter there, not looser.
 */
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** markdown-it reads the page the way GitHub renders it; without it the check cannot run. */
let MarkdownIt = null;
try {
  ({ default: MarkdownIt } = await import("markdown-it"));
} catch {
  MarkdownIt = null;
}
export const PARSER_MISSING = "the markdown-it package is not installed; run `npm install` (the check needs it to read markdown as GitHub renders it)";

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
const PICTURE_EXT = /\.(png|jpe?g|gif|webp|svg|mp4|webm|mov)(\?[^\s]*)?$/i;
const PICTURE_HOST = /^https?:\/\/(github\.com\/user-attachments\/|private-user-images\.githubusercontent\.com\/)/i;
/** The one HTML allowed: an <img> with double-quoted attributes from this list and an https src. */
const IMG_OK = /^<img(?: (?:src|alt|title|width|height)="[^"<>]*")+ ?\/?>$/;
const IMG_SRC = /\bsrc="(https:\/\/[^"\s<>]+)"/;
const PERF =
  /(\d(\.\d+)?\s?(ms|µs|us|ns|s|sec|secs|seconds|min|req\/s|rps|ops\/s|qps|kb|mb|gb|kib|mib|gib)\b)|\b(faster|slower|latency|throughput)\b/i;
const RUNS = /\b\d+\s+runs?\b|\bruns?:\s*\d+|\bn\s*=\s*\d+/i;
const MATH = /\$[^$]*\$/;

const isPicture = (target) => PICTURE_EXT.test(target) || PICTURE_HOST.test(target);
const countWords = (text) => text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const lineOf = (token, fallback = 1) => (token.map ? token.map[0] + 1 : fallback);

function parser() {
  if (!MarkdownIt) throw new Error(PARSER_MISSING);
  const md = new MarkdownIt({ html: true, linkify: true });
  md.linkify.set({ fuzzyLink: false, fuzzyEmail: false });
  return md;
}

/**
 * What one inline token renders: its links and pictures, its text outside
 * links (`plain`), all its text (`all`), whether it holds a `code` span,
 * and its problems (HTML other than a sound <img>, math).
 */
function readInline(inline) {
  const out = { links: [], plain: "", all: "", code: false, problems: [] };
  const line = lineOf(inline);
  const withoutCode = inline.content.replace(/(`+)[\s\S]*?\1/g, " ");
  if (MATH.test(withoutCode) || withoutCode.includes("$$")) {
    out.problems.push({ line, rule: "format", message: "no `$...$`: GitHub renders it as math" });
  }
  let link = null;
  let prev = null;
  for (const c of inline.children ?? []) {
    const add = (text) => {
      out.all += text;
      if (link) link.label += text;
      else out.plain += text;
    };
    if (c.type === "link_open") {
      // GitHub links a bare URL only at a line's start or after a space, `*`, `_`, `~` or `(`.
      const after = /(^|[\s*_~(])$/.test(prev?.type === "text" ? prev.content : prev ? " " : "");
      link = { target: c.attrGet("href") ?? "", label: "", image: false, dropped: c.markup === "linkify" && !after };
    } else if (c.type === "link_close") {
      if (link && !link.dropped && (/[\p{L}\p{N}]/u.test(link.label) || link.image)) out.links.push({ target: link.target, picture: isPicture(link.target) });
      link = null;
    } else if (c.type === "image") {
      // The alt text is not rendered as text, and nothing inside it is a link.
      out.links.push({ target: c.attrGet("src") ?? "", picture: true });
      if (link) link.image = true;
      out.all += " ";
    } else if (c.type === "text") {
      add(c.content);
    } else if (c.type === "code_inline") {
      out.code = true;
      add(c.content);
    } else if (c.type === "softbreak" || c.type === "hardbreak") {
      add("\n");
    } else if (c.type === "html_inline") {
      const src = IMG_OK.test(c.content) && c.content.match(IMG_SRC);
      if (src) {
        out.links.push({ target: src[1], picture: true });
        if (link) link.image = true;
      } else {
        out.problems.push({
          line,
          rule: "markup",
          message: `no HTML but <img src="https://..."> with double-quoted src, alt, title, width or height: ${c.content.slice(0, 40)}`,
        });
      }
      add(" ");
    }
    prev = c;
  }
  return out;
}

/** Joins what several inline tokens render (an item's paragraphs). */
function merge(reads) {
  return {
    links: reads.flatMap((r) => r.links),
    plain: reads.map((r) => r.plain).join(" "),
    all: reads.map((r) => r.all).join(" "),
    code: reads.some((r) => r.code),
    problems: reads.flatMap((r) => r.problems),
  };
}

/** Index of the token that closes the one at `i`. */
function closing(tokens, i) {
  const t = tokens[i];
  if (t.nesting !== 1) return i;
  const type = t.type.replace(/_open$/, "_close");
  let j = i + 1;
  while (j < tokens.length && !(tokens[j].type === type && tokens[j].level === t.level)) j++;
  return j;
}

/**
 * The page's top-level blocks, as GitHub renders them. Only these are
 * exhibit blocks: an ATX heading, a paragraph, a one-level list whose items
 * hold only paragraphs, and a fenced code block. Anything else is a `bad`
 * block with its rule.
 * Block: {type: 'heading'|'paragraph'|'item'|'fence'|'bad', line, level?, atx?, read?, rule?, message?}
 */
function blocks(md, text) {
  const env = {};
  const tokens = md.parse(text, env);
  const out = [];
  const bad = (token, rule, message) => out.push({ type: "bad", line: lineOf(token), rule, message });
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "heading_open") {
      const inline = tokens[i + 1];
      out.push({ type: "heading", line: lineOf(t), level: Number(t.tag.slice(1)), atx: t.markup.startsWith("#"), name: inline.content.trim(), read: readInline(inline) });
      i = closing(tokens, i);
    } else if (t.type === "paragraph_open") {
      out.push({ type: "paragraph", line: lineOf(t), read: readInline(tokens[i + 1]) });
      i = closing(tokens, i);
    } else if (t.type === "bullet_list_open" || t.type === "ordered_list_open") {
      const end = closing(tokens, i);
      let item = null;
      for (let j = i + 1; j < end; j++) {
        const c = tokens[j];
        if (c.type === "list_item_open" && c.level === t.level + 1) {
          item = { type: "item", line: lineOf(c), reads: [] };
          out.push(item);
        } else if (c.level === t.level + 2 && c.nesting !== -1) {
          if (c.type === "paragraph_open") {
            item.reads.push(readInline(tokens[j + 1]));
          } else {
            bad(c, c.type === "fence" ? "fence" : "format", "a list item holds only text: no nested list, code, quote, table or HTML in it");
          }
          j = closing(tokens, j);
        }
      }
      for (const b of out) if (b.type === "item" && b.reads) (b.read = merge(b.reads)), delete b.reads;
      i = end;
    } else if (t.type === "fence") {
      out.push({ type: "fence", line: lineOf(t) });
    } else if (t.type === "html_block") {
      bad(t, t.content.trimStart().startsWith("<!--") ? "markup" : "format", "no HTML block: a line may not start with HTML");
    } else if (t.type === "code_block") {
      bad(t, "format", "no indented code: put a command in a `code` span");
    } else {
      bad(t, "format", `not an exhibit block (${t.type.replace(/_open$/, "")}): use a heading, a paragraph, a one-level list, or the graph's fence in Progress`);
      i = closing(tokens, i);
    }
  }
  const footnote = Object.keys(env.references ?? {}).find((k) => k.startsWith("^"));
  if (footnote) {
    const at = text.split("\n").findIndex((l) => /^\s{0,3}\[\^/.test(l));
    out.push({ type: "bad", line: at + 1, rule: "format", message: "no footnotes: GitHub moves them to the page's end" });
  }
  return out.sort((a, b) => a.line - b.line);
}

/** Splits blocks into sections by ATX headings of `level`. */
function sections(list, level) {
  const before = { name: null, line: 1, body: [] };
  const found = [];
  let current = before;
  for (const b of list) {
    if (b.type === "heading" && b.atx && b.level === level) {
      current = { name: b.name, line: b.line, body: [] };
      found.push(current);
    } else {
      current.body.push(b);
    }
  }
  return { before, found };
}

/** Problems of a block list's shape: bad blocks, other headings, inline problems. */
function shapeProblems(list, level, fenceOk, problems) {
  for (const b of list) {
    if (b.type === "bad") problems.push({ line: b.line, rule: b.rule, message: b.message });
    if (b.type === "heading" && !(b.atx && b.level === level)) {
      problems.push({ line: b.line, rule: "format", message: `the only heading here is \`${"#".repeat(level)} \`` });
    }
    if (b.type === "fence" && !fenceOk(b)) {
      problems.push({ line: b.line, rule: "fence", message: "code fences are allowed only in `## Progress`; put a command in a `code` span" });
    }
    if (b.read) problems.push(...b.read.problems);
  }
}

const units = (body) => body.filter((b) => b.type === "item" || b.type === "paragraph");

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
    for (const unit of units(s.body)) {
      const { links, all, plain, code } = unit.read;
      if (links.length === 0) {
        problems.push({ line: unit.line, rule: "claim-no-evidence", message: "a claim needs a link to its evidence" });
      } else if (links.every((l) => l.picture) && !all.includes("Look-only:")) {
        problems.push({
          line: unit.line,
          rule: "claim-image-only",
          message: "a picture alone proves nothing: link the state it changed, or mark the claim `Look-only:`",
        });
      }
      for (const l of links) {
        if (l.picture && !/^https?:\/\//.test(l.target) && !exists(safeDecode(l.target))) {
          problems.push({ line: unit.line, rule: "picture-missing", message: `picture not found: ${l.target}` });
        }
      }
      if (s.name === "Numbers" && /\d/.test(plain)) {
        if (!code) {
          problems.push({ line: unit.line, rule: "number-no-command", message: "a number needs the command that produced it, in `code`" });
        }
        if (PERF.test(all) && !RUNS.test(all)) {
          problems.push({ line: unit.line, rule: "number-no-runs", message: "a performance number needs its run count (`5 runs`, `n=5`)" });
        }
      }
    }
  }
}

function safeDecode(target) {
  try {
    return decodeURI(target);
  } catch {
    return target;
  }
}

/**
 * @param {string} markdown
 * @param {{mode?: 'page' | 'section', exists?: (target: string) => boolean}} [options]
 * @returns {{line: number, rule: string, message: string}[]}
 */
export function checkExhibit(markdown, { mode = "page", exists = () => true } = {}) {
  const md = parser();
  const all = blocks(md, markdown.replace(/\r\n?/g, "\n"));
  const problems = [];

  if (mode === "section") {
    const start = all.findIndex((b) => b.type === "heading" && b.atx && b.level === 2 && b.name === "Exhibit");
    if (start === -1) return [{ line: 1, rule: "section-missing", message: "no `## Exhibit` section" }];
    let end = start + 1;
    while (end < all.length && !(all[end].type === "heading" && all[end].level <= 2)) end++;
    const inside = all.slice(start + 1, end);
    shapeProblems(inside, 3, () => false, problems);
    const { before, found } = sections(inside, 3);
    checkHeadings(found, SECTION_HEADINGS, problems);
    checkClaims([{ ...before, name: "Show" }, ...found], SECTION_HEADINGS, exists, problems);
    return problems.sort((a, b) => a.line - b.line);
  }

  const { before, found } = sections(all, 2);
  const inProgress = new Set(found.filter((s) => s.name === "Progress").flatMap((s) => s.body));
  shapeProblems(all, 2, (b) => inProgress.has(b), problems);
  checkHeadings(found, PAGE_HEADINGS, problems);
  if (before.body.length > 0) {
    problems.push({ line: before.body[0].line, rule: "heading", message: "text before the first heading; an exhibit starts with `## Bottom line`" });
  }

  const bottom = found.find((s) => s.name === "Bottom line");
  if (!bottom) {
    problems.push({ line: 1, rule: "bottom-line", message: "no `## Bottom line`" });
  } else {
    const first = bottom.body[0];
    const text = first?.type === "paragraph" ? first.read.all.split("\n")[0].trim() : "";
    if (!BOTTOM_LINE.test(text)) {
      problems.push({
        line: first ? first.line : bottom.line,
        rule: "bottom-line",
        message: "expected `<🟢 On track|🟡 At risk|🔴 Off track> · <n> decisions need you · <done>/<total> done · updated <YYYY-MM-DD HH:MM>[ · not pinned][ · in flight: unknown]`",
      });
    }
  }

  for (const s of found.filter((s) => s.name === "Needs you")) {
    for (const unit of units(s.body)) {
      if (!/\bpick:/i.test(unit.read.all)) problems.push({ line: unit.line, rule: "needs-you-pick", message: "a decision needs the agent's `pick:`" });
      if (!/\brisk:/i.test(unit.read.all)) problems.push({ line: unit.line, rule: "needs-you-risk", message: "a decision needs its `risk:`, even when low" });
    }
  }

  for (const s of found.filter((s) => s.name === "Promised vs shown")) {
    for (const unit of units(s.body)) {
      const m = unit.read.all.trimStart().split("\n")[0].match(/^#\d+ AC\d+\s+([^:]*):/);
      if (!m) {
        problems.push({ line: unit.line, rule: "promise-format", message: "expected `#<issue> AC<k> <criterion, up to eight words>: <status>`" });
      } else if (countWords(m[1]) > MAX_CRITERION_WORDS) {
        problems.push({ line: unit.line, rule: "promise-long", message: `cite the criterion in at most ${MAX_CRITERION_WORDS} words` });
      }
    }
  }

  for (const s of found.filter((s) => s.name === "Track record")) {
    for (const unit of units(s.body)) {
      if (/\d(\.\d+)?\s?%/.test(unit.read.all) && !/\d+\s*\/\s*\d+/.test(unit.read.all)) {
        problems.push({ line: unit.line, rule: "track-percent", message: "give counts (`3/4`), never a bare percentage" });
      }
    }
  }

  checkClaims(found, PAGE_CLAIMS, exists, problems);

  let count = 0;
  for (const s of found) {
    if (LENGTH_EXEMPT.includes(s.name)) continue;
    for (const unit of units(s.body)) count += countWords(unit.read.plain);
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
