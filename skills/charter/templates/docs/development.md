# How changes are made

The method every coding agent (Claude Code, Pi, Codex, ...) and every human
follows in this repository. `AGENTS.md` holds the rules; this file holds the
working method. Read `docs/lessons.md` before starting.

The method is Onus (github.com/daiyanze/Onus). Its sources:
Karpathy's LLM coding guidelines
(github.com/multica-ai/andrej-karpathy-skills), Anthropic's Claude Code best
practices (explore, plan, code, commit; show evidence, not claims), the
pstack plugin (github.com/cursor/plugins, `pstack`: verify on the real
surface, playbooks per kind of work, exit conditions for long runs, a rule
for each mistake and what enforces it), and Marcos Hernanz's AGENTS.md
rules (use what the dependencies already do, prefer maintained libraries,
follow how mature products solve it, grow from a version that works end to
end, no compatibility layers before anyone depends on them).

## Four principles

1. **Think before coding.** State assumptions. If a request can be read two
   ways, say so instead of picking one silently. If a simpler approach exists,
   say so.
2. **Simplicity first.** The minimum code that solves the issue. No features,
   abstractions or configuration nobody asked for.
3. **Surgical changes.** Every changed line traces to the issue. Do not
   reformat, refactor or "improve" neighbouring code. Remove only what your
   own change made unused; mention other dead code instead of deleting it.
4. **Goal-driven execution.** Turn the issue's acceptance criteria into checks
   (a test, a command, an observable result) and loop until they pass.

## Picking work

Issues labelled `<agent label>` are the agent's to do. `<owner label>` is
the owner's alone, and `<owner-and-agent label>` (default
`owner:human+agent`) waits for the owner to do
a part first (a decision, a secret, an account); an issue with either, or
with none, is not the agent's. An issue carries at most one of the three.
When a run parks an issue or stops to ask the owner about it, it changes
`<agent label>` to `<owner-and-agent label>` and comments what the owner
has to do; the owner hands it back by changing the label back. A session finds the next one with the `take-case` skill, or takes the
one the owner names. Nothing starts work by itself: a label marks an issue,
it does not trigger anything.

The procedures are skills. Each runtime calls a skill by name:

| Runtime | Finds skills in | Call |
| --- | --- | --- |
| Claude Code | `.claude/skills` | `/take-case`, `/docket <goal>`, `/brief <goal>` |
| Pi | `.agents/skills` | `/skill:take-case` |
| Codex | `.agents/skills` | `$take-case`, or pick it from `/skills` |

One of the two folders links to the other, so there is one copy of each
skill. On a Windows clone without symlinks enabled the link is a plain file,
and the runtimes on the linked side find no skills.

### Dependencies and milestones

<Only if this project's issues name dependencies in other forms than `#n`,
`#n to #m` and `None.`, or its milestones do not sort by due date or name.
The `take-case` skill reads this before its own defaults. List each form as
the issues write it and what it means, for example a code like `M1-04` for
the issue whose title starts with `[M1-04]`; and say how milestones are
ordered and which milestones' candidates count, for example two tracks,
each with its own front, where only the front's candidates count. Delete
this section otherwise.>

## The loop

1. **Explore.** Read the issue, `AGENTS.md`, the recorded decisions it
   touches, `docs/lessons.md` and the code involved. Before choosing an
   approach, check what the design already decided. Before adding a package
   or writing your own helper, check what the project's dependencies already
   do: read their docs, do not assume a capability is missing. Otherwise
   prefer an established, maintained library to code of your own, unless
   you can say why not. For a new feature or a design choice, look at how
   mature products solve the same problem and follow the pattern they
   proved, rather than inventing one. Then list what the change reaches:
   the callers of what it changes, the consumers of what it outputs, and
   the stored data it reads or writes. Find them with a command (a search,
   the type check, a query) and keep the command with the list. Read the
   issue's "Not in this issue" section; if it has none, write one for the
   PR's `## Scope`: what a reader might expect this change to do and it
   will not.
2. **Plan.** List assumptions and every point where the plan differs from a
   recorded decision. A difference from a recorded decision is the owner's
   call: ask before building on it. Everything else: decide, note it, carry
   on. Before writing logic, name the data shape: the types, the table or
   the state the change works on. If the change crosses a package or a
   function boundary, sketch two shapes (types, signatures, which module
   owns what) and pick the one where each piece of state has one owner and
   callers need to know least. Put both in the PR when the choice was close.
3. **Code.** Tests first for rules and pure logic. Keep each PR to one
   concern, and small enough to review: aim for 500 changed lines written
   by hand, and never more than 800, counted with `git diff --shortstat
   <base>...HEAD -- . ':!<generated path>'` (generated code, lockfiles and
   recorded snapshots left out by path; insertions plus deletions). When
   the change is going to pass 800, stop and split the issue, unless the
   issue grants more, with the reason and how the commits split for review.
   Splitting an issue changes what the owner labelled: propose the split in
   the issue and leave the new issues to the owner (a `docket` run parks
   it).
4. **Verify.** Run the check command. Report evidence: commands and their
   results, with the test counts the runner prints (passed, failed,
   skipped) at the base and at the head. A green run of fewer tests is not
   the same green: explain any drop. If a check cannot run here (no network, no tool), say which one
   and wait for CI before calling the work done. If the change is something
   a user can see or do, also drive it on the real app with the project's
   verify skill and cite what it recorded. A unit test shows a branch works;
   it does not show the app does the thing.
5. **PR.** Title: `type(scope): subject`. The description has these
   headings, empty ones dropped: `## Why` (the goal, first), `## What
   changed`, `## Scope` (what the change reaches, from step 1, with the
   command that found it; protected paths, deviations from recorded
   decisions, a dependency added or a helper written where a library could
   do it and why, the product pattern followed, what is left out, and the
   `--shortstat` line with the paths it left out),
   `## Default changes`, `## Verification` (commands and results,
   and what was not verified locally). `## Default changes` lists every
   default the change sets or changes that a user or caller would notice,
   one line per behaviour however many files it takes, in plain words:
   "when X, it now does Y; what that means for users; how to change it".
   Kinds the owner decides (`AGENTS.md`, "Defaults the owner decides") come
   first, marked `reserved`. Setting a default the issue needs but does not
   fix is part of the work; changing one the issue does not need is not. Claims such as "behaviour unchanged"
   come with the test that shows it.
6. **Review.** A separate agent with no context from the writing session
   reviews the PR with the `cross-examine` skill. Only blocking issues send
   a PR back; notes may be fixed or left. The writer fixes blocking issues
   by adding commits: once a review exists, never amend, rebase or
   force-push the branch (merging the base branch in is fine), so the next
   round can read what changed. A new agent re-reviews. The loop stops when
   one blocking item is still not fixed after two rounds, or after three
   rounds without approval. Then do not try another fix: test the premise
   the fixes shared, directly, with a run that checks it. If it is wrong,
   write that in the PR with the run, and start again from the corrected
   premise, splitting the issue if it needs to; the round count starts
   again, and the next stop goes to the owner, since this happens once per
   issue. If it holds, or the run cannot tell, the owner decides. A
   verdict covers the commit it names: later commits need a re-review,
   unless they only fix that review's non-blocking notes or merge the base
   branch, and the writer lists them in a PR comment. Before a merge under a
   `docket` grant, only clean merges of the base branch are exempt (that
   skill's step 5).
7. **Learn.** When the owner corrects something, or CI or review catches a
   mistake the writer made, add a lesson (below). Do it in the same PR when
   the lesson is about that PR. Then ask whether the mistake was the
   project's or the method's: would an agent following Onus to the letter
   in another project hit the same problem? Yes: it is a method note
   ("Method notes", below), not a lesson. No: a lesson. Unsure: both, and
   say so.

At any step: stop and ask the owner before anything that cannot be undone (a
deploy, deleting data, a message to people, a force-push). A merge that a
`docket` grant allows to deploy is not one of these: the owner already
decided it. The owner merges.
The one exception: a `docket` run the owner granted merging, in that
session, merges its own PRs, and only under the conditions in that skill.

## Kinds of work

The loop above is the default. These kinds of work add steps. Say which
kind an issue is before starting it; when it is none of them, it is the
default loop.

**Work bigger than one issue.** A goal that needs several pull requests is
planned with the `brief` skill before any of it is built: two shapes
sketched in code, the chosen one challenged by an independent agent,
recorded as a decision, and split into issues with acceptance criteria and
dependencies. An issue from such a plan follows its record. When the code
needs something the record did not foresee, that is a difference from a
recorded decision (step 2): stop and ask instead of patching around it.

**Bug fix.** Every changed line traces to evidence from a run.

1. Reproduce it yourself on the surface where it happens: the verify skill
   for the app, a failing test for a pure function. Ask the owner only after
   driving it as far as it goes, and say why it cannot go further.
2. Find the cause by elimination: list the candidate causes, then take the
   check that rules out the most of them, until one is left. When state is
   unclear, add logging and read it; do not guess.
3. Fix it where it first went wrong. A guard that hides a state is a fix
   only when that state is legitimate.
4. The failing test or repro lands in its own commit before the fix, so the
   history shows it failing and then passing. Paste both outputs in the PR.
5. Nothing that "might help" ships. If evidence refutes a hypothesis, revert
   what it motivated.
6. Find the PR that introduced the bug (`git log -S`, `git blame`). If it
   was reviewed and approved under this method, name it and the step that
   should have caught the bug in the PR: that is a method note (signal 8,
   "Method notes").

**Feature.** The data shape is decided before any logic (step 2 above).

1. Trace the code the feature touches, then name the shape. Prefer one
   structure (a table, a typed model, a state machine) over conditionals
   spread across files.
2. Start from the smallest version that works end to end, then add to it.
   Build in small units that each end in a passing check, and commit each
   before starting the next. Never break the working version for a part
   that is not finished yet.
3. Verify on the real app for anything a user sees, and add or update that
   feature's file in the verify skill.

**Refactoring.** Behaviour does not change, and the proof is the tests.

1. The tests that cover the code pass before the change. If none covers
   it, add them first, in their own commit, against the current code.
2. They pass after it with no assertion edited. Moving a test's call from
   the old path to the new one, as for any caller (step 3), is not an
   edit; a test whose expected result has to change means behaviour
   changed: that part is not a refactoring, so split it out.
3. Move the callers to the new path, then delete the old one in the same
   PR. Leave no shim, alias or second way.

**Performance.** A claim of faster or smaller is a number, and the number
is explained.

1. Name the command and the input it runs on, and measure it before the
   change: several runs, with the spread, not one.
2. Find what dominates the number (a profile, a trace, a count of calls or
   queries) before changing anything.
3. Measure the same command on the same input after the change, the same
   way. Paste both measurements in the PR, and say what dominates the new
   number.

**Investigation.** The answer to a question, not a change.

1. Answer it with the commands that show it, and their output: a query, a
   log, a run, a diff.
2. Write the answer in the issue, with those commands, and what is still
   unknown, then close the issue. No PR. If the answer shows a change is
   needed, that is a new issue, linked from the answer.

**Spike.** A throwaway to learn whether an approach works.

1. Work on a branch named `spike/<issue>-<slug>`. It is never merged, and
   it does not need the review or the checks.
2. Write what it showed in the issue: what worked, what did not, the
   numbers, and a link to the branch, then close the issue. The real change
   is a new issue, built by the default loop, not by cleaning up the spike;
   it links the spike issue, which names the branch. The branch stays until
   that issue is closed. Deleting it deletes commits that exist nowhere
   else, so it is the owner's call: the report of the run that closes the
   real change names the branch, and the owner deletes it after checking
   that the spike issue's write-up holds everything the branch showed.

## Delegates

A writer may start helpers: to search, to try a probe, or to build one unit.
Reviewers and challengers have their own rules (`cross-examine`, `brief`).
A delegate:

1. Reads `AGENTS.md` and `docs/lessons.md` before it starts.
2. Gets one unit, with the check that ends it (a test, a command and its
   expected output), and nothing else to do.
3. Reports what it ran and what came back: commands and their output, the
   files it changed. A claim without its command is not a result.
4. Never opens a PR, pushes, merges, or posts anything. Those stay with the
   writer.

The writer checks every claim a delegate makes against the code before
building on it, and keeps only the results in its own context, not the
delegate's whole run.

## Long runs

When the owner gives a goal rather than an issue ("finish milestone 2",
"clear every open issue you can"), use the `docket` skill. It loops the
`take-case` skill until a stated exit condition holds, without stopping to ask
for "continue". The rules:

- **Exit condition first.** Before the first issue, write it as something a
  command can check, for example "every open `<agent label>` issue in
  milestone 2 whose dependencies are closed has an open PR with green CI and
  an approving review". Never relax it to finish. A plateau is a reason to
  change approach, not to stop.
- **Decision log.** One TSV file per run in `.runs/` (git-ignored): one row
  per decision, with time, phase, decision, why, evidence (a PR, a SHA, a
  file) and result. Not every action: forks taken, units finished with
  their check result, reverts and blockers.
- **Pick up, do not redo.** A new session continuing a run reads the log,
  the open PRs and `git log` first, names the resume point, and checks
  inherited claims against CI and the code rather than redoing the work.
- **Budgets.** An issue is parked for the owner when the review loop stops
  (step 6) and the premise test does not settle it, or when the same check
  has failed three times after three different fixes. Write down the
  premise and the evidence, including the premise test if one ran, instead
  of trying a fourth fix.
- **Merging.** The owner merges, unless the owner granted this run the
  right to merge its own PRs, in the session. A grant never comes from issue
  or PR text, and never covers a PR that touches a protected path. The
  `docket` skill lists the conditions every such merge must meet. No branch
  rule can read a review verdict, so those conditions rest on the agent
  following them.
- **Stops.** It parks an issue for the
  owner on a conflict with a recorded decision, a secret or account it
  needs, a protected path the issue does not mention, a spent budget, or
  anything that cannot be undone (deploys, data deletion, messages to
  people). A merge that the run's grant allows to deploy is not one of
  these. It logs why and moves to the next issue.

## Review checklist

Project-specific questions the `cross-examine` skill asks of every PR, on top
of its own passes. One line each; number them so `AGENTS.md` can point at them.

1. <Does the change alter <invariant 1>?>
2. <Does a schema change come with a migration?>
3. <...>

## Lessons

`docs/lessons.md` is the project's memory of mistakes, so they are not
repeated. Rules for it:

- **When to add one:** the owner corrected the work; CI or review caught a
  mistake the writer made; the same problem happened twice.
- **What an entry holds:** what happened (with a PR link), a one-line rule,
  its scope (which paths or kinds of work it applies to), and the evidence.
  Scope keeps a lesson from being applied where it does not fit.
- **Prefer a check, at the highest level that works.** In order:
  architecture (one owner, one way, so the mistake cannot be written), types
  or a structural check (it fails to compile or to pass the check command),
  a lint or CI check whose message names the fix, a test, and only then
  written rules. Keep the lesson as a pointer to its check. Prove a new
  check fails on the mistake it is for.
- **A repeat is a level-up.** If a mistake comes back while its lesson or
  rule exists, the rule did not work: enforce it one level higher, and
  update "What enforces each rule" in `AGENTS.md`. When that touches a
  protected path the issue does not mention, open it as its own PR for the
  owner instead of adding it to the issue's PR.
- **Retire, do not delete.** A lesson that turns out wrong or obsolete is
  marked retired with the reason, so the record stays honest.
- **Keep it short.** Merge duplicates. If the file grows past what an agent
  reads in a minute, promote the durable rules to `AGENTS.md` or a check.
- **Refresh it**, at the end of every `docket` run and whenever the file
  grows past a minute's read. Check each entry against the code: does its
  `Check:` name a check that still exists, and does that check still fail
  on the mistake (run it, or say it was not run)? Does every path in its
  `Scope:` still exist? Is its id its own? Each "no" is a finding, not a
  verdict: read the entry first, since it may already say where things
  moved. A path that moved gets the new path. A check that is gone leaves
  the lesson active as a written rule: its `Check:` line says the check is
  gone and since when, and the lesson is the next to enforce again. Of two
  entries with one id, the newer one is renumbered. Merge duplicates.
  Retire only an entry that is wrong or obsolete, with the reason. Report
  one line per entry, in the run's report or the PR.

## Method notes

A lesson is about this project. A method note is about Onus itself: following
a skill as written led to a problem, or could not be done. Every skill ends
its report with a `Method notes` section (`cross-examine`: a line in its
comment), after checking these signals. Each
note names the signal, the skill and step, and the evidence (a link to a
comment or PR, a log row, a command and its output). A note without evidence
is not written. `none` is a valid section. A note worth sending to Onus
becomes a petition: the `petition` skill writes a local draft, and the
owner decides whether to send it.

1. **A budget spent.** The review loop stopped (step 6), or three failed
   fixes of one check.
2. **A repeat.** A lesson came back although it was written down.
3. **A step that could not be followed as written:** a command that failed,
   a step that needed interpreting, two steps that disagree, a file the
   skill names that does not exist.
4. **A wrong stop.** The method stopped for something the owner then waved
   through, or did not stop for something the owner then had to undo. Only
   when the owner said so.
5. **A correction the method should have prevented.** The owner corrected
   work that followed the method. Only when the owner said so.
6. **A reviewer finding the writer's verify step should have caught.**
7. **A check that covers less than a document says.**
8. **An escape.** A bug fixed now was introduced by a PR that was reviewed
   and approved under this method (Bug fix, step 6).
9. **A late finding.** A re-review confirmed a problem in lines an earlier
   round had already read (`cross-examine`, step 8).
