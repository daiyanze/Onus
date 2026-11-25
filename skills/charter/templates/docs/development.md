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

Issues labelled `<agent label>` are the agent's to do; any other issue needs
the owner. A session finds the next one with the `take-case` skill, or takes the
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
   proved, rather than inventing one.
2. **Plan.** List assumptions and every point where the plan differs from a
   recorded decision. A difference from a recorded decision is the owner's
   call: ask before building on it. Everything else: decide, note it, carry
   on. Before writing logic, name the data shape: the types, the table or
   the state the change works on. If the change crosses a package or a
   function boundary, sketch two shapes (types, signatures, which module
   owns what) and pick the one where each piece of state has one owner and
   callers need to know least. Put both in the PR when the choice was close.
3. **Code.** Tests first for rules and pure logic. Keep each PR to one
   concern.
4. **Verify.** Run the check command. Report evidence: commands and their
   results. If a check cannot run here (no network, no tool), say which one
   and wait for CI before calling the work done. If the change is something
   a user can see or do, also drive it on the real app with the project's
   verify skill and cite what it recorded. A unit test shows a branch works;
   it does not show the app does the thing.
5. **PR.** Title: `type(scope): subject`. The description has these
   headings, empty ones dropped: `## Why` (the goal, first), `## What
   changed`, `## Scope` (protected paths, deviations from recorded
   decisions, a dependency added or a helper written where a library could
   do it and why, the product pattern followed, what is left out),
   `## Verification` (commands and results,
   and what was not verified locally). Claims such as "behaviour unchanged"
   come with the test that shows it.
6. **Review.** A separate agent with no context from the writing session
   reviews the PR with the `cross-examine` skill. The writer fixes blocking
   issues; a new agent re-reviews. After three rounds the owner decides. A
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

The loop above is the default. Three kinds of work add steps.

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
- **Budgets.** An issue is parked for the owner after three review rounds
  without approval, or when the same check has failed three times after
  three different fixes. Then the premise is probably wrong: write it down
  with the evidence instead of trying a fourth fix.
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
is not written. `none` is a valid section.

1. **A budget spent.** Three review rounds without approval, or three failed
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
