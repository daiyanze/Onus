// Run with `node --test` or `bun test`.
// One test per line under "It fails when" in check-exhibit.mjs, so the
// comment there claims nothing a test does not show.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkExhibit } from "./check-exhibit.mjs";

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
      const short = c.replace(/^\s*- "?/, "").replace(/[`"*:]/g, "").split(/\s+/).slice(0, 8).join(" ");
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
