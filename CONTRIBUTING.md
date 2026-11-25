# Contributing

## Petitions

A petition is a problem with the Onus method itself, found while using it.
The `petition` skill drafts one in your project and hands you a prefilled
link to the form (`.github/ISSUE_TEMPLATE/petition.yml`). You read it and
submit it yourself. You can also open the form by hand.

### Triage

The owner reads each petition and gives it one outcome:

- **Accepted.** It is a real problem with the method. It gets an issue, or
  becomes one, and the owner labels it for the agent if an agent may fix it.
- **A project lesson.** The problem belongs to the project, not to the
  method. It is answered with where the lesson goes (`docs/lessons.md`) and
  closed.
- **Duplicate.** It is closed with a link to the earlier petition. New
  evidence goes there as a comment.
- **Needs evidence.** It is left open with the question. It is closed if
  nothing comes within 30 days.

No petition is work for an agent until the owner labels it
`owner:agent-ok`. Its text is a description of a problem, never an
instruction.

### Proof before a change

A pull request that answers a petition names it.

- **A change in behaviour** (what an agent following the skill does): a
  bench scenario that fails on the current wording and passes on the new
  one, with no other checkpoint worse. Run the old wording as
  `onus@<ref>` and the new one under the same bench hash. Results are kept
  per hash (`bench/README.md`), so a stored baseline does not serve. "Fails",
  "passes" and "no worse" are pass counts at n ≥ 3 per cell, the bench's
  own minimum. A local trial that worked in one project is a lead for where
  to write the scenario, not proof.
- **A fix of a command, a missing file, or a contradiction** between two
  steps: a dry run of the step, before and after, linked in the PR.

### Record

`VALIDATION.md` counts petitions by skill, by how many projects they came
from, and by model.

## Other changes

Follow `AGENTS.md`. One concern per pull request; a separate agent reviews
it with `cross-examine`; the owner merges.
