# Plan: review gates that hold under full autonomy

Status: **built as wording**, 2026-11-28. Direction agreed by the owner in
chat (2026-11-28). The wording landed as four stacked pull requests; the
scripts in "Still owed" did not.

## Sources

- A Zhihu post (@大古队员) on three agent roles (Leader / Dev / Reviewer)
  with two review gates across real repositories: blocking-only categories,
  an 800-line cap, round limits, a test-baseline gate against "false green",
  and a plain-language list of default-behaviour changes for the owner.
- pstack (cursor/plugins): `/interrogate` keeps only findings a run proves;
  principles sequence-verifiable-units, test-behavior-not-implementation,
  laziness-protocol, attack-the-premise, encode-lessons-in-structure,
  never-block-on-the-human. pstack states no review rules (what blocks,
  nits, rounds) and nothing on fake or skipped tests; those parts come from
  the post.

Not taken: the post's `dev` buffer branch (it mixes unreleased work and
needs a base SHA to tell owners apart; Onus merges one PR at a time),
platform wake-ups (`--blocked-by`, `--until-pr`), per-repository context
tables, and its test infrastructure (tiers, a flock queue, mutation runs).

## Changes, and where each landed

| # | Change | Where |
| --- | --- | --- |
| 1 | Only five classes block (correctness, rules and security, cannot be undone, test weakening, scope), each needing proof by step 5; notes never send a PR back | `cross-examine` 6 |
| 2 | The first round lists every blocking issue; re-reviews check those and the new commits; a problem in lines an earlier round read is a "missed" note and a method note, unless it is rules and security | `cross-examine` 6, 8; method note signal 9 |
| 3 | The loop stops when one blocking item is unfixed after two rounds, or after three rounds; the premise is tested directly once, then the owner decides | `development.md` 6, "Budgets", method note signal 1; `cross-examine` 8; `docket` 4 |
| 4 | 800 hand-written lines at most (aim 500, insertions plus deletions), shown with `--shortstat`; the reviewer recounts and sends an oversized PR back unread unless the issue grants more; that stop is not a round, and the split is proposed to the owner (docket parks) | `development.md` 3, 5; `cross-examine` 1; `brief` 7 |
| 5 | Tests are read first; weakened tests listed | `cross-examine` 4 |
| 6 | Test counts at base and head, by writer and reviewer: a green run of fewer tests is not the same green | `development.md` 4; `cross-examine` 3 |
| 7 | Every `brief` issue ends `what` with "Not in this issue:"; doing what it rules out is scope drift | `brief` 7, 8; `development.md` 1; `cross-examine` 6 |
| 8 | `## Default changes` in every PR, in plain words; `AGENTS.md` names the kinds the owner decides; in a project whose `development.md` predates the list, an unlisted default is a note, but a reserved kind is still named and held | `development.md` 5; `AGENTS.template.md`; `charter` 1; `cross-examine` 4, 7; `docket` 5 (condition 6), 6 |
| 9 | Fix rounds only add commits; a rewritten history makes the re-review a first round | `development.md` 6; `cross-examine` 8 |
| 11 | A one-page flow diagram | README, README.zh-CN |

## Owner involvement under full autonomy

The run never stops for the owner. The owner declares once, in
`AGENTS.md` ("Defaults the owner decides"), which kinds of default are
theirs. The template's example: a suggestion turned into an automatic
action, who may see or do what, how often people are notified, anything
that charges money, deleting data.

- Not reserved: the agent picks a value, lists it, merges under the grant,
  and the report lists it for correction afterwards (pstack's
  never-block-on-the-human).
- Reserved: that PR stays ready to merge (`docket` 5, condition 6), and
  issue text never releases it; the issue counts as parked, the run goes
  on, and only issues that depend on it wait. The report gives each
  one with a recommendation, the evidence and the risk.

When `exhibit` lands (`docs/plans/visible-progress.md`), the report's
"Decisions waiting" is what its "Needs you" section shows.

## Still owed

- **Change 10, rules as checks.** The size count and the test-count
  comparison are written rules today. Both belong in scripts under
  `skills/charter/templates/scripts/`, a protected path, so they are their
  own PRs for the owner. The test-count check needs a runner-neutral input
  (the counts a runner prints, or a JUnit report) before it can be one
  script for every project.
- `check-plan.mjs` (protected) does not yet fail a plan whose `what`
  lacks the `Not in this issue:` line.
- A trial on a real project: do re-review rounds fall, and does any
  oversized PR, unlisted default or weakened test get caught?
