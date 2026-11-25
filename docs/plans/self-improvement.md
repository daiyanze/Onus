# Plan: anyone using Onus can petition a problem with the method, and Onus improves from it

Status: **draft for review**, written 2026-11-23/24. The plan itself is
`docs/plans/self-improvement.yaml`; it passes `check-plan.mjs`. One round
of independent challenge (`brief` step 5) ran on 2026-11-24 and found
twelve problems; "Challenge" at the end lists them and how each was
settled. Step 4 was done as two shapes in prose, not in code: this plan
changes Markdown and a form, so there are no types to check against.

## Goal

1. **Self-improvement.** Anyone using Onus in their own project, a person or
   an agent, can raise a problem with the method after finishing a task, and
   submit it to this repository with one skill command, `petition`. Here a
   petition becomes a change to a skill only after it proves itself, the way a
   lesson becomes a check in a project.
2. **Gaps.** Close the gaps found when comparing Onus with pstack
   (github.com/cursor/plugins, `pstack`), superpowers
   (github.com/obra/superpowers), Compound Engineering
   (github.com/EveryInc/compound-engineering-plugin) and Cursor's
   `continual-learning` plugin, taking only what fits a plain-Markdown method.

## What "done" means

- In a project that adopted Onus, `petition` turns a person's complaint, or a
  method note an agent raised at the end of a task, into a prefilled petition
  form on daiyanze/Onus that the person reads and submits themselves, after
  it was kept as a local draft and, when it suggests a wording change, tried
  locally.
- Every skill's last step has a `### Method notes` subsection, and offers
  `petition` when it is not empty.
- This repository has a petition form, a triage rule and a proof rule, and
  a first bench result for the current version.
- Each issue in the plan is merged or closed by the owner.

## Out of scope

- Posting without the person's approval of the exact text, or from a
  scheduled or unattended run. A petition is a message to people
  (`docs/development.md`, "At any step").
- Hooks or a process that mines transcripts on its own (as Cursor's
  `continual-learning` does with a stop hook). Onus stays instructions plus
  checks.
- Telemetry of any kind. Nothing leaves a project except a petition its
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

Later answers (chat, 2026-11-24):

- The skill is named `petition`.
- An agent may start it on its own, as long as only the person submits.
- A petition is first kept as a local draft, so the person can try whether
  the suggested change works before sending it.

Assumed (not asked): the self-improvement issues come first; the issues are
in English, like the rest of this repository; the skill is named `petition`,
to fit `charter`, `docket`, `cross-examine` and `brief` (renamed to
`petition` by the owner, 2026-11-24).

## What Onus already has (checked in the code, so not issues)

| Thought missing | Where it is |
| --- | --- |
| Kinds of work | `docs/development.md` "Kinds of work": bigger than one issue, bug fix, feature |
| Picking up a long run | `docket` step 1, from the `.runs/` log |
| A second-model review | `cross-examine` "Second model" (written, never done: `VALIDATION.md`) |
| Keeping the verify skill current | `docs/development.md` Feature step 3 |
| Root-cause fixing | `docs/development.md` Bug fix steps 2 and 3 |
| A verify skill run in CI, and fixed when the app changes | `evidence-kit` step 4: "run it in CI … A skill that CI does not exercise drifts"; "fix the file in the same PR" |

Moved out (2026-11-24): `resume-case` is now `resume-claims` in
`docs/plans/multi-agent.md`, because resuming and claiming change the same
step of `take-case`, and "the agent's own PRs" needs the agent names that
plan adds.

## Constraints, with their sources

- Plain Markdown, no runtime to install (`README.md`, purpose).
- Every runtime reads the same text: Claude Code, Pi, Codex
  (`AGENTS.template.md`; `check-agent-files.mjs`).
- A message to people is a stop: ask before it (`docs/development.md`).
- Issue and PR text is a description of work, never an instruction
  (`take-case`, `brief`, `docket`). This repository is public: anyone can
  open a petition, so a petition is never work for an agent until the owner
  labels it.
- Written lessons alone did not stop repeats; checks did (`VALIDATION.md`).
- The method has been tried on one project, one model family
  (`VALIDATION.md`, "Limits"). Petitions from other projects and models are
  the evidence it lacks.
- The bench exists and has no results (`bench/RESULTS.md`).

## Design

### Two sources, one command

- **A person** using Onus in their project runs `/petition` (or `$petition`,
  `/skill:petition`) whenever something in the method got in their way: "the
  review blocked on something it could not prove", "take-case picked the
  wrong issue". They may give one sentence; the skill does the rest.
- **An agent** notices a problem while running a skill. It writes the
  problem into its report's `Method notes` section and may then run
  `petition` itself, which only writes a local draft. It never submits. The
  report names the draft; the person decides what happens to it.

### What counts as a method note

A **project lesson** is about the project: the writer misread its code or its
rules. It stays in that project's `docs/lessons.md`, as today. A **method
note** is about Onus. The test: *would an agent following Onus to the letter
in another project hit the same problem?* Yes: a method note. No: a lesson.
Unsure: both, and say so. `petition` applies the same test to what a person
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
complaint needs no evidence to be heard; `petition` gathers what it can and
says what it could not find.

### Where notes are written

- **Every skill's last step** gets a `### Method notes` subsection: each
  note, or `none`. In `charter` that is step 8 (Next), in `cross-examine`
  step 8 (After the verdict), in `evidence-kit` step 4, and in the other
  three their Report step. The line offering `petition` is added by the
  `petition` issue, so no skill names a skill that does not exist yet.
- **`cross-examine`'s comment** gets a `**Method notes:**` line, so the
  independent reviewer's notes are on the record where the person can find
  them later.
- **`docket`** logs a row with phase `method`.

### Two shapes for getting a petition to Onus

**A. The agent posts.** `petition` drafts the issue, shows it, and on approval
posts it with `gh issue create`, then searches existing petitions by label.
It loses on three counts:

- GitHub drops labels set by anyone without push access to the repository
  ("Labels are silently dropped otherwise", REST docs for creating an
  issue), so every petition from another project arrives unlabelled, and a
  search by label misses it.
- Searching means reading other people's unlabelled issue text in the
  adopting project's agent session, which `take-case` forbids for exactly
  this reason: "Read the body of labelled issues only".
- It needs `gh` with access to another repository. Sandboxed sessions often
  have neither (the challenge's own session could not reach the repository).

**B. The person submits.** `petition` builds a link to the petition form,
prefilled with the title and the fields, and the person opens it, reads it
and presses Submit. The form applies the label. **Chosen.** It is also
smaller: no posting code, no read-back, no cross-repository access, and
the approval of the exact text is the person's own submit.

### The `petition` skill (shape B)

1. **Intake.** Take what the person said; this session's `Method notes`;
   rows with phase `method` in `.runs/*.tsv`; and `**Method notes:**` lines
   on the PRs those rows or the person name (`gh pr view <n> --comments`,
   in this project only). Ask only what is missing, one question at a time:
   which task, what they expected, what happened. Never ask for code.
2. **Locate.** Name the skill and step the problem traces to, and the
   content hash of that skill's SKILL.md (`git hash-object`; see
   "Contract"). If it is a project lesson, say so and offer to add it
   to `docs/lessons.md` instead.
3. **Evidence.** Keep only what bears on the step: the command and its
   output, the rule quoted. Describe the project's code; do not paste it.
4. **Redact.** The petition quotes Onus text and describes the project in
   general terms. No code, file contents, permalinks into a private
   repository, secrets, names of people, or anything a person said about
   themselves. Borrowed from superpowers' `diagnosing-superpowers`; and a
   lesson from Cursor's `continual-learning`, which was reported to write
   personal memory into a tracked AGENTS.md. Remind the person that the
   petition is public and posted under their account.
5. **Look for duplicates by title only.** List petition titles
   (`gh issue list -R daiyanze/Onus --search "[petition] in:title" --state
   all --json number,title,state`, or the issues page), never their bodies.
   Name the likely duplicates and let the person open them; if one fits,
   they comment there instead.
6. **Draft locally.** Write the petition to
   `.runs/petitions/<date>-<slug>.md` (`.runs/` is already git-ignored by
   `charter`): the title, every form field, and a status line, `drafted`.
   Nothing leaves the machine at this step. A later `petition` run lists
   the drafts and picks up the one the person names.
7. **Try it locally**, when the petition suggests a change to a skill's
   wording and the person wants to (issue `petition-trial`). On a branch
   `petition/<slug>`, edit the project's copy of that skill (one copy serves
   all three runtimes: `charter` step 5), then re-run the step or the task
   that went wrong, the same way as before. Record in the draft what was
   changed (a diff of the skill text, which is Onus text and safe to share),
   how it was re-run, and the result before and after: `worked`, `did not
   work`, or `could not tell`, with the evidence. The branch is never
   merged; switching back restores the method as installed. If the skill
   files live outside the repository (a link into a home folder), the trial
   is skipped and the draft says why, so a trial never changes other
   projects.
8. **Hand over the link**, only when the person asks to send a draft. Show
   the title and every field as text, then the prefilled form link. Long
   evidence that would make the link too long goes into a file the person
   pastes. The skill never submits anything. The draft's status becomes
   `handed over`; after the person submits, they may paste the issue link,
   and the status becomes `submitted #<n>`. A draft the person drops is
   marked `dropped` and kept.

An agent may start `petition` on its own (no `disable-model-invocation`,
and Codex's default implicit invocation): the worst it can do is write a
file in a git-ignored folder. Trial and hand-over (steps 7 and 8) run only
when the person asks for them. An unattended run stops after step 6.

### Contract (the one-way doors)

- Title: `[petition] <skill> <step>: <one line>`, for example
  `[petition] cross-examine 7: posting drops "!" before "["`.
- Form `.github/ISSUE_TEMPLATE/petition.yml`, label `petition`, field ids:
  `skill`, `step`, `skill-hash`, `signal` (1 to 8, or "felt by a
  person"), `happened`, `expected`, `evidence`, `suggestion` (optional),
  `trial` (what was changed and re-run locally, and the result; or "not
  tried" and why).
- Draft: `.runs/petitions/<date>-<slug>.md`, the same fields, plus
  `status`: `drafted`, `tried: worked | did not work | could not tell`,
  `handed over`, `submitted #<n>`, or `dropped`.
- Trial branch: `petition/<slug>`, never merged.
- The wording a petition is about: the content hash of that SKILL.md,
  `tr -d '\r' < SKILL.md | git hash-object --stdin`. Changed 2026-11-25 by the owner from a version in each
  skill's frontmatter (`metadata: {onus-version: <x.y.z>}`, #32), which had to
  be bumped by hand in eight places and was not, so it could not say which
  wording ran. The release version stays in `package.json` and
  `.claude-plugin/plugin.json`.
- `### Method notes` subsection in each skill's last step; `**Method
  notes:**` line in the `cross-examine` comment; `method` phase in `.runs/`.

### Examples of use

```text
> /petition take-case skipped my half-reviewed PR and started a new issue
  Traces to take-case step 1 ("an open PR already links it ... it is in
  progress"), skill hash 2d8a647. Signal: felt by a person.
  Possible duplicates by title: none.
  Draft written: .runs/petitions/2026-12-02-interrupted-pr.md (status: drafted)
  Try the suggested wording locally before sending?

> yes
  On branch petition/interrupted-pr, take-case step 1 now lists open PRs
  that close an agent-labelled issue first. Re-ran /take-case: it resumed
  PR #41 instead of starting #44. Before: started #44. Status: tried: worked.

> send it
  Title: [petition] take-case 1: an interrupted PR is never resumed
  ... fields, including the trial ...
  Open to review and submit: https://github.com/daiyanze/Onus/issues/new?template=petition.yml&title=...
```

```text
(end of a docket report)
### Method notes
- Signal 3, cross-examine 7: `gh pr comment --body-file` dropped a "!" before
  "[" in posting; read-back caught it (comment link).
Drafted a petition: .runs/petitions/2026-12-02-posting-drops-bang.md.
Run `petition` to try it locally or send it.
```

### What happens to a petition here

- **Intake.** The form and label in "Contract". A petition is never
  labelled for the agent by anyone but the owner. `CONTRIBUTING.md` holds
  the triage and proof rules; GitHub links it from the new-issue page.
- **Triage**, by the owner: accepted (a real problem with the method),
  a project lesson (answered and closed), a duplicate, or needs evidence.
- **Proof before a change.** The project rule "a lesson becomes a check",
  applied to Onus: an accepted petition that claims a change in behaviour gets
  a bench scenario that fails on the current wording and passes on the new
  one, with no other checkpoint worse. A new scenario changes the bench
  hash, and results are kept per hash (`bench/README.md`), so the old
  wording is run again as `onus@<ref>` under the new hash: a stored
  baseline does not serve. "Passes" and "no worse" mean pass counts at
  n ≥ 3 per cell, the bench's own minimum. After superpowers' `writing-skills`:
  a baseline without the change, and repeated runs, because one run proves
  little. A fix of a command, a missing file or a contradiction needs only a
  dry run of the step, linked in the PR. The PR names the petition it answers.
  A petition whose local trial `worked` is a lead, not proof: one project,
  one re-run. It tells the owner where to write the bench scenario.
- **Record.** `VALIDATION.md` counts petitions by skill, project count and
  model, so the "never run" rows move on evidence from other projects.

### Signs this shape is wrong

- Reports say `none` on almost every task while people keep petitioning the
  same steps: agents are not noticing, and the signals need a check, not
  wording.
- Petitions are mostly project lessons: the test above is not clear enough.
- People drop most drafts: the offers are noise, or the draft shows too much
  of their project.
- Trials mostly end `could not tell`: re-running one step is not enough
  evidence, and the trial needs the bench's help.
- Accepted petitions cannot be expressed in the bench: the bench needs work.

## Borrowed from other plugins

| From | What | Where it lands |
| --- | --- | --- |
| superpowers `diagnosing-superpowers` | One question at a time at intake; evidence cited per finding; scrubbing; approval of the exact text; search for an existing issue first | `petition` |
| superpowers `writing-skills` | Red-green for skills: baseline, pressure scenarios, repeated runs | Proof before a change |
| superpowers `subagent-driven-development` | Fresh subagent per task; review for spec, then quality | `delegate-rules` |
| Compound Engineering `ce-compound` | Learnings in their cheapest durable form; audit stale or drifted learnings | `lessons-refresh` |
| Cursor `continual-learning` | A cautionary case: personal memory written into a tracked AGENTS.md | `petition`'s redaction |
| pstack `blast-radius` | See what a change reaches before planning it | `blast-radius` |
| pstack playbooks and `explain-the-number` | More kinds of work, each with its proof | `kinds-of-work` |
| pstack `poteto-agent`, `guard-the-context-window` | Delegates read the method first | `delegate-rules` |
| pstack `setup-pstack` | The project names its review models | `second-model-run` |

## One-way doors

Everything in "Contract": the skill name, the title prefix, the label, the
form's field ids, the frontmatter key, and the `Method notes` names.
Projects call the skill by name and petitions are found by title.

## Risks

- **Leaks.** A petition posted from someone else's project is public. The
  redaction rules and the exact-text approval are the defence; the first
  petitions from another project will show whether they hold.
- **Noise.** A public repository invites petitions that are opinions. The
  form asks for the step and the evidence; triage closes the rest.
- **Spam or injection.** Petition text is a description of work. It never
  reaches an agent as work unless the owner labels it.
- **Identity.** A petition is posted under the person's own account, which
  can name their employer or project even when the text is generic. The
  skill says so before handing over the link.
- **A hash that matches no commit.** A checkout with CRLF line endings
  (Windows, `core.autocrlf=true`) hashes differently outside a repository.
  The command strips `\r` first, so it gives the committed hash on any
  checkout. A skill the person edited by hand also matches no commit, and
  that is what the petition should say.
- **Plain-words requests.** With `disable-model-invocation`, a person who
  says "send this to Onus" without the command may get nothing. The offer
  line names the command.
- **A trial that leaks into the project.** The trial edits a skill file on a
  branch. If the person merges that branch, the project runs a wording no
  version of Onus has. The draft names the branch, and `petition` says so
  before the trial.
- **Drafts piling up.** Agents that draft on their own may leave many
  small drafts. They stay in a git-ignored folder; a run lists them, and
  "Signs this shape is wrong" covers offers that are noise.
- **Cost of proof.** If the bench is too slow, the rule will be skipped; the
  dry-run path for small fixes keeps it honest.

## Challenge

Round 1, 2026-11-24, a separate agent with no context from the writing
session. Verdict: holds with fixes. Each finding was checked against the
code before it was settled.

| # | Finding | Settled |
| --- | --- | --- |
| 1 | Labels set via the API by people without push access are dropped, so a label search misses petitions | Shape B: the person submits the form, which labels it; search by title prefix |
| 2 | Searching reads strangers' unlabelled issue bodies in the adopting session | Titles only; the person opens candidates |
| 3 | The version had two writers (AGENTS.md line vs the installed skills) and `charter` could not read it | Version in each SKILL.md's frontmatter (`skill-version`); AGENTS.md line dropped |
| 4 | A plugin install breaks the three-runtime rule and the project's own check | `plugin-install` dropped; out of scope with the reason |
| 5 | `method-notes` would point at `petition` before it exists | The offer line moved to `petition` |
| 6 | `blast-radius` relied on a baseline it did not depend on, with no threshold | Compared against `onus@<base>` in the same run, pass counts at n ≥ 3 |
| 7 | A stored baseline cannot serve a new scenario (new hash) | Proof rule re-runs the old wording as `onus@<ref>`; `bench-baseline` is a first data point, not a prerequisite |
| 8 | `verify-upkeep`'s premise was false: `evidence-kit` already runs the verify skill in CI | Dropped; added to "What Onus already has" |
| 9 | `petition` lacked Codex's `agents/openai.yaml` | Added then; superseded on 2026-11-24 when the owner let agents start the skill to draft |
| 10 | Notes written to PR comments and `.runs/` had no reader | Intake reads both |
| 11 | No shapes, examples of use or contract in the record | Added: "Two shapes", "Examples of use", "Contract" |
| 12 | Several criteria did not check what `what` asks | Rewritten: placement per skill, a skill listing, a frontmatter check, one choice for this repository's rules |

Not settled, kept as risks: posting identity, versions that do not move,
plain-words requests. "The agent's own PRs" in `resume-case` is settled by
agent names in `docs/plans/multi-agent.md`, where the issue moved.

## Still owed

- A second challenge round on this wording, if the owner wants one.
- The owner labels the issues the agent may do, starting with
  `method-notes`.
