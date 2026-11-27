# Plan: the owner sees what each stage produced, and trusts it for the right reasons

Status: **draft for review**, revision 10, 2026-11-27. Revisions 1 to 3
surveyed agent products, research on supervising agents, status practice
and visual review; revision 4 corrected a self-review of revision 3;
revisions 5 to 8 settle independent challenge rounds 1 to 4; revision 7
applies the owner's decision after round 3 ("Decision for the owner");
revisions 9 and 10 answer the PR review.
The plan itself is `docs/plans/visible-progress.yaml`; it passes
`check-plan.mjs`. Sketches: `sketch/visible-progress-a` and `-b` (local,
not pushed).

**Only M1 is committed.** It holds on one shared GitHub account. The
measures that need to tell the owner from the agent (track record, time to
decision, grant-merge counts) are a separate milestone, **Measured**, built
once the agent has its own identity (section 11). M2 and M3 are built only
if M1 says so ("Go or stop after M1").

## Goal

At the end of each stage, the owner is told, can see what it produced as
evidence of the right kind (not only pictures), decides from one page, and
answers with one action. What the owner accepts stays accepted: a later
change to it is shown again.

## The strategy in one paragraph

The scarce thing is not evidence; Onus already makes plenty. It is the
owner's attention, and the owner's trust being worth what it is placed on.
The design optimises two numbers: **time from an exhibit to the owner's
decision**, and **how often "done" held up**. M1 makes them better; the
Measured milestone, once the agent has its own identity, measures them. Other
agent products treat a demo as a deliverable from the agent to the owner.
Onus treats it as a claim: it carries proof of the right kind, someone
other than the writer judges it, and once the owner accepts it, it becomes
a check.

## The problem, reduced

- **The evidence stays local** (`evidence-kit` run folders, `.runs/`).
- **The owner is not told.** With the agent on the owner's own GitHub
  account, nothing it posts notifies the owner.
- **A long run speaks once, at the end** (`docket` step 6).
- **Nothing says what a stage should show, or what counts as proof of it.**
  A screenshot shows a screen, not that the data was saved.
- **The owner's judgment is not kept**, so nothing notices when a later
  change undoes something the owner accepted.
- **Trust is not measured.**

## What the surveys found

### Agent products: one pattern

The agent that wrote the change records a demo once and attaches it:
Cursor's cloud agents (videos, screenshots, logs on the PR), Devin (a video
of its test plan after CI is green; reactions fed back), GitHub Copilot
(Playwright screenshots in the PR), Replit (decides itself when enough
changed to test; replayable video), Codex (cites logs for claims), pstack
(`/ketchup`: plain words, pictures first, each call with a pick, evidence
and risk; check-ins that stay quiet when nothing changed).

### Research on supervising agents

- MANDATE (arXiv 2610.34748), 23 delegation failures from 163,487 posts:
  agents misreport what they did, grade their own work too generously, game
  the check, run without progress; failures rated more severe were harder
  to notice. Advice: organise by goal, flag where the user must step in,
  show the plan first, give independent evidence rather than the agent's
  summary.
- Supervising coding agents (arXiv 2609.24234): Plan, Monitor, Wait,
  Review, Teach, Manual Fix, Update Assets; the original plan must stay
  visible during review.
- Intelligent AI delegation (arXiv 2602.11865): trust should match real
  capability; operators need a readable record of performance.
- Anthropic's harnesses: a feature list whose items start `passes: false`;
  sprint contracts agreed before the work and graded per criterion by an
  evaluator driving the app, which out of the box argued real issues away.

### Status practice and visual review

Linear's project updates (declared on track / at risk / off track); BLUF;
Scrum's sprint review (an inspection that adapts the backlog, not a demo);
Shape Up's hill chart (declared position); Amazon's working backwards;
Chromatic (a person accepts each visual change into the baseline);
approval testing (human judgment turned into a test); VHS and Playwright
(demos as code, replayable traces).

## Principles

1. **Bottom line first, by exception.**
2. **Derived, never declared.** Health, states, promises and the track
   record are computed from GitHub every time, never stored as the agent's
   statement.
3. **Promised before, judged after,** by someone who did not do the work.
4. **Proof of the right kind.** A user-visible claim needs evidence of the
   state it changed, not only of the screen. Pictures help the owner see;
   they never prove.
5. **Demos are code,** re-run by CI, so they never go stale.
6. **The owner's acceptance becomes a check,** through an act only the
   owner performs: a merge.
7. **Trust is measured,** in counts.
8. **Four depths:** ten seconds, one minute, ten minutes, forensic.
9. **Inspect and adapt:** every exhibit ends in decisions that change the
   run.
10. **Initial numbers are guesses.** Every threshold here is a starting
    value, listed under "Signs this shape is wrong" to be tuned.

## Design

### 1. Who the agent is (first, because notification depends on it)

When the agent uses the owner's GitHub account, the owner is notified of
nothing it posts, and an owner's reaction cannot be told from the agent's.
The first M1 issue is an Investigation: a machine account or a GitHub App
for the agent; cost, setup, what notifies the owner, what changes in
`docket`'s grant rules and what branch rules can then enforce. Until the
owner decides:

- the exhibit still works as a page the owner opens (the progress issue is
  pinned, so it is one click from the repository);
- reactions and replies are **signals** only (8); M1 counts nothing about
  the owner. The measures that would (section 11) wait for this decision.

### 2. The page: one progress issue per goal

`docket` opens `Progress: <goal>`, labelled `onus:exhibit`, and tries to
pin it. GitHub pins at most three issues per repository; when the pin fails,
the run logs it, carries on, and the exhibit's bottom line says it is not
pinned.

**The body is the pure output of `progress.mjs`** (bottom line, progress
graph, promised vs shown, and a link to the latest exhibit comment). Apart
from its time stamp and the run's own inputs (section 3: the in-flight list
and the grant), and the health that follows from them, it is derived from
GitHub. **Only a live `docket` run that has `take` rows (or claim refs, when
they exist) rewrites the body**; a session `/exhibit` or a pickup with no
`take` rows yet posts a comment only, so it never overwrites a live run's
in-flight view. The exhibits with their narrative (`Needs you`, `Show`, `Numbers`,
`Not shown`) are comments. Two runs that open the issue at the same time
both list `onus:exhibit` issues with that title right after; the higher
number is closed with a link to the lower. Within a run, only the `docket`
parent posts; workers never do.

On a **public repository** the progress issue is a message to people
(`docs/development.md`, The loop: stop and ask before "a message to
people"). There the run asks once, before the loop, whether to open it and whether
to push pictures to `onus-exhibits`; an unattended run does neither, keeps
exhibits in `.runs/exhibits/` only, and says so in its report.

The body's visible first line:

```text
🟡 At risk · 2 decisions need you · 5/9 done · updated 2026-11-27 09:10
```

with two optional tokens, appended when they apply: `· not pinned` and
`· in flight: unknown`.

A single PR's exhibit is its `## Exhibit` section. M1 adds that heading to
`docs/development.md` step 5 for a change a user can see (with the verify
skill's evidence, kinds per section 4); the PR's writer (a worker subagent
under the multi-agent plan) writes it. Since the PR body is on GitHub,
`progress.mjs` itself runs `check-exhibit.mjs --section` on it, and a PR
whose section fails is not **ready** (section 3); `docket` step 5 gains
the same condition before a merge under a grant.

### 3. Health, state and promises, derived

`skills/exhibit/scripts/progress.mjs` reads GitHub (issues, PRs, check
runs, review comments) and computes everything below each time. It stores
nothing. It takes two inputs from outside GitHub, both from the live run:
**whether the run holds a grant** (a `grant` row, `docket` step 3, which
lives only in the session and the log), and the list of issues **in
flight** before their PR opens: `take-case` marks work in progress only by
an open PR, and nothing is pushed earlier. `docket` logs a row with phase
`take` and the issue when work on it starts, and the live run passes the
open `take` rows to `progress.mjs`. A dead run posts nothing, so only a live
run's view is ever shown. A pickup on another machine has no such rows:
until it logs its own, or the multi-agent plan's `refs/claims/<n>` locks
exist (read instead when present), stalls are not detected, and the bottom
line says `in flight: unknown`.

- **A review** is a comment whose body begins with `cross-examine` step 7's
  header line (`_Review by an independent agent (<model>), at <full head
  SHA>._`); in a live run, only those whose IDs the run logged in `review`
  rows (as `docket` step 5.3 requires). A writer's reply that quotes a
  review is not one.
- **Ready:** an approving review naming the PR's head, all checks passed,
  and the PR's `## Exhibit` passing `check-exhibit.mjs --section` when the
  change is user-visible.
- **Finished unit:** a PR opened, a review, a merge, or a check run created on a new PR head (GitHub's timestamp, so a
  pushed fix counts as `docket` step 4.5 already counts it).
- **Per issue:** waiting, figuring out, built, back uphill (with its round
  count), ready, done, parked.
- **Health:** off track when an issue on the remaining dependency path is
  parked or a `docket` budget is spent; at risk when an issue went back
  uphill twice, a demo failed twice (from M2, when demo jobs exist), or an
  in-flight issue has had no finished unit for 6 hours; on track otherwise.
- **Decisions waiting** (the bottom line's count): parked issues
  (owner-and-agent label) plus ready PRs the owner must merge: all of them
  without a grant, and with one, those the grant does not cover (protected
  paths, `docket` step 5.2).
- **Promises:** criteria are numbered. `cross-examine` step 7 writes each
  line as `- AC<k> <criterion>: met | not met | cannot tell - the evidence`,
  `<k>` being the criterion's position in the issue's acceptance list, and a
  re-review keeps the numbers for the lines it restates. For each criterion
  `progress.mjs` takes the latest answer across the PR's reviews; the criterion shows `met` when that answer is `met` and the
  newest review's header (`at <full head SHA>`) names the PR's head
  (`headRefOid`, at merge for a merged PR). Otherwise it shows `met at <sha>;
  later commits not reviewed`. `progress.mjs` does not repeat `docket` step
  5.3's git checks. In M1 the line carries no kind of evidence, so the
  exhibit says `met (kind not judged)`; M2 adds a kind token. An
  Investigation or a Spike has no review: its criteria show `answered` when
  the issue is closed with its answer, never `not shown`.
- **Graph:** Mermaid, by dependency, coloured by state. Past 30 nodes done
  issues collapse into one node; if still past 30, issues not on the
  remaining dependency path collapse by milestone. 30 is a starting value
  (GitHub documents no node limit; `exhibit-progress` measures where a
  graph stops rendering). The body is kept under GitHub's 65,536-character
  limit: past 60,000 the graph is replaced by a link to the latest exhibit.

### 4. Proof of the right kind

What counts as the main evidence depends on the kind of work
(`docs/development.md`, "Kinds of work"):

| Kind | Main evidence (required) | Supporting (optional) |
| --- | --- | --- |
| Feature, user-visible | the state the action changed (a stored row, an API response, a file written, an exit code), from the real app | screenshot, video, trace |
| Bug fix | the run that failed before and passes after, on the real surface | screenshot of both |
| Refactoring | tests or golden outputs equal before and after | none needed |
| Performance | before → after with command, run count and spread, and what bounds it | chart |
| Investigation | the answer, with the commands or sources it rests on | none |
| Spike | what was learned and the throwaway branch | demo if any |
| Look-only (layout, styling, copy: a change whose whole claim is how it looks) | the screenshot, marked `Look-only:` on the claim line | before and after |

So an exhibit line "you can now save a draft" needs, at least, the saved
draft read back from storage or the API; the screenshot is attached for
the owner to see. A claim whose only evidence is a picture fails the
check, unless the claim line is marked `Look-only:`. A change a user
cannot see goes under `## Not shown`, with its main evidence.

### 5. The exhibit and its check

Headings, in order, empty ones dropped: `## Bottom line`, `## Needs you`,
`## Promised vs shown`, `## Show`, `## Changed since you accepted` (M3),
`## Numbers`, `## Track record` (Measured), `## Progress`, `## Not shown`.

- `Needs you` is in pstack's ketchup form: the call, the pick, what it
  changes for users, the evidence for the pick, the risk even when low.
  Items are never cut to save words.
- `Show` lists per claim its main evidence first, then pictures. A visible
  change with no picture says `No screenshot yet`.
- Plain words: "the tests pass", not "CI green".

`skills/exhibit/scripts/check-exhibit.mjs` fails an exhibit when: a heading
is unknown or out of order; the bottom line is malformed; a claim line has
no evidence link; **a claim's only evidence is an image or a video and it
is not marked `Look-only:`**; a
number has no command; a performance number has no run count; a linked
picture does not exist; a `Needs you` item lacks a pick or a risk; a track
record line is a bare percentage; or the page, **not counting `Needs you`
and `Promised vs shown`**, links and pictures, runs past 300 words.
`Promised vs shown` cites each criterion by issue number and at most eight
words, never in full.

`check-exhibit.mjs --section` checks a PR's `## Exhibit` instead: the
section only, with its own headings (`Show`, `Numbers`, `Not shown`), no
bottom line, and the same evidence rules. A project chartered before M1 has
a `docs/development.md` without the `## Exhibit` heading; its writers read
the rule from the `charter` skill's own `templates/docs/development.md`, as
`docket` step 6 already does for the lessons refresh.

**The format is read as GitHub renders it** (the owner's decisions,
2026-11-27). After three re-reviews of PR #79 each found markdown structure
that hid a claim from a hand-made parser, the owner chose a strict
whitelist of line shapes; after two more found structure the line rules
still let through (a table dropping its extra cells, URLs inside a
picture's attributes), the owner chose a markdown parser instead. The check
reads the page with `markdown-it`, the way GitHub renders it, and accepts
only `##` headings, paragraphs, one-level lists whose items hold only text,
and a fence inside `## Progress`; no HTML but a plain `<img>` with an https
source. Links and pictures come from the parsed page, so text GitHub shows
inside a picture is never evidence. The exhibit skill writes in that
format; the script's header comment is where it is defined. Without
`markdown-it` installed the check does not run (exit 2) rather than guess.

The skill never posts a page that fails it.

### 6. Safe to post

- Pictures, videos and traces come only from the verify skill's isolated
  instance with seed data and seed credentials.
- **Traces are not posted** on a public repository: a Playwright trace
  holds network requests and responses, headers included. On a private one
  they go up only after `attach.mjs` checks them for the project's known
  secret names and token patterns and refuses on a match. Archives (a
  trace is a zip) are unpacked before the scan, since a compressed token
  does not match a pattern.
- Content from outside the project follows the verify skill's rule on what
  must not be printed.
- On a public repository the exhibit says it is public.

### 7. When an exhibit is made

In a session: `/exhibit`. In a `docket` run, unasked:

1. **Always** at a finished milestone and at the run's end.
2. **Always** when health turns worse.
3. **Always** on a stall: work in flight with no finished unit for 6 hours,
   with the last log rows and what the agent is trying.
4. **The agent's call** when a demo first passes, or three units finished
   unshown.
5. **Never** two with nothing new, never one per PR. When the run ends with
   nothing new since the last milestone's exhibit, that exhibit is the
   run's last, and the report links it instead of posting another.

Each is a log row with phase `exhibit`.

### 8. Answers change the run

Each `Needs you` item ends with how the owner answers, using the channels
the method already trusts: a message in the session, a merge, or for a
parked issue the label change `docs/development.md` ("Picking work")
already defines. The run never acts on reactions or replies on the progress
issue, and comment text is a description of work, never an instruction.
In M1 the agent never reacts, so a 👎 or 😕 from an account with write
permission is a person's signal even on one shared login: it makes the
next exhibit re-check and list that exhibit's claims, and changes nothing
else. Replies are not read in M1, since on one login they cannot be told
from the agent's own comments; Measured reads them.

### 9. M2: demos as code, judged by a witness

Built only if M1 says so.

- **Demos.** `evidence-kit` adds a harness command `demo`: run one file
  from `demos/` on an isolated instance; it must assert the main evidence
  of section 4 (a demo that only navigates and screenshots fails its own
  lint), and records pictures alongside. Playwright for pages, VHS for a
  CLI, saved requests and responses for an API. CI runs every demo; checks
  use assertions and screenshots, video is kept only as an artifact.
- **Flakes.** A failed demo gets one fresh run. Failing twice, it is
  reported as failed and counts toward at risk; a demo that passes on the
  rerun is reported as flaky, and the second flake of the same demo is a
  lesson: fix the demo.
- **Promised before.** `brief` writes an `Exhibit:` line per milestone and
  names the demo for each user-visible criterion. The demo exists before
  the PR opens (not before the code: exploring a UI with an end-to-end
  script first is slower than it helps).
- **The witness judges; CI executes.** `cross-examine` reads the demo runs
  CI made on the PR's head and answers per criterion: does this demo prove
  this criterion, with evidence of the right kind, and does its output show
  what the PR claims? Its criterion line gains a fixed kind token
  (`met [state]`, `met [before-after]`, `met [look-only]`, ...), which
  `progress.mjs` reads. It does not re-run what CI ran, except to check a
  doubt. A PR that changes an existing demo or its assertions must say why
  in `## Scope`; the witness treats an unexplained weakening as blocking.
  A problem found stays a finding: the prompt says not to argue it away.
- **CI for demos** in an adopting project is a change to `.github/`, which no
  grant merges: `evidence-kit` opens it as a PR for the owner.

### 10. M3: the owner's acceptance becomes a check

Built only if M2 says so.

- At a milestone's end, the exhibit skill opens one PR that writes the
  milestone's witnessed demo outputs (scrubbed of times and IDs) to
  `demos/approved/`. **The owner merging it is the acceptance**: an act
  only the owner performs, even on a shared account, because no grant
  covers it. That rests on instructions, as every grant rule does (`docket`
  step 3, "What holds it"), so it is put where it cannot be forgotten:
  `docket` step 5.2 names `demos/approved/` next to `.github/` as never
  mergeable under a grant, whatever `AGENTS.md` says, and the exhibit skill
  refuses to open the accepted-outputs PR unless the base branch's
  `AGENTS.md` lists `demos/approved/` under "Protected paths" (it tells the
  owner to add it, which covers projects chartered before M3).
- From then on the harness compares each demo run with its accepted
  output. A difference does not fail CI (it may be intended); it puts the
  demo under `## Changed since you accepted`, before and after side by
  side, with the PR that changed it. Accepting the new output is another
  such PR; rejecting it goes through the channels section 8 trusts: the
  owner says so in a session, and the run opens a bug issue. A 👎 only puts
  the item under `Needs you` in the next exhibit.
- Scrubber noise: if the owner rejects the same kind of noise twice, the
  scrubber is the lesson.

### 11. Measured: after the agent has its own identity

Built once the owner has settled `agent-identity` with an account or an App
for the agent. Then attribution is a fact of GitHub, with no marker:

- **Grant merges** are merges whose `merged_by` is the agent's account
  (only a grant lets it merge); the owner's merges are by the owner's
  account. No message format is needed, so rebase merges count too.
- **Owner answers** are reactions, replies, merges and label changes by an
  account with write permission other than the agent's.
- **Track record**, in counts: criteria met on first review / all reviewed;
  grant merges later reverted (a merged PR whose title starts `Revert "` and
  whose body names the original PR, GitHub's own revert format) / all grant
  merges; owner 👎 or 😕 / owner reactions; from M3, accepted outputs
  changed without an intended PR.
- **Time to decision:** for each `Needs you` item, from the comment to the
  first owner answer on GitHub. Answers given in a session are not on
  GitHub; the run logs them with phase `answer-session`, and the exhibit
  prints both counts, so a mostly-session owner does not read as slow.

### Go or stop after M1

After M1 has run on at least one real `docket` goal, the owner looks at
these, and decides whether to build M2:

- how many times the owner still asked "where are we" during the run;
- how many exhibits the owner found worth reading, and how many
  `Needs you` items were answered from the exhibit alone, without asking
  for more.

On one account these are the owner's own counts: nothing on GitHub tells
the owner's actions from the agent's. `docket` step 6 lists the exhibits
posted and each `Needs you` item with the channel it was answered through
(from the log), and asks the owner for the two counts. With Measured built, time to decision
is added. M3 is decided the same way after M2, with the track record's
first-review rate added.

## Corrections in revision 4

| # | Defect in revision 3 | Correction |
| --- | --- | --- |
| 1 | The owner is not notified when the agent uses the owner's account, so "seen without asking" did not hold; identity was left for M3 | Identity is M1's first issue; until settled the issue is pinned and reactions are signals only |
| 2 | `promises.json` and `record.json` lived in git-ignored `.runs/`, lost on pickup elsewhere | Nothing stored; all derived from GitHub each time |
| 3 | A 👎/👍 reaction counted as acceptance, though a shared account cannot tell who reacted | Acceptance is the owner merging a PR to a protected path |
| 4 | The witness re-ran demos CI had already run | CI executes; the witness judges fit, kind of evidence, and weakened demos |
| 5 | Demos before code slowed UI exploration | Demos before the PR opens |
| 6 | No rule for flaky demos; video in CI is heavy | One fresh run; second flake is a lesson; video only as an artifact |
| 7 | Thresholds were stated as rules | Marked as initial values, listed under "Signs" |
| 8 | Eleven issues committed at once | M1 committed; M2 and M3 after go/stop |
| 9 | "Time to decision" was a goal with no measure | Derived per `Needs you` item |
| 10 | Picture hosting untested | Still first to probe; Mermaid and text fallback |
| 11 | A screenshot alone could pass as proof | Section 4; the check fails image-only claims |
| 12 | The 300-word cap could cut decisions | `Needs you` excluded from the cap; items never cut |
| 13 | Traces can hold headers and tokens | Not posted on public repositories; scanned before upload on private |
| 14 | A PR could weaken its own demo, since CI runs the PR's demos | Changes to demos must be explained; the witness blocks an unexplained weakening |
| 15 | With several workers, who posts was unsaid | Only the `docket` parent posts |
| 16 | "Nothing finished since the last exhibit" made at risk trigger trivially | At risk needs 6 hours with work in flight and no finished unit |
| 17 | Large goals could exceed what Mermaid renders | Done issues collapse past 30 nodes |

## Challenge

**Round 1 (2026-11-26).** A separate agent with no context from this
session. Verdict: holds with fixes; fourteen findings, all settled in this
revision. Findings 1, 2, 3 and 12 were reproduced before they were settled
(`check-agent-files` exits 1 with `agent files: exhibit: no SKILL.md`;
`package.json` and `check.yml` run no test under `skills/exhibit/`; `.runs/`
is git-ignored per `docket` step 1; `cross-examine` step 7 prints `met |
not met | cannot tell - the evidence` with no kind).

| # | Finding | Settled |
| --- | --- | --- |
| 1 | Script PRs before the skill fail `check-agent-files` (no SKILL.md) | `exhibit-scaffold` adds a stub SKILL.md first |
| 2 | Wiring tests into `npm test` and CI touches protected `package.json` and `.github/` | `exhibit-scaffold` does it, as the owner's PR; script issues depend on it |
| 3 | "Stores nothing" was false: stalls, failed demos and grant merges came from the local log | GitHub only: PR, review and merge events, `merged_by`, check runs |
| 4 | Acting on replies and reactions contradicted the method | They only inform the next exhibit; answers go through session, merge or label |
| 5 | Time to decision counted the agent's own actions | Only accounts other than the run's; otherwise "unavailable" |
| 6 | GitHub pins at most three issues | Pin is attempted; failure logged and shown |
| 7 | "Always at run end" vs "never two with nothing new" | The last milestone exhibit stands in for the run-end one |
| 8 | Risks allowed look-only screenshots the check forbade | A `Look-only:` row and marker, with a fixture |
| 9 | A token inside a zipped trace passes a grep | Archives unpacked before the scan; zipped-trace test |
| 10 | M3 merge protection missing in projects chartered earlier | Hard-coded in `docket` step 5.2; the skill refuses without the path in `AGENTS.md` |
| 11 | Two runs on one goal would both rewrite the body; PR exhibits are written by workers | Body owned by the run named in its marker; parent checks workers' `## Exhibit` |
| 12 | M1 cannot judge the kind of evidence from today's review output | M1 shows `met (kind not judged)`; M2 adds a kind token |
| 13 | Restating M1's criteria used 289 of 300 words | `Promised vs shown` excluded from the cap, cited by number |
| 14 | No code sketches (`brief` step 4) | `sketch/visible-progress-a` (pull, chosen) and `-b` (push events) |

Risks the round raised, added below: `[skip ci]` does not stop workflows on
other events; the orphan branch grows clones; public exhibits are messages
to people (now handled in 2).

**Sketches.** A: `progress.mjs` exports `states`, `health`, `trackRecord`,
`bottomLine`, all derived from `gh` on each call. B: `events.mjs` exports
`append`, `read`, `render`, each skill step appending an event to a log on
`onus-exhibits`. Both examples reach "not implemented". B gives progress a
second owner next to GitHub, every skill must call `append`, and its events
are the agent's own statements: declared, not derived. A was kept.

**Round 2 (2026-11-26).** A new agent with no context. Verdict: holds with
fixes; eight findings, all settled in revision 6. It confirmed the scaffold
does not break CI (`node --test` with an unmatched glob exits 0, and `bun
test` given a missing directory together with existing ones, as CI runs it,
exits 0; alone on a missing directory it exits 1). Findings 6 and 7 were checked before
settling (`cross-examine` step 7 prints `at <full head SHA>`;
`.claude-plugin/marketplace.json` has `"source": "./"`).

| # | Finding | Settled |
| --- | --- | --- |
| 1 | M3 still acted on a 👎 | Rejection by the owner in session; 👎 only lists the item |
| 2 | Grant-merge counts took any merge by the account, owner merges of protected PRs included | Counted only with the `onus-grant: <run>` marker `docket` writes |
| 3 | In-flight work before a PR is not on GitHub, so stalls never fired | The live run passes in-flight issues; claim locks replace that when present |
| 4 | Body ownership by run name broke on same-day runs and on pickups elsewhere | The body is pure `progress.mjs` output, the same from any run |
| 5 | M1 checked a `## Exhibit` heading only M2 added | The heading moves to M1 (`exhibit-skill`) |
| 6 | `met` ignored which head the review covered | `met` only when the review's SHA equals the head |
| 7 | The stub skill would install as invocable for every adopter | Stub has `disable-model-invocation: true` and says it is not usable |
| 8 | Protected `AGENTS.md` (skill list, offline test command) goes stale | Named in `exhibit-scaffold` and `exhibit-skill` |

Its risks are added under Risks.

**Round 3 (2026-11-26).** A new agent with no context. Verdict: holds with
fixes; ten findings. `brief` step 5 allows three rounds; with proven
problems still standing, the plan stopped for the owner ("Decision for the
owner"), and revision 7 settles them by that decision.

| # | Finding | Settled in revision 7 |
| --- | --- | --- |
| 1 | Rebase merges have no merge commit, so the `onus-grant` marker is lost (GitHub docs, "About pull request merges") | Marker dropped; grant merges counted in Measured by the agent's own account |
| 2 | Default merge messages can include PR text, so PR text can forge the marker; `<run>` is undefined | Marker dropped, as 1 |
| 3 | "Identical body" contradicts the timestamp, `now`, and the local in-flight input | Identical apart from time stamp and in-flight list; pickup elsewhere shows `in flight: unknown` |
| 4 | No log row is written when work on an issue starts | `docket` logs a `take` row |
| 5 | Re-reviews restate only affected criteria, so met criteria read as unreviewed | Latest answer per criterion across the PR's reviews, newest naming the head |
| 6 | Review lines cannot be matched to criteria | `AC<k>` numbering in `cross-examine` step 7, in M1 |
| 7 | `## Exhibit` still added again in M2 | Removed from `witnessed-exhibit` |
| 8 | `check-exhibit` cannot check a PR section; projects chartered earlier never write one | `--section` mode; the templates fallback |
| 9 | "Finished unit" has two definitions; fix rounds read as stalls | A check run on a new head counts |
| 10 | Time to decision never counts answers given in session | Moved to Measured, with session answers logged and counted apart |

Its risks: Mermaid's own size limits and GitHub's body limit (handled in
section 3); Investigations and Spikes having no review (handled in section
3); the rest are added under Risks.

## Decision for the owner

Across the three rounds, most findings fall in one place: **numbers about
the owner and about grant merges, derived from GitHub while the agent and
the owner share one account** (round 1: 3, 5; round 2: 2, 3; round 3: 1, 2,
3, 9, 10). Each fix adds a marker, a rule or an exception. The rest are
ordinary wording fixes.

Shapes:

- **A. Keep M1 as it is,** apply round 3's settlements, and challenge a
  fourth time. Most complete; the most moving parts, on the weakest ground.
- **B. Shrink M1 to what holds on one account:** the progress issue, the
  derived states and health, `Needs you`, evidence of the right kind and its
  check, `Promised vs shown` with numbered criteria. The track record, time
  to decision and grant-merge counts wait until the agent has its own
  identity. Round 3 findings 1, 2, 9 and 10 disappear; 3 to 8 are wording.
- **C. Decide the agent's identity first.** With its own account, a merge by
  that account is a grant merge, an action by any other account is the
  owner's, and notifications work: round 3 findings 1, 2 and 10 disappear
  without markers. Costs an account or an App, and changes `charter`.

B and C combine: B now, the measures back once C is decided.

**The owner chose B and C combined (2026-11-26).** M1 is shape B; the
measures are the Measured milestone, after `agent-identity`.

**Round 4 (2026-11-26)**, on revision 7. Verdict: holds with fixes; ten
findings, each a rule change, all settled in revision 8.

| # | Finding | Settled |
| --- | --- | --- |
| 1 | Section 8 filtered out the owner's own reactions on one login, and read replies that cannot be attributed | The agent never reacts in M1, so write-permission 👎/😕 count; replies wait for Measured |
| 2 | "Decisions waiting" needed the grant, which is not on GitHub; "ready" was undefined | Grant passed in as a second outside input; ready defined |
| 3 | The `## Exhibit` check was local, so the page and `docket` step 5 could disagree on ready | `progress.mjs` runs `--section` on the PR body; step 5 gains the condition |
| 4 | A session `/exhibit` or a pickup would overwrite a live run's in-flight view | Only a run with `take` rows or claim refs rewrites the body |
| 5 | Health follows the clock and the in-flight list, so bodies are not identical | Compared with a fixed `now`, apart from the run's inputs and the health they give |
| 6 | The bottom line lacked the `not pinned` and `in flight: unknown` tokens | Optional tokens defined, with fixtures |
| 7 | md and yaml disagreed on who produces the go-or-stop counts | Step 6 lists the facts and asks the owner for the counts |
| 8 | Sketch A still carried `agentLogin` and `trackRecord` | `exhibit-progress` builds on sketch A without them |
| 9 | Any comment from the account could read as a review | Only comments starting with the step 7 header; logged IDs in a live run |
| 10 | The `[skip ci]` criterion could not fail | A control push without it must show a run |

Its risks are added under Risks. Revision 8's settlements were not
challenged again; the PR review checks them.

## Out of scope

- A dashboard app, a hosted page, or a chat integration.
- Narrated video.
- Automatic changes to the grant from the track record.

## Answers from the owner (chat, 2026-11-26)

- Results are invisible during development; each stage should end with
  something to show, as data or a working demo.
- A skill the agent uses at the current stage; unattended, the agent
  decides when to report.
- Take it as far as it goes, beyond pstack; widen the search; think about
  strategy.
- Verification must not be screenshots alone.
- Add the corrections and any other defects found to the plan.

## Constraints, with their sources

- GitHub has no API for attaching an image to a comment. **Assumed, not
  tested:** an image committed to a branch of the same repository renders
  in a comment via `blob/<branch>/<path>?raw=true`, also on a private
  repository. `exhibit-images` tests it first.
- GitHub renders Mermaid in issue and PR comments (GitHub Docs, "Creating
  diagrams"). **Assumed:** a size limit exists; GitHub documents none, and
  `exhibit-progress` measures it.
- `[skip ci]` in the head commit message skips workflows triggered by push
  and pull_request (GitHub Docs, "Skipping workflow runs").
- **Assumed, not tested:** GitHub does not notify an account of its own
  actions, a self-mention included (GitHub Docs, "About notifications",
  describes notifications for others' activity only). `agent-identity`
  confirms it.
- Reactions are listed with their author by `GET
  /repos/{owner}/{repo}/issues/comments/{id}/reactions`, and an account's
  permission by `GET /repos/{owner}/{repo}/collaborators/{user}/permission`
  (GitHub REST docs, "Reactions" and "Collaborators").
- A Playwright trace holds network requests and DOM snapshots (Playwright
  docs, "Trace viewer").
- GitHub pins at most three issues per repository (GitHub Docs, "Pinning an
  issue to your repository").
- `check-plan.mjs`, `.claude-plugin/`, `package.json`, `.github/` and
  `AGENTS.md` are protected (`AGENTS.md`, "Protected paths"); adding
  `demos/approved/` to an adopting project's protected paths is a change
  to its `AGENTS.md`.

## Shapes considered

- **A, chosen:** derived health and record, evidence of the right kind,
  demos judged by a witness, acceptance by merge, built in stages.
- **B: writer-recorded demos per PR** (Cursor, Devin, Copilot): one-off,
  self-graded, pictures as proof.
- **C: catch-up in the chat** (pstack ketchup): lost when the chat ends.
- **D: declared health in a tracker** (Linear): the author's opinion.
- **E: a local dashboard from `.runs/`**: on one machine.

## The contract: types and signatures

What the M1 issues build against. Sketch A (`sketch/visible-progress-a`,
local) was the first draft of this; the record, not the sketch, is the
contract.

```js
// skills/exhibit/scripts/progress.mjs
/** @typedef {'waiting'|'figuring-out'|'built'|'back-uphill'|'ready'|'done'|'parked'} State */
/** @typedef {'on-track'|'at-risk'|'off-track'} Health */
/** @typedef {{repo: string, goal: string, issues: number[], progressIssue: number | null}} Goal */
/** @typedef {{issue: number, since: string}} TakeRow   // an open `take` row; ISO 8601 */
/**
 * What only the live run knows (section 3). From a session `/exhibit` or a
 * pickup with no rows: { grant: false, take: null, reviewIds: null }.
 * @typedef {{grant: boolean, take: TakeRow[] | null, reviewIds: number[] | null, now: Date}} RunInputs
 */
/** @typedef {{number: number, state: State, rounds: number, pr: number | null, ready: boolean}} IssueState */
/**
 * @typedef {{issue: number, ac: number, text: string,
 *   status: 'met (kind not judged)' | 'met at sha' | 'not met' | 'cannot tell' | 'answered' | 'not shown',
 *   sha: string | null, review: string | null}} Criterion   // review: comment URL
 */
/** pinned: read from the repository's pinned issues for goal.progressIssue (false when null). */
/** @typedef {{health: Health, waiting: number, done: number, total: number, pinned: boolean, inFlight: 'known' | 'unknown'}} Summary */
/** @typedef {(args: string[]) => Promise<any>} Gh   // runs `gh api ...`; injected so tests use fixtures */

/** @returns {Promise<{issues: IssueState[], criteria: Criterion[], summary: Summary}>} */
export async function derive(goal, run, gh) {}
/** "🟡 At risk · 2 decisions need you · 5/9 done · updated <ts>[ · not pinned][ · in flight: unknown]" */
export function bottomLine(summary, updatedAt) {}
/** Mermaid source; collapses past 30 nodes (section 3). */
export function graph(issues, dependsOn) {}
/** The progress issue body: bottom line, graph, promised vs shown, link; under 60,000 characters. */
export function body(derived, latestExhibitUrl) {}
```

```js
// skills/exhibit/scripts/check-exhibit.mjs
/** @typedef {{line: number, rule: string, message: string}} Problem */
/** mode 'page': a whole exhibit; 'section': a PR's `## Exhibit` only. exists: does a linked picture exist. */
export function checkExhibit(markdown, { mode, exists }) {}   // returns Problem[]; empty means it may be posted
```

`derive` imports `checkExhibit` and runs it with `mode: 'section'` on each
PR's `## Exhibit` to decide `ready`.

```js
// skills/exhibit/scripts/attach.mjs
/** Commits files under <goalSlug>/ on onus-exhibits and pushes; one URL per file. Throws with the reason on refusal. */
export async function attach(goalSlug, files, { public: isPublic }) {}   // returns {file, url}[]
```

Command lines, which `docket` and the skill call:

```sh
bun skills/exhibit/scripts/progress.mjs --repo <o>/<r> --goal <slug> --issues 31,32,33 \
  [--progress-issue 70] --run .runs/exhibits/<run>.inputs.json [--body | --json]
#   <run>.inputs.json: {"grant": false, "take": [{"issue": 31, "since": "..."}], "reviewIds": [123]}
#   omitted --run: grant false, take null, reviewIds null
bun skills/exhibit/scripts/check-exhibit.mjs [--section] <file.md>
#   prints `exhibit ok` and exits 0, or one `<line>: <rule>: <message>` per problem and exits 1
bun skills/exhibit/scripts/attach.mjs [--public] <goal-slug> <file>...
#   --public: the repository is public (traces refused); attach.mjs also checks
#   the remote's visibility with `gh api repos/<o>/<r>` and refuses if they differ
#   prints `<file>\t<url>` per file; exits 1 with the reason on a refusal
```

## Examples of use

```text
/docket M1 of docs/plans/visible-progress
  start    goal=M1  progress issue #70 (pinned)
  take     #64 agent-identity ... take #65 exhibit-scaffold
  ...
  exhibit  three units finished unshown → #70 comment
           🟢 On track · 1 decision needs you · 7/8 done · updated 2026-12-03 18:02
           Needs you: merge #71 (exhibit-skill, protected)? pick: yes · risk: low,
             wording only; evidence: review at <sha> AC1–AC3 met (kind not judged)
  ...
  exhibit  milestone M1 done → #70 comment (after the owner merged #71)
           🟢 On track · 0 decisions need you · 8/8 done · updated 2026-12-04 09:15
```

```text
/exhibit PR 52
  ## Show
  - Saving a draft stores it: `GET /api/drafts/9` returns the draft (run 2026-12-03-1412) ·
    screenshot draft-saved.png
  ## Not shown
  - The retry backoff (internal); its test `drafts.retry.test.ts` passes.
```

## Contract (one-way doors)

- The skill `exhibit`, its headings, and `check-exhibit.mjs`'s rules.
- The evidence table (section 4).
- The bottom-line format; the derived states and health rules.
- `Progress: <goal>`, `onus:exhibit`, branch `onus-exhibits`.
- `docket` phases `exhibit` and `take` (and `answer-session` in Measured);
  PR heading `## Exhibit` (M1); criterion numbering `AC<k>` in
  `cross-examine` step 7.
- From M2: `demos/`, harness command `demo`, record line `Exhibit:`.
- From M3: `demos/approved/` as a protected path.

## Risks

- **Images do not render** from a private repository's branch: Mermaid and
  text.
- **The owner never picks an agent identity**: the exhibit stays a page to
  open, and the owner-reaction counts stay empty.
- **Main evidence is hard to get** for some UI-only changes (a layout): the
  table allows a screenshot as main evidence only for a change whose whole
  claim is its look, and then it says so; M3's accepted outputs are where
  such changes get a check.
- **Concurrent pushes to `onus-exhibits`** from several workers can be
  refused as non-fast-forward: `attach.mjs` fetches and retries once, and
  its test covers it.
- **A project with no CI** has no check runs, so a pushed fix is not a
  finished unit there and long fix rounds may read as stalls; the exhibit
  says the project has no CI.
- **`AC<k>` is a position** in an editable issue body: editing the list
  renumbers criteria. `cross-examine` quotes the criterion with its number,
  so a mismatch shows.
- **A dead run's last body stands**; its time stamp shows its age, and a
  body older than the stall period says `stale` when read by any run.
- **The track record is small** for weeks (Measured): counts, never
  percentages.
- **Numbering criteria changes `cross-examine` output** that adopting
  projects may read; the PR says so, per `AGENTS.md` ("say in the PR what an
  adopting project will notice").
- **Public repositories ask before the progress issue but not before PR
  sections and review comments**, which the method already posts; the
  progress issue is the one new standing place, so it is the one asked
  about. A pickup asks again: the answer, like a grant, does not carry over.
- **Demos cost CI time** (M2): one user path each; run only the demos a PR
  touches if it grows, and say so.
- **`[skip ci]` covers push and pull-request events only**: an adopting
  project with workflows on `create` or `workflow_run` may still start
  them when `onus-exhibits` is first pushed; `exhibit-images` lists the
  project's workflow triggers in its PR.
- **Branch rules with wildcards** may refuse the push to `onus-exhibits`:
  then pictures stay local and the exhibit says so.
- **Watchers of a private repository** are notified of every exhibit; the
  triggers in section 7 keep the count to stage boundaries.
- **The probe needs a private scratch repository**, which the owner
  provides (creating one is an account action the agent does not take).
- **The orphan branch grows every clone**: one folder per goal; the final
  report names folders to delete; a default clone of a single branch is
  unaffected.

## Signs this shape is wrong

- The owner still asks "where are we" during runs.
- Time to decision does not fall from one goal to the next (Measured).
- The owner answers few exhibits (the owner's own count until Measured).
- Witnesses often reject demos as not proving their criterion (M2).
- `Promised vs shown` is mostly "not shown".
- Initial values to tune: 6 hours for a stall, 300 words, three unshown
  units, twice back uphill, two failed demo runs, 30 graph nodes.

## Sources

Cursor changelog 2026-02-24 and forum; Devin docs and "Devin's Slack
Etiquette"; GitHub changelog 2025-07-02; Replit docs, App Testing; OpenAI,
"Introducing Codex"; pstack (`ketchup`, `babysit`, `show-me-your-work`,
`principle-explain-the-number`, `autopilot-full`); arXiv 2610.34748,
2609.24234, 2602.11865; Anthropic, "Effective harnesses for long-running
agents" and "Harness design for long-running application development";
Linear docs; BLUF (AR 25-50); Scrum.org; Shape Up ch. 13; Amazon, Working
Backwards; Chromatic docs; ApprovalTests; charmbracelet/vhs; Playwright
trace viewer.

## Still owed

- The owner labels the M1 issues the agent may do. `agent-identity` is the
  owner's decision; `exhibit-scaffold` touches `package.json`, `.github/`
  and `AGENTS.md`, and `exhibit-skill` touches `.claude-plugin/` and
  `AGENTS.md`, so both PRs are the owner's to merge. `exhibit-images` needs
  a private scratch repository from the owner.
