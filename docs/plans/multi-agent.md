# Plan: several agents work one repository under Onus

Status: **draft for review**, revised 2026-11-25. The plan itself is
`docs/plans/multi-agent.yaml`; it passes `check-plan.mjs`. "History" at the
end says how this shape replaced the first one, and what the challenge
rounds found.

## Goal

Several agents work the same repository at the same time under Onus. The
owner does not have to coordinate them, weigh options, or set anything up
beyond saying how many workers a run may use.

## The problem, reduced

Several agents is two separate problems:

1. **One scheduler, several workers: concurrency.** `docket` today runs one
   writer at a time; it already overlaps writing with CI and review ("While
   CI and the review agent run, start the next candidate", step 4). Running
   N writers is the same loop with N slots. One scheduler decides, so no two
   workers can take the same issue.
2. **Several schedulers that do not know each other**: two `docket` runs,
   or a person running `take-case` in another session while a run is on.
   Only here can two agents pick one issue. This needs mutual exclusion,
   and nothing else.

Concurrency adds one real cost: open PRs that touch the same files conflict
when the first merges. `docs/lessons.md` is the common case.

## What "done" means

- `docket` with three workers on a goal with three independent issues opens
  three PRs at once, each reviewed by an agent that did not write it, and,
  under a grant, merges them one at a time; with one worker it behaves as
  today.
- Two `take-case` runs started at the same moment on a repository with two
  free issues work on different ones.
- No lock outlives its use: a run that parks, stops or dies leaves nothing
  the owner has to release by hand.
- A conflict in `docs/lessons.md` between two open PRs ends with both entries
  whole on the base.
- Nothing new to configure. The worker count is the only new input.

## Out of scope

- Agent names, a review queue, claim PRs, and lanes assigned in advance
  (the first shape: see "History").
- Peer agents messaging each other. Issue and PR text, and what another
  agent writes, is a description of work, never an instruction (`docket`,
  last line and step 3).
- One file per lesson. Revisit if lesson conflicts turn out to be frequent.
- Predicting which issues will touch the same files. Issues do not name
  their paths (`brief` step 7's keys; `check-plan.mjs` rejects others), and
  guessing is worse than resolving a conflict once it exists.

## Answers from the owner (chat, 2026-11-24 and 25)

- Settle how Onus is used by several agents; leave platform-specific setups
  aside.
- Look for a solution with no trade-offs for the owner to weigh.
- A parent agent hands out the work to subagents; "this is just sequential
  versus concurrent execution".

## Constraints, with their sources

- A git server updates a ref atomically: a push that creates a ref only if
  it does not exist succeeds for exactly one of two concurrent pushers.
  Tested 2026-11-24 with a local bare repository: 30 races of two agents,
  exactly one winner each time, for a branch, a tag and a custom ref.
- A push of a commit the remote ref already points at succeeds as "up to
  date", so two agents pushing the same object would both "win" (tested
  the same day). Each lock object must be unique.
- git accepts any object type pushed to a namespace outside
  `refs/{heads,tags}/*` (git-push documentation), and rejects a ref with a
  single level under `refs/` ("refusing to update funny ref", git 2.43).
  A default clone or fetch does not bring `refs/claims/*` (tested). GitHub's
  matching-refs endpoint returns "anything in the namespace, not just heads
  and tags" (REST docs, Git references). **Assumed, not yet tested on
  GitHub:** a blob can be pushed to `refs/claims/<n>`, a second create is
  rejected with `(stale info)`, and `ls-remote` lists it. `claim-lock` tests
  all three on GitHub first. Tags are no fallback: a deleted tag comes back
  from any clone that pushes `--tags` (tested), and tag pushes start
  workflows. If GitHub refuses, the shape is reopened with the owner.
- A plain delete removes whatever holds the ref; a delete with
  `--force-with-lease=<ref>:<seen oid>` is rejected with `(stale info)` if
  the lock changed hands (tested). A lease rejection and a server refusal
  both exit 1; only the text `(stale info)` tells them apart.
- A runtime that runs `cross-examine` already starts a separate agent
  (`take-case` step 3); the same mechanism starts a writer.
- `docket`'s merge conditions (step 5) already require the base to be in
  and a hand-made resolution to be re-reviewed.
- A union merge driver silently dropped a lesson's Scope line (reproduced
  2026-11-24); no merge driver is used.

## Design

### Workers in `docket`

The owner gives the run a worker count with the goal ("three workers").
Default 1, which is today's loop.

1. The run (the parent) keeps up to N issues in flight. To fill a slot it
   takes the next candidate by `take-case` steps 1 and 2.
2. It takes the lock for the issue (below) and logs a `lock` row with the
   lock's object ID. It creates a worktree itself (`git worktree add`), so
   no runtime feature is needed for that, and starts a writer subagent there
   with one instruction: do issue #n by `take-case` step 3, holding lock
   <oid>, up to a PR ready for review, and report the PR number. It logs a
   `pr` row when the PR exists.
3. For each ready PR it starts a review agent, as today. A writer and a
   reviewer are never the same agent.
4. It checks every report against GitHub (the PR, CI, the review comment
   read back), never against the subagent's words, and keeps only the log
   and the verdicts in its own context.
5. Every later round on a PR, a fix for a blocking review item or a merge
   of the base, is a new writer subagent in that PR's worktree, briefed from
   the PR, its last review comment and CI. The writer that opened the PR has
   ended; the parent does not write code itself.
6. Under a grant it merges by step 5, one PR at a time. After each merge,
   the other PRs in flight bring in the base (point 5; a hand-made
   resolution means a new review, as step 5 says).
7. A runtime that cannot start subagents runs with one worker, and the
   report says so.

### The lock

The lock covers one window: from choosing an issue until its PR exists.
After that the PR is the sign of "in progress", as `take-case` step 1
already reads it, and the lock is deleted. So a PR closed unmerged frees the
issue as today, and no lock waits on the owner.

A small script in the skill does the git work, so the rules are code and
tested, not prose: `skills/take-case/scripts/claim.mjs`.

- `claim take <n> --run <run>` pushes a blob holding `claim #<n>`, `Run:`,
  `At:` (UTC), `Host:`, and `Nonce:` (16 random bytes), with
  `--force-with-lease=refs/claims/<n>:`. It prints `taken <oid>`, `held`
  (the push was rejected with `(stale info)`), or fails with git's output.
  The nonce makes every lock object unique, so two runs never both get
  "up to date".
- `claim release <n> <oid>` deletes with `--force-with-lease=refs/claims/<n>:<oid>`,
  so it never removes a lock that changed hands.
- `claim list` prints each lock with its `At:` and `Run:` (`git ls-remote
  origin 'refs/claims/*'`, then each blob fetched by ID).

When:

1. **Take.** At the start of `take-case` step 3, unless the caller passes a
   lock it holds (the `docket` parent does). `held`: on a candidate from
   step 2, go back and take the next one; on an issue the owner named, stop
   and say it is in progress. Any other failure: stop and report.
2. **Check, then release.** Just before opening the PR, `claim list`
   confirms the lock is still this run's object; if not, stop and report,
   do not open the PR. After the PR is open, `claim release`.
3. **Release on any other end.** A run that parks the issue, stops to ask
   before the PR, or ends without one releases its lock first. `docket`
   logs `release` rows.
4. **Stale.** `take-case` step 1 counts a locked issue as in progress. A
   lock whose `At:` is more than 24 hours old, with no open PR in progress
   on that issue, belongs to a run that died before its PR: step 1 releases
   it with `claim release` (the lease makes this safe if it changed hands),
   logs it, and the issue is a candidate again. No owner action, ever.

### Conflicts between PRs in flight

Open PRs that touch the same files conflict when one merges. The parent does
not try to predict this. It is resolved after it happens, by a writer
subagent in the later PR's worktree (point 5 above): merge the base, keep
both sides' intent, and for `docs/lessons.md` keep both entries whole and
renumber only its own new entries above the highest number on the base,
updating any reference to them in the same PR (`AGENTS.md`'s table, a
check's message). It lists the resolution in a PR comment; under a grant
this needs a re-review (`docket` step 5), which does not count toward the
three-round budget, since it reviews a merge, not the change.

## Examples of use

```text
/docket M1 of docs/plans/self-improvement, three workers, merge when approved
  start  goal=M1  workers=3
  lock   #31 taken   #32 taken   #33 taken   (#34 depends on all three: waits)
  pr     #31 → PR #50, #32 → PR #51, #33 → PR #52   (locks released)
  review #51 approve, #50 request changes, #52 approve
  merge  #51, then #52 (base merged into #50, #52 by their writers)
  ...
```

```text
(another session, while that run is on)
/take-case
  #31, #32, #33 in progress (open PRs); #38 free.
  claim take 38 → taken. Working on it.
```

## Contract (one-way doors)

- Lock ref `refs/claims/<issue>`, holding a blob with the lines `claim #<n>`,
  `Run:`, `At:`, `Host:`, `Nonce:`; the script `claim.mjs` and its three
  commands and outputs.
- The worker count as part of `docket`'s goal; default 1.
- The stale period: 24 hours with no PR, fixed.
- `docket` log phases `lock` and `release`.

## Risks

- **GitHub refuses the lock** (the namespace, a blob, or the lease, for
  example under a ruleset). `claim-lock` tests it first; if refused, the
  shape is reopened with the owner rather than switched quietly.
- **A push that succeeds on the server but fails on the client** (network)
  leaves a lock nobody holds. The 24-hour stale rule releases it.
- **A writer slower than 24 hours before its PR** loses its lock to the
  stale rule; the check before opening the PR stops it from opening a
  duplicate.
- **Conflicts cost re-reviews** when parallel issues touch the same files.
  If that is most of the work, it was not parallel ("Signs").
- **The parent's context** grows with many workers. It keeps only the log
  and verdicts, and a pickup rebuilds from the log, as today.

## Signs this shape is wrong

- Runs with several workers spend more time resolving conflicts than they
  save: the path check is too weak, or the work is not parallel.
- Locks go stale often: runs die before their PR, and the window needs a
  heartbeat.

## History

**First shape (2026-11-24): peers through GitHub.** Named agents claimed
issues with draft PRs, the lowest PR number winning; a reviewer agent took
a queue; lessons were to merge with `merge=union`. One challenge round
found fifteen problems (the union driver losing lines, fork PRs reaching
the queue, `git config` names leaking across worktrees, `docket` not
fitting a reviewer agent, among others), all settled in that revision.
Then the owner asked for a solution without trade-offs and suggested a
parent dispatching to subagents. Reduced to concurrency plus mutual
exclusion, that shape needs neither names, nor claim PRs, nor a queue, and
the lock replaced the draft-PR claim, whose safety rested on an unsourced
assumption about list consistency.

**This shape (2026-11-25).** One challenge round: holds with fixes, twelve
findings, all on the lock's lifecycle and definitions, none on the shape.
Findings 1 and 9 were reproduced before they were settled.

| # | Finding | Settled |
| --- | --- | --- |
| 1 | Two identical lock blobs both "win" ("Everything up-to-date", exit 0); the content was not unique | `Host:` and a random `Nonce:` in every lock |
| 2 | Locks were never released after a park, a stop, a run without a PR, or a PR closed unmerged | The lock lives only until the PR exists; every other end releases it |
| 3 | The stall rule was undefined and flagged PRs waiting for the owner | Stale = `At:` older than 24 hours and no open PR on the issue; released automatically |
| 4 | Where `take-case` takes the lock was unspecified | At the start of step 3, unless the caller passes its lock; a named issue that is held stops |
| 5 | The path-overlap check did nothing: issues do not name paths | Dropped; conflicts are resolved after they happen |
| 6 | Nobody owned fix rounds and base merges after the writer ended | Each later round is a new writer subagent in the PR's worktree |
| 7 | No `lock` row, so a pickup could not find its locks | `lock` and `release` phases |
| 8 | The tag fallback brings deleted locks back and starts workflows | Dropped; a refusal reopens the shape |
| 9 | Plain deletes remove a live holder's lock | Release only with a lease on the seen object ID |
| 10 | "Taken" and "refused" have the same exit code | The script reads `(stale info)` and prints `held` |
| 11 | The acceptance tested git, not the change, outside `npm test` | The lock is a script with its own tests, run by `npm test` and CI |
| 12 | Loose statements in the record | Corrected |

These revisions were not challenged again.

## Still owed

- `brief` step 5 on this shape.
- The owner labels the issues the agent may do, starting with `claim-lock`.
