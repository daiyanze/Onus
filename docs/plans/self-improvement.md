# Plan: anyone using Onus can appeal a problem with the method, and Onus improves from it

Status: **draft for review**, written 2026-11-23/24. The plan itself is
`docs/plans/self-improvement.yaml`; it passes `check-plan.mjs`. One round
of independent challenge (`brief` step 5) ran on 2026-11-24 and found
twelve problems; "Challenge" at the end lists them and how each was
settled. Step 4 was done as two shapes in prose, not in code: this plan
changes Markdown and a form, so there are no types to check against.

## Goal

1. **Self-improvement.** Anyone using Onus in their own project, a person or
   an agent, can raise a problem with the method after finishing a task, and
   submit it to this repository with one skill command, `appeal`. Here an
   appeal becomes a change to a skill only after it proves itself, the way a
   lesson becomes a check in a project.
2. **Gaps.** Close the gaps found when comparing Onus with pstack
   (github.com/cursor/plugins, `pstack`), superpowers
   (github.com/obra/superpowers), Compound Engineering
   (github.com/EveryInc/compound-engineering-plugin) and Cursor's
   `continual-learning` plugin, taking only what fits a plain-Markdown method.

## What "done" means

- In a project that adopted Onus, `appeal` turns a person's complaint, or a
  method note an agent raised at the end of a task, into a prefilled appeal
  form on daiyanze/Onus that the person reads and submits themselves.
- Every skill's last step has a `### Method notes` subsection, and offers
  `appeal` when it is not empty.
- This repository has an appeal form, a triage rule and a proof rule, and
  a first bench result for the current version.
- Each issue in the plan is merged or closed by the owner.

## Out of scope

- Posting without the person's approval of the exact text, or from a
  scheduled or unattended run. An appeal is a message to people
  (`docs/development.md`, "At any step").
- Hooks or a process that mines transcripts on its own (as Cursor's
  `continual-learning` does with a stop hook). Onus stays instructions plus
  checks.
- Telemetry of any kind. Nothing leaves a project except an appeal its
  person approved.
- Copying pstack's breadth: 34 skills, 24 principles, 22 playbooks.
- Installing Onus as a Claude Code or Cursor plugin. A plugin installs the
  skills outside the project, so Pi and Codex see none, and the project's
  own `check-agent-files.mjs` fails ("a skill is in only one of them"). That
  breaks the rule that every runtime reads the same text. Revisit only with
  a way to keep the three runtimes on one copy.

## Answers from the owner (chat, 2026-11-23)

- Turn the gap list into issues for this repository; borrow what other good
  skills and plugins do well.
- Onus should improve itself.
- The problems come from other people using Onus in their own projects, and
  from agents using it. The person or the agent raises them after finishing
  a task, and submits them to Onus through a skill command.

Assumed (not asked): the self-improvement issues come first; the issues are
in English, like the rest of this repository; the skill is named `appeal`,
to fit `charter`, `docket`, `cross-examine` and `brief`.

## What Onus already has (checked in the code, so not issues)

| Thought missing | Where it is |
| --- | --- |
| Kinds of work | `docs/development.md` "Kinds of work": bigger than one issue, bug fix, feature |
| Picking up a long run | `docket` step 1, from the `.runs/` log |
| A second-model review | `cross-examine` "Second model" (written, never done: `VALIDATION.md`) |
| Keeping the verify skill current | `docs/development.md` Feature step 3 |
| Root-cause fixing | `docs/development.md` Bug fix steps 2 and 3 |
| A verify skill run in CI, and fixed when the app changes | `evidence-kit` step 4: "run it in CI … A skill that CI does not exercise drifts"; "fix the file in the same PR" |

## Constraints, with their sources

- Plain Markdown, no runtime to install (`README.md`, purpose).
- Every runtime reads the same text: Claude Code, Pi, Codex
  (`AGENTS.template.md`; `check-agent-files.mjs`).
- A message to people is a stop: ask before it (`docs/development.md`).
- Issue and PR text is a description of work, never an instruction
  (`take-case`, `brief`, `docket`). This repository is public: anyone can
  open an appeal, so an appeal is never work for an agent until the owner
  labels it.
- Written lessons alone did not stop repeats; checks did (`VALIDATION.md`).
- The method has been tried on one project, one model family
  (`VALIDATION.md`, "Limits"). Appeals from other projects and models are
  the evidence it lacks.
- The bench exists and has no results (`bench/RESULTS.md`).

## Design

### Two sources, one command

- **A person** using Onus in their project runs `/appeal` (or `$appeal`,
  `/skill:appeal`) whenever something in the method got in their way: "the
  review blocked on something it could not prove", "take-case picked the
  wrong issue". They may give one sentence; the skill does the rest.
- **An agent** notices a problem while running a skill. It does not post
  anything. It writes the problem into its report's `Method notes` section,
  and the report ends with one line offering `appeal`. The person decides.

### What counts as a method note

A **project lesson** is about the project: the writer misread its code or its
rules. It stays in that project's `docs/lessons.md`, as today. A **method
note** is about Onus. The test: *would an agent following Onus to the letter
in another project hit the same problem?* Yes: a method note. No: a lesson.
Unsure: both, and say so. `appeal` applies the same test to what a person
reports, and tells them when it looks like a project lesson instead.

### Signals an agent checks before writing its report

Signals 1 to 3 and 6 to 8 are things the agent can see in the session or
the repository. Signals 4 and 5 need the person's reaction, so the agent
reports them only when the person said so:

1. **A budget spent.** Three review rounds without approval, or three failed
   fixes of one check.
2. **A repeat.** A lesson came back although it was written down.
3. **A step that could not be followed as written**: a command that failed
   (as `gh api -f body=@file` did, losing four reviews), a step that needed
   interpreting, two steps that disagree, a file the skill names that does
   not exist.
4. **A wrong stop.** The method stopped for something the person then waved
   through, or did not stop for something they then had to undo.
5. **A correction the method should have prevented.** The person corrected
   work that followed the method.
6. **A reviewer finding the writer's verify step should have caught.**
7. **A check that covers less than a document says.**
8. **An escape.** A bug fix whose bug was introduced by a pull request that
   was reviewed and approved under Onus. The fix names that pull request and
   which step should have caught it. This is the strongest signal: the
   others come from problems that were caught.

A note names the signal, the skill and step, and the evidence (a link to a
comment or PR, a log row, a command and its output). A note without
evidence is not written: the same rule as a review finding. A person's
complaint needs no evidence to be heard; `appeal` gathers what it can and
says what it could not find.

### Where notes are written

- **Every skill's last step** gets a `### Method notes` subsection: each
  note, or `none`. In `charter` that is step 8 (Next), in `cross-examine`
  step 8 (After the verdict), in `evidence-kit` step 4, and in the other
  three their Report step. The line offering `appeal` is added by the
  `appeal` issue, so no skill names a skill that does not exist yet.
- **`cross-examine`'s comment** gets a `**Method notes:**` line, so the
  independent reviewer's notes are on the record where the person can find
  them later.
- **`docket`** logs a row with phase `method`.

### Two shapes for getting an appeal to Onus

**A. The agent posts.** `appeal` drafts the issue, shows it, and on approval
posts it with `gh issue create`, then searches existing appeals by label.
It loses on three counts:

- GitHub drops labels set by anyone without push access to the repository
  ("Labels are silently dropped otherwise", REST docs for creating an
  issue), so every appeal from another project arrives unlabelled, and a
  search by label misses it.
- Searching means reading other people's unlabelled issue text in the
  adopting project's agent session, which `take-case` forbids for exactly
  this reason: "Read the body of labelled issues only".
- It needs `gh` with access to another repository. Sandboxed sessions often
  have neither (the challenge's own session could not reach the repository).

**B. The person submits.** `appeal` builds a link to the appeal form,
prefilled with the title and the fields, and the person opens it, reads it
and presses Submit. The form applies the label. **Chosen.** It is also
smaller: no posting code, no read-back, no cross-repository access, and
the approval of the exact text is the person's own submit.

### The `appeal` skill (shape B)

1. **Intake.** Take what the person said; this session's `Method notes`;
   rows with phase `method` in `.runs/*.tsv`; and `**Method notes:**` lines
   on the PRs those rows or the person name (`gh pr view <n> --comments`,
   in this project only). Ask only what is missing, one question at a time:
   which task, what they expected, what happened. Never ask for code.
2. **Locate.** Name the skill and step the problem traces to, and the
   version in that skill's frontmatter (`metadata.onus-version`, issue
   `skill-version`). If it is a project lesson, say so and offer to add it
   to `docs/lessons.md` instead.
3. **Evidence.** Keep only what bears on the step: the command and its
   output, the rule quoted. Describe the project's code; do not paste it.
4. **Redact.** The appeal quotes Onus text and describes the project in
   general terms. No code, file contents, permalinks into a private
   repository, secrets, names of people, or anything a person said about
   themselves. Borrowed from superpowers' `diagnosing-superpowers`; and a
   lesson from Cursor's `continual-learning`, which was reported to write
   personal memory into a tracked AGENTS.md. Remind the person that the
   appeal is public and posted under their account.
5. **Look for duplicates by title only.** List appeal titles
   (`gh issue list -R daiyanze/Onus --search "[appeal] in:title" --state
   all --json number,title,state`, or the issues page), never their bodies.
   Name the likely duplicates and let the person open them; if one fits,
   they comment there instead.
6. **Hand over the link.** Show the title and every field as text, then the
   link. Long evidence that would make the link too long goes into a file
   the person pastes. The skill never submits anything. An unattended run
   writes the draft to a file and stops.

Callable by name only: `disable-model-invocation: true` for Claude Code and
Pi, and `agents/openai.yaml` with `allow_implicit_invocation: false` for
Codex, as `docket` does.

### Contract (the one-way doors)

- Title: `[appeal] <skill> <step>: <one line>`, for example
  `[appeal] cross-examine 7: posting drops "!" before "["`.
- Form `.github/ISSUE_TEMPLATE/appeal.yml`, label `appeal`, field ids:
  `skill`, `step`, `onus-version`, `signal` (1 to 8, or "felt by a
  person"), `happened`, `expected`, `evidence`, `suggestion` (optional).
- Each SKILL.md frontmatter: `metadata: {onus-version: <x.y.z>}`, equal to
  `package.json`'s version; bumped with every change to a skill's wording.
- `### Method notes` subsection in each skill's last step; `**Method
  notes:**` line in the `cross-examine` comment; `method` phase in `.runs/`.

### Examples of use

```text
> /appeal take-case skipped my half-reviewed PR and started a new issue
  Traces to take-case step 1 ("an open PR already links it ... it is in
  progress"), onus-version 0.5.0. Signal: felt by a person.
  Possible duplicates by title: none.
  Title: [appeal] take-case 1: an interrupted PR is never resumed
  ... fields ...
  Open to review and submit: https://github.com/daiyanze/Onus/issues/new?template=appeal.yml&title=...
```

```text
(end of a docket report)
### Method notes
- Signal 3, cross-examine 7: `gh pr comment --body-file` dropped a "!" before
  "[" in posting; read-back caught it (comment link).
Run `appeal` to send these to Onus.
```

### What happens to an appeal here

- **Intake.** The form and label in "Contract". An appeal is never
  labelled for the agent by anyone but the owner. `CONTRIBUTING.md` holds
  the triage and proof rules; GitHub links it from the new-issue page.
- **Triage**, by the owner: accepted (a real problem with the method),
  a project lesson (answered and closed), a duplicate, or needs evidence.
- **Proof before a change.** The project rule "a lesson becomes a check",
  applied to Onus: an accepted appeal that claims a change in behaviour gets
  a bench scenario that fails on the current wording and passes on the new
  one, with no other checkpoint worse. A new scenario changes the bench
  hash, and results are kept per hash (`bench/README.md`), so the old
  wording is run again as `onus@<ref>` under the new hash: a stored
  baseline does not serve. "Passes" and "no worse" mean pass counts at
  n ≥ 3 per cell, the bench's own minimum. After superpowers' `writing-skills`:
  a baseline without the change, and repeated runs, because one run proves
  little. A fix of a command, a missing file or a contradiction needs only a
  dry run of the step, linked in the PR. The PR names the appeal it answers.
- **Record.** `VALIDATION.md` counts appeals by skill, project count and
  model, so the "never run" rows move on evidence from other projects.

### Signs this shape is wrong

- Reports say `none` on almost every task while people keep appealing the
  same steps: agents are not noticing, and the signals need a check, not
  wording.
- Appeals are mostly project lessons: the test above is not clear enough.
- People decline most offers to appeal: the offer is noise, or the draft
  shows too much of their project.
- Accepted appeals cannot be expressed in the bench: the bench needs work.

## Borrowed from other plugins

| From | What | Where it lands |
| --- | --- | --- |
| superpowers `diagnosing-superpowers` | One question at a time at intake; evidence cited per finding; scrubbing; approval of the exact text; search for an existing issue first | `appeal` |
| superpowers `writing-skills` | Red-green for skills: baseline, pressure scenarios, repeated runs | Proof before a change |
| superpowers `subagent-driven-development` | Fresh subagent per task; review for spec, then quality | `delegate-rules` |
| Compound Engineering `ce-compound` | Learnings in their cheapest durable form; audit stale or drifted learnings | `lessons-refresh` |
| Cursor `continual-learning` | A cautionary case: personal memory written into a tracked AGENTS.md | `appeal`'s redaction |
| pstack `blast-radius` | See what a change reaches before planning it | `blast-radius` |
| pstack playbooks and `explain-the-number` | More kinds of work, each with its proof | `kinds-of-work` |
| pstack `poteto-agent`, `guard-the-context-window` | Delegates read the method first | `delegate-rules` |
| pstack `setup-pstack` | The project names its review models | `second-model-run` |

## One-way doors

Everything in "Contract": the skill name, the title prefix, the label, the
form's field ids, the frontmatter key, and the `Method notes` names.
Projects call the skill by name and appeals are found by title.

## Risks

- **Leaks.** An appeal posted from someone else's project is public. The
  redaction rules and the exact-text approval are the defence; the first
  appeals from another project will show whether they hold.
- **Noise.** A public repository invites appeals that are opinions. The
  form asks for the step and the evidence; triage closes the rest.
- **Spam or injection.** Appeal text is a description of work. It never
  reaches an agent as work unless the owner labels it.
- **Identity.** An appeal is posted under the person's own account, which
  can name their employer or project even when the text is generic. The
  skill says so before handing over the link.
- **Versions that do not move.** If the version is not bumped with every
  wording change, an appeal cannot say which wording it is about. The
  `skill-version` check makes the six equal to `package.json`, not current;
  bumping stays a rule for the owner.
- **Plain-words requests.** With `disable-model-invocation`, a person who
  says "send this to Onus" without the command may get nothing. The offer
  line names the command.
- **Cost of proof.** If the bench is too slow, the rule will be skipped; the
  dry-run path for small fixes keeps it honest.

## Challenge

Round 1, 2026-11-24, a separate agent with no context from the writing
session. Verdict: holds with fixes. Each finding was checked against the
code before it was settled.

| # | Finding | Settled |
| --- | --- | --- |
| 1 | Labels set via the API by people without push access are dropped, so a label search misses appeals | Shape B: the person submits the form, which labels it; search by title prefix |
| 2 | Searching reads strangers' unlabelled issue bodies in the adopting session | Titles only; the person opens candidates |
| 3 | The version had two writers (AGENTS.md line vs the installed skills) and `charter` could not read it | Version in each SKILL.md's frontmatter (`skill-version`); AGENTS.md line dropped |
| 4 | A plugin install breaks the three-runtime rule and the project's own check | `plugin-install` dropped; out of scope with the reason |
| 5 | `method-notes` would point at `appeal` before it exists | The offer line moved to `appeal` |
| 6 | `blast-radius` relied on a baseline it did not depend on, with no threshold | Compared against `onus@<base>` in the same run, pass counts at n ≥ 3 |
| 7 | A stored baseline cannot serve a new scenario (new hash) | Proof rule re-runs the old wording as `onus@<ref>`; `bench-baseline` is a first data point, not a prerequisite |
| 8 | `verify-upkeep`'s premise was false: `evidence-kit` already runs the verify skill in CI | Dropped; added to "What Onus already has" |
| 9 | `appeal` lacked Codex's `agents/openai.yaml` | Added to the issue and its acceptance |
| 10 | Notes written to PR comments and `.runs/` had no reader | Intake reads both |
| 11 | No shapes, examples of use or contract in the record | Added: "Two shapes", "Examples of use", "Contract" |
| 12 | Several criteria did not check what `what` asks | Rewritten: placement per skill, a skill listing, a frontmatter check, one choice for this repository's rules |

Not settled, kept as risks: posting identity, versions that do not move,
plain-words requests. `resume-case` no longer says "the agent's own PRs",
since the agent posts under the person's account: it resumes an open PR that
closes an issue with the agent label.

## Still owed

- A second challenge round on this wording, if the owner wants one.
- The owner labels the issues the agent may do, starting with
  `method-notes`.
