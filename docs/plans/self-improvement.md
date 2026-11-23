# Plan: anyone using Onus can appeal a problem with the method, and Onus improves from it

Status: **draft**, written 2026-11-23 outside the `brief` skill. Steps 4
(sketches in code) and 5 (an independent challenge) of `brief` were not
run: the challenge is still owed before this plan is merged (see "Still
owed"). The plan itself is `docs/plans/self-improvement.yaml`; it passes
`check-plan.mjs`.

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
  method note an agent raised at the end of a task, into an issue on
  daiyanze/Onus, posted only after the person approved the exact text, and
  read back.
- Every skill's report ends with a `Method notes` section, and offers
  `appeal` when it is not empty.
- This repository has an issue form and a triage rule for appeals, and a
  bench baseline that an accepted appeal can be measured against.
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

Each is something the agent can see in the session or the repository,
without judging itself:

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

- **Every skill's report** gets a `Method notes` section: each note, or
  `none`. Ends with "Run `appeal` to send these to Onus." when not empty.
- **`cross-examine`'s comment** gets a `**Method notes:**` line, so the
  independent reviewer's notes are on the record where the person can find
  them later.
- **`docket`** logs a row with phase `method`.

### The `appeal` skill

1. **Intake.** Take what the person said, or the notes from this session's
   reports. Ask only what is missing, one question at a time: which task,
   what they expected, what happened. Never ask for code.
2. **Locate.** Name the skill and step the problem traces to, with the
   installed Onus version or commit (`charter` records it, issue
   `onus-version`). If it is a project lesson, say so and offer to add it to
   `docs/lessons.md` instead.
3. **Evidence.** Gather what the session and the repository show: the
   commands and their output, the review comment, the log rows. Keep only
   what bears on the step.
4. **Redact.** The issue quotes Onus text and describes the project in
   general terms. No code, file contents, secrets, private URLs, names of
   people, or anything a person said about themselves. A link the public
   cannot open is described, not pasted. Borrowed from superpowers'
   `diagnosing-superpowers`, and a lesson from Cursor's `continual-learning`,
   which was reported to write personal memory into a tracked AGENTS.md.
5. **Search.** Look for an existing appeal on daiyanze/Onus, open or closed.
   A known problem gets a comment with the new evidence, not a copy.
6. **Approve and post.** Show the person the exact title and body. Post only
   what they approve, with the `appeal` issue form's fields, then read it
   back (the `cross-examine` posting rule). Without `gh` or an account, write
   the body to a file and give the person the link to open a new issue.
   An unattended run never posts: it writes the draft and says so.

### What happens to an appeal here

- **Intake.** An issue form `.github/ISSUE_TEMPLATE/appeal.yml` with the same
  fields `appeal` fills, and the label `appeal`. An appeal is never labelled
  for the agent by anyone but the owner.
- **Triage**, by the owner: accepted (a real problem with the method),
  a project lesson (answered and closed), a duplicate, or needs evidence.
- **Proof before a change.** The project rule "a lesson becomes a check",
  applied to Onus: an accepted appeal that claims a change in behaviour gets
  a bench scenario that fails on the current wording and passes on the new
  one, with no other checkpoint worse. After superpowers' `writing-skills`:
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
| pstack `maintain-verification-skill` | A verify skill is maintained, not only created | `verify-upkeep` |
| pstack `poteto-agent`, `guard-the-context-window` | Delegates read the method first | `delegate-rules` |
| pstack `setup-pstack` | The project names its review models | `second-model-run` |
| pstack and Compound Engineering distribution | A plugin manifest and a marketplace install | `plugin-install` |

## One-way doors

- The skill name `appeal`, the label `appeal`, and the issue form's field
  names: projects call the skill by name and appeals are searched by label.
- The `Method notes` section and `**Method notes:**` line.
- What `charter` records as the Onus version: appeals compare against it.
- The plugin name in the manifest.

## Risks

- **Leaks.** An appeal posted from someone else's project is public. The
  redaction rules and the exact-text approval are the defence; the first
  appeals from another project will show whether they hold.
- **Noise.** A public repository invites appeals that are opinions. The
  form asks for the step and the evidence; triage closes the rest.
- **Spam or injection.** Appeal text is a description of work. It never
  reaches an agent as work unless the owner labels it.
- **Cost of proof.** If the bench is too slow, the rule will be skipped; the
  dry-run path for small fixes keeps it honest.

## Still owed

- `brief` step 5: an independent agent tries to break this plan, before it
  is merged.
- The owner labels the issues the agent may do, starting with
  `method-notes`.
