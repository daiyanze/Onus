// Run with `node --test` or `bun test`.
// One test per line under "It fails when" in check-exhibit.mjs, so the
// comment there claims nothing a test does not show.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test as nodeTest } from "node:test";
import { fileURLToPath } from "node:url";
import { checkExhibit, PARSER_MISSING } from "./check-exhibit.mjs";

// The check reads markdown with markdown-it; without it only the exit-2 test runs.
const hasParser = await import("markdown-it").then(() => true, () => false);
const test = hasParser ? nodeTest : (name, fn) => nodeTest.skip(name, fn);

const script = fileURLToPath(new URL("./check-exhibit.mjs", import.meta.url));
const planFile = fileURLToPath(new URL("../../../docs/plans/visible-progress.yaml", import.meta.url));

const BOTTOM = "🟢 On track · 1 decision needs you · 7/8 done · updated 2026-12-03 18:02";

/** A sound exhibit; `parts` replaces whole sections by heading. */
function page(parts = {}) {
  const base = {
    "Bottom line": `${BOTTOM}\n\nSaving a draft now keeps it across reloads.`,
    "Needs you": "- Merge #71 (exhibit-skill, protected)? pick: yes · risk: low, wording only · evidence: [review](https://github.com/o/r/pull/71#issuecomment-1)",
    "Promised vs shown": "- #69 AC1 every state from recorded fixtures: met (kind not judged) · [review](https://github.com/o/r/pull/80#issuecomment-2)",
    Show: "- Saving a draft stores it: `GET /api/drafts/9` returns it ([run](https://github.com/o/r/actions/runs/3)) · ![saved](https://example.com/saved.png)",
    Numbers: "- Tests: 16 → 21 passing, `bun test skills/exhibit/scripts/` ([PR #80](https://github.com/o/r/pull/80))",
    "Track record": "- Criteria met on first review: 3/4",
    Progress: "```mermaid\ngraph LR\n  a --> b\n```",
    "Not shown": "- The retry backoff is internal; `drafts.retry.test.ts` passes ([CI](https://github.com/o/r/actions/runs/4))",
    ...parts,
  };
  return Object.entries(base)
    .filter(([, body]) => body !== null)
    .map(([name, body]) => `## ${name}\n\n${body}\n`)
    .join("\n");
}

const rules = (text, opts) => checkExhibit(text, opts).map((p) => p.rule);

/**
 * The text gives exactly one problem, with this rule; and the command line,
 * on the same text in a file, exits 1 and prints that line and rule.
 */
function failsWith(rule, text, opts = {}) {
  const found = checkExhibit(text, opts);
  assert.equal(found.length, 1, `expected one ${rule}, got ${JSON.stringify(found)}`);
  assert.equal(found[0].rule, rule);
  const run = cli(text, ...(opts.mode === "section" ? ["--section"] : []));
  assert.equal(run.status, 1, run.stdout + run.stderr);
  assert.equal(run.stderr.split("\n")[0].split(": ").slice(0, 2).join(": "), `${found[0].line}: ${rule}`);
  return found[0];
}

function cli(text, ...args) {
  const dir = mkdtempSync(join(tmpdir(), "exhibit-"));
  const file = join(dir, "exhibit.md");
  writeFileSync(file, text);
  return spawnSync(process.execPath, [script, ...args, file], { encoding: "utf8" });
}

test("a sound exhibit passes", () => {
  assert.deepEqual(checkExhibit(page()), []);
});

test("heading: unknown, out of order, or twice", () => {
  failsWith("heading", page() + "\n## Now you can\n\nsomething\n");
  const swapped = page({ Show: null }) + "\n## Show\n\n- x [run](https://example.com/run)\n";
  failsWith("heading", swapped);
  failsWith("heading", page() + "\n## Not shown\n\n- y [ci](https://example.com/ci)\n");
});

test("bottom-line: missing, or malformed", () => {
  failsWith("bottom-line", page({ "Bottom line": null }));
  failsWith("bottom-line", page({ "Bottom line": "On track, 7 of 8 done" }));
  failsWith("bottom-line", page({ "Bottom line": BOTTOM.replace("2026-12-03 18:02", "yesterday") }));
});

test("bottom-line: the optional tokens pass, in order", () => {
  assert.deepEqual(rules(page({ "Bottom line": `${BOTTOM} · not pinned` })), []);
  assert.deepEqual(rules(page({ "Bottom line": `${BOTTOM} · in flight: unknown` })), []);
  assert.deepEqual(rules(page({ "Bottom line": `${BOTTOM} · not pinned · in flight: unknown` })), []);
  assert.deepEqual(rules(page({ "Bottom line": BOTTOM.replace("🟢 On track · 1 decision needs", "🔴 Off track · 2 decisions need") })), []);
  failsWith("bottom-line", page({ "Bottom line": `${BOTTOM} · in flight: unknown · not pinned` }));
});

test("needs-you-pick and needs-you-risk", () => {
  failsWith("needs-you-pick", page({ "Needs you": "- Merge #71? risk: low" }));
  failsWith("needs-you-risk", page({ "Needs you": "- Merge #71? pick: yes" }));
});

test("promise-format and promise-long", () => {
  failsWith("promise-format", page({ "Promised vs shown": "- the graph renders: met [review](https://example.com/r)" }));
  failsWith(
    "promise-long",
    page({ "Promised vs shown": "- #69 AC2 the graph for a scratch goal of forty issues renders on GitHub: met [review](https://example.com/r)" }),
  );
});

test("track-percent: a percentage without a count", () => {
  failsWith("track-percent", page({ "Track record": "- Criteria met on first review: 75%" }));
  assert.deepEqual(rules(page({ "Track record": "- Criteria met on first review: 3/4 (75%)" })), []);
});

test("length: past 300 words outside Needs you and Promised vs shown", () => {
  const long = Array.from({ length: 31 }, (_, i) => `word${i} two three four five six seven eight nine ten`).join(" ");
  failsWith("length", page({ "Bottom line": `${BOTTOM}\n\n${long}` }));
});

test("length: 20 Needs you items still pass", () => {
  const many = Array.from(
    { length: 20 },
    (_, i) =>
      `- Merge #${100 + i}, which changes how the exhibit reads its inputs for the owner? pick: yes · what it changes: one line of the page · evidence: [review](https://example.com/r${i}) · risk: low, wording only`,
  ).join("\n");
  assert.deepEqual(rules(page({ "Needs you": many })), []);
});

test("length: an exhibit citing every M1 criterion of the plan passes", () => {
  const plan = readFileSync(planFile, "utf8");
  const m1 = plan.split("\n  - id: ").slice(1).filter((block) => block.includes("milestone: M1 Seen"));
  const lines = [];
  m1.forEach((block, i) => {
    const criteria = block.split("    acceptance:\n")[1].split("\n").filter((l) => l.startsWith("      - "));
    criteria.forEach((c, k) => {
      const short = c.replace(/^\s*- "?/, "").replace(/[`"*:<>]/g, "").split(/\s+/).slice(0, 8).join(" ");
      lines.push(`- #${64 + i} AC${k + 1} ${short}: met (kind not judged) · [review](https://example.com/${i}-${k})`);
    });
  });
  assert.ok(lines.length >= 10, `found ${lines.length} M1 criteria`);
  assert.deepEqual(rules(page({ "Promised vs shown": lines.join("\n") })), []);
});

test("claim-no-evidence: a claim with no link", () => {
  failsWith("claim-no-evidence", page({ Show: "- Saving a draft works now" }));
});

test("claim-image-only: a picture alone, unless Look-only", () => {
  failsWith("claim-image-only", page({ Show: "- Saving a draft works ![saved](https://example.com/saved.png)" }));
  failsWith("claim-image-only", page({ Show: "- Saving a draft works [video](https://example.com/run.mp4)" }));
  assert.deepEqual(rules(page({ Show: "- Look-only: the header is now dark ![header](https://example.com/header.png)" })), []);
});

test("number-no-command: a number without its command", () => {
  failsWith("number-no-command", page({ Numbers: "- Tests: 16 → 21 passing ([PR](https://example.com/pr))" }));
});

test("number-no-runs: a performance number without a run count", () => {
  failsWith("number-no-runs", page({ Numbers: "- Load: 820 ms → 410 ms, `bun bench.mjs` ([PR](https://example.com/pr))" }));
  assert.deepEqual(rules(page({ Numbers: "- Load: 820 ms → 410 ms, `bun bench.mjs`, 5 runs ±20 ms ([PR](https://example.com/pr))" })), []);
});

test("picture-missing: a local picture that does not exist", () => {
  const exists = (target) => target === "here.png";
  const text = (p) => page({ Show: `- Saving stores it: \`GET /api/drafts/9\` ([run](https://example.com/run)) ![s](${p})` });
  assert.deepEqual(rules(text("here.png"), { exists }), []);
  failsWith("picture-missing", text("gone.png"), { exists });
});

const pr = (exhibit) => `Closes #9\n\n## Why\n\nBecause.\n\n${exhibit === null ? "" : `## Exhibit\n\n${exhibit}\n\n`}## Verification\n\n- tests pass\n`;

test("--section: a well-formed Exhibit passes, the rest of the PR is ignored", () => {
  const ok = "### Show\n\n- Saving stores it: `GET /api/drafts/9` ([run](https://example.com/run)) · ![s](https://example.com/s.png)\n\n### Not shown\n\n- Backoff is internal ([CI](https://example.com/ci))";
  assert.deepEqual(rules(pr(ok), { mode: "section" }), []);
});

test("--section: section-missing", () => {
  failsWith("section-missing", pr(null), { mode: "section" });
});

test("--section: heading, and the evidence rules", () => {
  failsWith("heading", pr("### Bottom line\n\nx"), { mode: "section" });
  failsWith("heading", pr("### Not shown\n\n- a [ci](https://example.com/ci)\n\n### Show\n\n- b [run](https://example.com/run)"), { mode: "section" });
  failsWith("claim-image-only", pr("### Show\n\n- Saving works ![s](https://example.com/s.png)"), { mode: "section" });
});

test("command line: exhibit ok, or each problem with its line, exit 1", () => {
  const ok = cli(page());
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /^exhibit ok/);

  const bad = cli(page({ Show: "- Saving a draft works now" }));
  assert.equal(bad.status, 1);
  const line = page({ Show: "- Saving a draft works now" }).split("\n").indexOf("- Saving a draft works now") + 1;
  assert.equal(bad.stderr.trim(), `${line}: claim-no-evidence: a claim needs a link to its evidence`);

  const section = cli(pr("### Show\n\n- Saving works ![s](https://example.com/s.png)"), "--section");
  assert.equal(section.status, 1);
  assert.match(section.stderr, /^\d+: claim-image-only: /);
});

test("command line: a relative picture is read from the file's folder", () => {
  const dir = mkdtempSync(join(tmpdir(), "exhibit-"));
  writeFileSync(join(dir, "shot.png"), "");
  const file = join(dir, "exhibit.md");
  writeFileSync(file, page({ Show: "- Saving stores it: `GET /api/drafts/9` ([run](https://example.com/run)) ![s](shot.png) ![t](missing.png)" }));
  const run = spawnSync(process.execPath, [script, file], { encoding: "utf8" });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /picture-missing: picture not found: missing\.png/);
  assert.doesNotMatch(run.stderr, /shot\.png/);
});

test("command line: exit 2 when it cannot run", () => {
  assert.equal(spawnSync(process.execPath, [script], { encoding: "utf8" }).status, 2);
  assert.equal(spawnSync(process.execPath, [script, "--bogus", "x.md"], { encoding: "utf8" }).status, 2);
  assert.equal(spawnSync(process.execPath, [script, "/nonexistent/exhibit.md"], { encoding: "utf8" }).status, 2);
});

// Found in review of PR #79: each of these got past the first version.

test("claim-no-evidence: a prose claim or a `+ ` item is a claim too", () => {
  failsWith("claim-no-evidence", page({ Show: "Saving a draft works now." }));
  failsWith("claim-no-evidence", page({ Show: "+ Saving a draft works now" }));
});

test("claim-image-only: GitHub's pasted images, and a markdown image with no extension", () => {
  const tag = '<img width="600" alt="saved" src="https://github.com/user-attachments/assets/0b1c2d3e-aaaa-bbbb-cccc-1234567890ab" />';
  failsWith("claim-image-only", page({ Show: `- Saving a draft works ${tag}` }));
  failsWith("claim-image-only", page({ Show: "- Saving a draft works https://github.com/user-attachments/assets/0b1c2d3e-aaaa-bbbb-cccc-1234567890ab" }));
  failsWith("claim-image-only", page({ Show: "- Saving a draft works ![saved](https://example.com/shots/saved)" }));
});

test("links: an autolink and a URL in parentheses count as evidence", () => {
  assert.deepEqual(rules(page({ Show: "- Saving stores it, `GET /api/drafts/9` <https://example.com/run/3>" })), []);
  assert.deepEqual(rules(page({ Show: "- Saving stores it, `GET /api/drafts/9` (https://example.com/run/3)" })), []);
});

test("heading: text before the first heading", () => {
  failsWith("heading", "Some preamble the length rule would not count.\n\n" + page());
});

test("heading: a `## ` line inside a code fence is not a heading", () => {
  assert.deepEqual(rules(page({ Progress: "```text\n## not a heading\n```" })), []);
});

test("length: code blocks (the Mermaid graph) are not counted", () => {
  const graph = "```mermaid\ngraph LR\n" + Array.from({ length: 200 }, (_, i) => `  n${i}["issue ${i} exhibit progress"] --> n${i + 1}`).join("\n") + "\n```";
  assert.deepEqual(rules(page({ Progress: graph })), []);
});

test("length: Promised vs shown is not counted", () => {
  const many = Array.from({ length: 60 }, (_, i) => `- #${100 + i} AC1 the graph renders on GitHub: met (kind not judged) · [review](https://example.com/${i})`).join("\n");
  assert.deepEqual(rules(page({ "Promised vs shown": many })), []);
});

test("--section: text before the first `###` is checked as a claim", () => {
  failsWith("claim-image-only", pr("Saving works ![s](https://example.com/s.png)\n\n### Not shown\n\n- Backoff is internal ([CI](https://example.com/ci))"), { mode: "section" });
});

// Found in the re-review of PR #79: fences that fail open, and links GitHub does not render.

const F = "```";
const P1 = "## Bottom line\n\n\ud83d\udfe2 On track \u00b7 1 decision needs you \u00b7 7/8 done \u00b7 updated 2026-12-03 18:02\n\nSaving a draft now keeps it.\n\n## Show\n\n- Saving works [run](https://example.com/run/1)\n  ```\n  GET /x\n\n- Deleting works ![s](https://example.com/s.png)\n\n- Listing works\n  ```\n  out https://example.com/run/2\n  ```\n\n## Progress\n\nA graph: ![g](https://example.com/g.png)\n\n## Not shown\n\n- Backoff is internal ([CI](https://github.com/o/r/actions/runs/4))\n";
const P2 = "## Bottom line\n\n\ud83d\udfe2 On track \u00b7 1 decision needs you \u00b7 7/8 done \u00b7 updated 2026-12-03 18:02\n\nSaving a draft now keeps it.\n\n## Show\n\n    ```\n\n- Deleting works ![s](https://example.com/s.png)\n\n- Listing works [run](https://example.com/run/2)\n  ```\n  out https://example.com/run/2\n  ```\n\n## Progress\n\nA graph: ![g](https://example.com/g.png)\n\n## Not shown\n\n- Backoff is internal ([CI](https://github.com/o/r/actions/runs/4))\n";
const S2 = "Closes #1\n\n## Exhibit\n\n### Show\n\n- Saving works [run](https://example.com/run/1)\n  ```\n  GET /x\n\n- Deleting works ![s](https://example.com/s.png)\n\n- Listing works\n  ```\n  out https://example.com/run/2\n  ```\n\n## Scope\n\nx\n";


test("fence: in --section, any fence in the Exhibit fails; fences elsewhere in the PR do not", () => {
  assert.ok(rules(S2, { mode: "section" }).includes("fence"), JSON.stringify(checkExhibit(S2, { mode: "section" })));
  const fenced = checkExhibit(pr(`### Show\n\n- Saving stores it [run](https://example.com/run/1)\n\n${F}\nGET /x\n${F}`), { mode: "section" });
  assert.ok(fenced.some((p) => p.rule === "fence"), JSON.stringify(fenced));
  assert.deepEqual(rules(`## Why\n\n${F}\nfine outside the Exhibit\n${F}\n\n## Exhibit\n\n### Show\n\n- Saving stores it [run](https://example.com/run/1)\n`, { mode: "section" }), []);
});


test("claim-no-evidence: a URL in a code span or an HTML comment is not a link", () => {
  failsWith("claim-no-evidence", page({ Show: "- Saving stores the draft: `curl -s http://localhost:3000/api/drafts/9` returns it" }));
  const commented = checkExhibit(page({ Show: "- Saving stores the draft <!-- https://example.com/run/3 -->" })).map((p) => p.rule);
  assert.deepEqual(commented, ["markup", "claim-no-evidence"]);
});

test("claim-image-only: each `+ ` item is its own claim", () => {
  failsWith("claim-image-only", page({ Show: "+ Saving stores it, `GET /x` [run](https://example.com/run/1)\n+ Deleting works ![s](https://example.com/s.png)" }));
});

test("pictures: titles in single quotes or parentheses, and <url> targets", () => {
  failsWith("claim-image-only", page({ Show: "- Deleting works ![s](https://example.com/s.png 'https://example.com/run/1')" }));
  failsWith("claim-image-only", page({ Show: "- Deleting works ![s](https://example.com/s.png (https://example.com/run/1))" }));
  failsWith("claim-image-only", page({ Show: "- Deleting works [shot](<https://example.com/s.png>)" }));
});

// Inputs from the re-reviews of PR #79, each of which an earlier, line-based version let through.

const probes79d = {"A": "## Bottom line\n\n\ud83d\udfe2 On track \u00b7 1 decision needs you \u00b7 7/8 done \u00b7 updated 2026-12-03 18:02\n\nSaving a draft now keeps it.\n\n## Show\n\n- Saving works [run](https://example.com/run/1)\n\n<!--\n ## Progress\n--> <span title=\"https://example.com/run/1\"></span>\n\n```\n  ```\n- Deleting works ![s](https://example.com/s.png)\n```\n```\n  ```\n```\n\n## Not shown\n\n- Backoff is internal ([CI](https://github.com/o/r/actions/runs/4))\n\n", "B": "## Bottom line\n\n\ud83d\udfe2 On track \u00b7 1 decision needs you \u00b7 7/8 done \u00b7 updated 2026-12-03 18:02\n\nSaving a draft now keeps it.\n\n## Show\n\n- Saving works [run](https://example.com/run/1)\n\n<!-- [x](https://example.com/run/1)\n## Track record\n-->\n\n- Deleting works ![s](https://example.com/s.png)\n\n## Not shown\n\n- Backoff is internal ([CI](https://github.com/o/r/actions/runs/4))\n\n", "C": "## Bottom line\n\n\ud83d\udfe2 On track \u00b7 1 decision needs you \u00b7 7/8 done \u00b7 updated 2026-12-03 18:02\n\nSaving a draft now keeps it.\n\n## Show\n\n- Saving works [run](https://example.com/run/1)\n\n## Progress\n\nA graph: ![g](https://example.com/g.png)\n\n ## Not shown\n\n- Deleting works ![s](https://example.com/s.png)\n", "D": "## Bottom line\n\n\ud83d\udfe2 On track \u00b7 1 decision needs you \u00b7 7/8 done \u00b7 updated 2026-12-03 18:02\n\nSaving a draft now keeps it.\n\n## Show\n\n- Deleting works ![s](https://example.com/s.png) <span title=\"https://example.com/run/1\"></span>\n\n## Not shown\n\n- Backoff is internal ([CI](https://github.com/o/r/actions/runs/4))\n\n", "L": "## Bottom line\n\n\ud83d\udfe2 On track \u00b7 1 decision needs you \u00b7 7/8 done \u00b7 updated 2026-12-03 18:02\n\n## Show\n\n- Saving works [run](https://example.com/run/1)\n\n## Progress\n\n```\n  ```\nword word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word word\n```\n```\n  ```\n```\n"};
const probes79dSection = {"E2": "Closes #1\n\n## Exhibit\n\n### Show\n\n- Saving works [run](https://example.com/run/1)\n\n<!-- [x](https://example.com/run/1)\n## Scope\n-->\n\n- Deleting works ![s](https://example.com/s.png)\n\n## Scope\n\nx\n"};

test("format: the re-review probes fail", () => {
  for (const [name, text] of Object.entries(probes79d)) {
    assert.notDeepEqual(checkExhibit(text), [], `${name} passed`);
  }
  for (const [name, text] of Object.entries(probes79dSection)) {
    assert.notDeepEqual(checkExhibit(text, { mode: "section" }), [], `${name} passed`);
  }
});



test("format: two-space continuations right after a list line pass", () => {
  assert.deepEqual(rules(page({ Show: "- Saving stores it\n  `GET /api/drafts/9` returns it ([run](https://example.com/run/1))\n  ![s](https://example.com/s.png)" })), []);
});

test("markup: HTML comments and tags other than <img>", () => {
  assert.ok(rules(page({ Show: "- Saving stores it [run](https://example.com/run/1) <!-- note -->" })).includes("markup"));
  assert.ok(rules(page({ Show: '- Saving works <span title="https://example.com/run/1">here</span>' })).includes("markup"));
  assert.deepEqual(rules(page({ Show: '- Look-only: the header <img src="https://example.com/h.png" alt="h">' })), []);
  assert.deepEqual(rules(page({ Show: "- Saving stores it, `GET /x<k>` ([run](https://example.com/run/1))" })), []);
});








test("format: #69 and a list marker without a space are text, not structure", () => {
  assert.deepEqual(rules(page({ Show: "-dash at the start [run](https://example.com/run/1)\n\n#69 is an issue [run](https://example.com/run/2)" })), []);
});

// Since the review of the whitelist (PR #79, round 6) the check reads the page with a markdown
// parser, as GitHub renders it, and accepts only headings, paragraphs, one-level lists and
// Progress's fence. Each probe below is from a review; `failsOn` asserts the rule is among those found.

const failsOn = (rule, text, opts) => assert.ok(rules(text, opts).includes(rule), `${rule} missing for ${JSON.stringify(text)}: ${JSON.stringify(checkExhibit(text, opts))}`);
const IMG = "![s](https://example.com/s.png)";

test("fence: a fence outside Progress fails, in an item too", () => {
  failsOn("fence", page({ Show: `${F}\n~~~\n- Saving works ${IMG}` }));
  failsOn("fence", page({ Show: `- Saving works ${IMG}\n\n${F}\n[run](https://example.com/run/1)\n${F}` }));
  failsOn("fence", page({ Show: `- Saving works ${IMG}\n  ${F}\n  [run](https://example.com/run/1)\n  ${F}` }));
  for (const text of [P1, P2]) failsOn("fence", text);
});

test("fence: inside Progress's fence nothing is a heading or a claim", () => {
  assert.deepEqual(rules(page({ Progress: `${F}text\n- not a claim, no link\n## not a heading\n   ${F} not a close\n${F}` })), []);
});

test("format: a quote, a table, an HTML block, a rule, indented code, other headings", () => {
  for (const bad of [
    "> Saving stores it [run](https://example.com/run/1)",
    `Deleting works ${IMG} | x\n--- | ---\ny | z | [run](https://example.com/run/1)`, // the extra cell is dropped
    '<img src="https://example.com/s.png" alt="s">\n[run](https://example.com/run/1)', // an HTML block: the link is not rendered
    "- Saving stores it [run](https://example.com/run/1)\n\n***",
    "Saving stores it [run](https://example.com/run/1)\n\n    indented code",
    "- Saving stores it [run](https://example.com/run/1)\n\n        indented code, in the item",
    "### Saving",
    "Saving stores it [run](https://example.com/run/1)\n---",
  ]) {
    failsOn("format", page({ Show: bad }));
  }
  failsOn("format", pr(`### Show\n\nDeleting works ${IMG} | x\n--- | ---\ny | z | [run](https://example.com/run/1)`), { mode: "section" });
});

test("format: an item holds only text: no nested list, code or HTML block in it", () => {
  failsOn("format", page({ Show: `- Saving works ${IMG}\n  - [run](https://example.com/run/1)` }));
  failsOn("format", page({ Show: "-     [run](https://example.com/run/1) saving works" }));
  failsOn("format", page({ Show: `- Saving works ${IMG}\n\n  <div>\n  [run](https://example.com/run/1)\n  </div>` }));
});

test("format: footnotes and math", () => {
  failsOn("format", page({ Show: `- Saving works ${IMG} [^1]\n\n[^1]: https://example.com/run/1` }));
  failsOn("format", page({ Show: `- Saving works ${IMG} $[run](https://example.com/run/1)$` }));
});

test("links: a URL inside a picture's alt text, title or tag is not evidence", () => {
  failsWith("claim-image-only", page({ Show: "- Deleting works ![a \\] [run](https://example.com/run/1)](https://example.com/s.png)" }));
  failsWith("claim-image-only", page({ Show: '- Deleting works ![s](https://example.com/s.png "a \\" https://example.com/run/1")' }));
  failsOn("markup", page({ Show: '- Deleting works <img src="https://example.com/s.png" alt="a>b https://example.com/run/1">' }));
});

test("links: a bare URL counts only where GitHub links it", () => {
  failsWith("claim-image-only", page({ Show: `- Deleting works ${IMG} x=https://example.com/run/1` }));
  assert.deepEqual(rules(page({ Show: "- Saving works (https://example.com/run/1)" })), []);
});

test("markup: an <img> needs an https src and double-quoted known attributes", () => {
  failsOn("markup", page({ Show: '- Look-only: the header <img src="h.png">' }));
  failsOn("markup", page({ Show: '- Look-only: the header <img src="http://example.com/h.png">' }));
  failsOn("markup", page({ Show: "- Look-only: the header <img src='https://example.com/h.png'>" }));
  failsOn("markup", page({ Show: '- Look-only: the header <img src="https://example.com/h.png" onerror="x">' }));
  failsOn("markup", page({ Show: '- Saving works <span\n  title="https://example.com/run/1">here</span>' }));
  failsOn("markup", page({ Show: '- Saving works <img title="https://example.com/run/1">' }));
});

test("claim-no-evidence: a link with no visible text", () => {
  failsWith("claim-no-evidence", page({ Show: "- Saving works [](https://example.com/run/1)" }));
  failsWith("claim-no-evidence", page({ Show: "- Saving works [\u200b](https://example.com/run/1)" }));
  failsWith("claim-no-evidence", page({ Show: "- Saving works [&nbsp;](https://example.com/run/1)" }));
});

test("what GitHub renders as plain text or a plain link passes", () => {
  for (const show of [
    "- Saving works [run][1]\n\n[1]: https://example.com/run/1", // a reference link is a link
    "- Saving works [run](https://example.com/run/1)\n    four spaces, lazily part of the item",
    '- Saving works\n  <img src="https://example.com/s.png" alt="s">\n  [run](https://example.com/run/1)', // inside a paragraph, not an HTML block
    "| a | b | [run](https://example.com/run/1)", // no delimiter row: not a table
    "-dash at the start [run](https://example.com/run/1)\n\n#69 is an issue [run](https://example.com/run/2)",
  ]) {
    assert.deepEqual(rules(page({ Show: show })), [], show);
  }
});

nodeTest("command line: without markdown-it it exits 2 and says so", { skip: hasParser && "markdown-it is installed" }, () => {
  // Bun installs a missing package on the fly when there is no node_modules; turn that off here.
  const dir = mkdtempSync(join(tmpdir(), "exhibit-"));
  writeFileSync(join(dir, "exhibit.md"), page());
  const run = spawnSync(process.execPath, [...(process.versions.bun ? ["--no-install"] : []), script, join(dir, "exhibit.md")], { encoding: "utf8" });
  assert.equal(run.status, 2, run.stdout + run.stderr);
  assert.ok(run.stderr.includes(PARSER_MISSING), run.stderr);
});

// Round 7 of PR #79.
test("links: a bare URL right after a picture or a link, or without a dotted domain, is not evidence", () => {
  failsWith("claim-image-only", page({ Show: `- Deleting works ${IMG}https://example.com/run/1` }));
  failsWith("claim-image-only", page({ Show: `- Deleting works ${IMG} [s2](https://example.com/s2.png)https://example.com/run/1` }));
  failsWith("claim-image-only", page({ Show: `- Deleting works ${IMG} \`x\`https://example.com/run/1` }));
  failsWith("claim-image-only", page({ Show: `- Deleting works ${IMG} http://localhost:3000/api/drafts/9` }));
  assert.deepEqual(rules(page({ Show: `- Deleting works ${IMG}\n  https://example.com/run/1` })), []);
});

test("links: blank link text, or a tiny picture as a link's only content, is not visible", () => {
  failsWith("claim-no-evidence", page({ Show: "- Saving works [ㅤ](https://example.com/run/1)" }));
  failsWith("claim-no-evidence", page({ Show: "- Saving works [ﾠ](https://example.com/run/1)" }));
  failsOn("markup", page({ Show: '- Saving works [<img src="https://example.com/s.png" width="0">](https://example.com/run/1)' }));
  assert.deepEqual(rules(page({ Show: '- Look-only: the header <img src="https://example.com/h.png" width="320">' })), []);
});

test("heading: in --section, `## Exhibit` twice", () => {
  failsOn("heading", `${pr("### Show\n\n- Saving stores it [run](https://example.com/run/1)")}\n## Exhibit\n\n- Deleting works ${IMG}\n`, { mode: "section" });
});
