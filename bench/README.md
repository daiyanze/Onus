# Bench

Does the method change what an agent does, and what does it cost? The bench
runs the same small tasks with and without Onus, and with earlier versions of
it, on Claude Code, Codex and Pi. It keeps one result file per trial in
`bench/results/` and a generated table in [`RESULTS.md`](RESULTS.md).

Run it before each major version and keep the results: the table is how a
version shows it did not make things worse.

## What it measures

Each checkpoint tests one claim the method makes. A trial passes or fails on
what a grader observes, never on what the agent says it did.

| Checkpoint | The claim | The task | Pass |
| --- | --- | --- | --- |
| `cp1` | A unit test shows a branch works, not that the app does the thing: verify on the real surface | Issue 1 in a notes API: `GET /api/notes?tag=work` fails. The unit tests pass before and after the bug | The grader starts the server and gets the right notes for `?tag=work`, `?tag=Work` and three other tags; listing and adding notes still work; the tests pass |
| `cp2-buggy` | A review proves what it finds | Review a PR that adds `DELETE /api/notes/:id`, with two planted bugs | Both bugs reported as `BLOCKING`, each inside the bug's lines and with a reason that names it (see Limits) |
| `cp2-clean` | A review does not block on what it cannot prove | Review the same PR without the bugs | No `BLOCKING` line |

The result file also keeps what does not decide a pass:

- `cp1`: whether a test the agent left would have caught the bug. Each
  test file is copied onto the unfixed fixture and run on its own. It counts
  when the file uses the server (imports `src/server.ts` or calls
  `/api/notes`) and a test in it fails there; a file that fails to load, for
  example on a new export, does not count. Also: lines changed in `src/`,
  files touched outside `src/` and `test/`, and whether the work is on a
  branch, committed, and has a `PULL_REQUEST.md`.
- `cp2-buggy`: recall (0, 0.5 or 1) and the other `BLOCKING` lines.
- `cp2-clean`: how many `BLOCKING` lines, and whether it wrote `APPROVE`.
- Both review checkpoints: whether the agent left the code and the branch
  alone, as told.

## Arms

| Arm | What the workspace gets |
| --- | --- |
| `none` | The notes app only |
| `onus` | The app plus the method from this working tree |
| `onus@<ref>` | The app plus the method at a git ref, for example a tag or `1776fc4` |

A method arm installs what an adopted project would have: every skill in
`.claude/skills` with `.agents/skills` linking to it, `CLAUDE.md` and the
`docs/` files from that version's templates, and an `AGENTS.md` filled in for
the notes app (`bench/fixture-rules/`). Skill names changed between versions,
so the arm looks up which name that version uses for "next issue" and
"review". A ref older than the bench uses this working tree's
`fixture-rules`; the result records that as `rulesFrom: "fallback"`.

What keeps the arms comparable:

- **The same prompt.** Every arm gets the same words. A method arm gets one
  more line, "Use the `<skill>` skill for this", naming its own skill.
- **No GitHub for anyone.** Issues are files, a PR is a branch plus
  `PULL_REQUEST.md`, a review is `REVIEW.md`. The prompt says so for every
  arm (`bench/prompts/shared.md`).
- **Hidden graders.** A trial's workspace is a fresh git repository in the
  system's temp folder. The graders, the patches and this folder are not in
  it, and the runtime starts without the variables that point back here
  (`PWD`, `OLDPWD`, `INIT_CWD`, `npm_*`). An agent with full access could
  still search the disk and find this checkout; keep it somewhere a search
  of the temp folder and the home folder's top level would not stumble on,
  or read the raw logs if a result looks too good.
- **User-level files reported.** Instructions or skills in your home folder
  (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.agents/skills`, ...) load
  in every arm, so the `none` arm would not be none. The harness warns about
  the ones it knows (for Claude Code also `agents`, `commands`, `plugins` and
  `settings.json`, which can hold hooks and MCP servers; for Pi also
  `SYSTEM.md`, `APPEND_SYSTEM.md` and `extensions`), records them in
  `leakedUserFiles`, and `--strict` refuses to run while any exist. The list
  is the known locations, not a guarantee.
- **One bench hash.** Each result records a hash of the fixture, the rules
  a method arm gets for it, the patches, the prompts, the graders and the
  code that builds a workspace. The table never averages results with
  different hashes: they measured different tests.

## Running it

Needs Node 20 or later, Bun, git, and the runtime's CLI signed in. Each trial
lets the agent edit, run commands and commit without asking (Claude Code with
`bypassPermissions`, Codex with `danger-full-access` because its
`workspace-write` sandbox keeps `.git` read-only, Pi as it always runs). Use a
disposable machine or account.

```sh
# See the prompts and commands; runs nothing
node bench/run.mjs --runtime claude --dry-run

# Three trials of every checkpoint: no method, this version, the previous one
node bench/run.mjs --runtime claude --arms none,onus,onus@1776fc4 --trials 3 --budget-usd 5
node bench/run.mjs --runtime codex  --arms none,onus,onus@1776fc4 --trials 3 --model <model>
node bench/run.mjs --runtime pi     --arms none,onus,onus@1776fc4 --trials 3 --model <model>

# Rebuild the table, then commit bench/results and bench/RESULTS.md
node bench/report.mjs
```

Options: `--checkpoints cp1,cp2-buggy` runs some of them,
`--timeout-min` limits each trial (default 30), `--keep` keeps the
workspaces (a dry run removes them otherwise), `--logs` moves the raw output (default `~/.onus-bench/logs`, never
inside the repository). Trials run interleaved (trial 1 of every arm, then
trial 2), so a slow hour does not land on one arm.

## Tokens

Each runtime reports its own numbers. Compare arms within one runtime and
model; do not compare runtimes with each other.

| Runtime | Source | `total` | Cost |
| --- | --- | --- | --- |
| Claude Code | `claude -p --output-format json`: `modelUsage` (every model, subagents included); `usage` (main agent only) if it is missing | input + output + cache read + cache write | `total_cost_usd`, a client-side estimate |
| Codex | `codex exec --json`: the last `turn.completed`, which carries the thread's running total | input + output (cached input is part of input, reasoning part of output) | not reported |
| Pi | `pi --mode json`: every assistant `message_end`, tool results that did nested model work, and each successful `compaction_end` | the sum of `totalTokens` | Pi's own estimate from its model table |

## A result file

`bench/results/<runtime>/<model>/<arm>/<checkpoint>/<start time>-t<n>.json`

```json
{
  "schema": 1,
  "bench": "3f1c0a9b2e7d",
  "runtime": "claude", "model": null, "modelReported": "claude-opus-5-5",
  "arm": "onus-0.4.0+8d89c12",
  "method": { "ref": "worktree", "sha": "8d89c12", "roles": { "issue": "take-case", "review": "cross-examine" } },
  "checkpoint": "cp1", "trial": 1, "durationMs": 312000, "exitCode": 0,
  "leakedUserFiles": [],
  "usage": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0, "total": 0, "costUsd": 0 },
  "score": { "pass": true, "testCatchesBug": true, "e2e": { "pass": true } }
}
```

## Limits

- **Small.** One app, three checkpoints, a few trials. It catches a version
  that makes these behaviours worse; it does not rank methods in general.
- **Noisy.** Models are not deterministic. Read pass rates with their `n`;
  three trials per cell is the minimum worth reporting.
- **The skill line.** Method arms are told to use their skill; the `none`
  arm has no skill to name. The comparison is "the method as people use it"
  against "no method", not the effect of the words alone.
- **Hand-filled rules.** `fixture-rules/AGENTS.md` is what `charter` would
  write for the notes app, filled by hand so every trial gets the same one.
  The notes app has no verify skill. Two lines in it point near the planted
  bugs, as a real adoption's would: "Known gaps: nothing tests
  `src/server.ts`" (where the cp1 bug is), and review checklist item 3 asks
  about "found, not found, bad input" (not found is the cp2 bug). The `none`
  arm has no such hints. That is part of what the method arm measures, and
  a reason to read cp1 and cp2 as "the method as adopted", not as the skills
  alone.
- **Place and words, not meaning.** The review grader counts a `BLOCKING`
  line for a bug when it points inside the bug's changed lines (one line of
  slack) and its reason uses one of the bug's words (`-1`, `splice`,
  `missing`, `404`, `204`, `not found`, ...; the lists are in
  `graders/cp2.mjs`). A correct finding in other words, or a wrong one that
  happens to use them, is scored wrongly. Every changed line of the patch is
  inside one of the two bugs, so place alone says little.
- **The format.** Only lines that start with `BLOCKING` (after a list
  marker, bold or backticks) and name `path:line` are findings. A review that
  puts findings under its own headings without that word is not read.

## Changing the bench

A new checkpoint needs a fixture state, a prompt, a grader in
`bench/graders/`, and tests in `bench/test/` that show the grader fails the
untouched state and passes a correct answer. Any change to the fixture,
patches, prompts or graders changes the bench hash, so old and new results
stay in separate rows.

```sh
node --test bench/test/*.test.mjs
```
