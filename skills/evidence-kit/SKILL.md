---
name: evidence-kit
description: Make this project's verify skill - a scripted way to start the real app, use it the way a user does, and keep the evidence. Use once per project, when the method asks for verification on the real app and the project has no verify skill yet.
---

# Evidence kit: make the project's verify skill

The check command proves types, lint and unit tests. It does not prove that
the app a user starts does the thing. A verify skill does: start an isolated
instance, use it, save what it answered, stop it. This skill creates one
for the repository you are in, as `.claude/skills/verify-<app>/`, written
for the next agent, who will read it cold in the middle of a task.

## 1. Learn the app from the repository

Answer these from the code and docs; ask the owner only what you cannot
find.

- **Surface.** What does a user touch: a web page, a CLI, an API, a desktop
  or mobile app, a library? Pick the main one and note the rest.
- **Run.** The documented command that starts it locally, its ports,
  environment variables, seed data and sign-in.
- **Drive.** How a program can use it: existing end-to-end tests first, then
  plain HTTP for services, a browser driver for pages, a terminal harness
  for CLIs.
- **Observe.** What can be saved as proof: responses, pages, screenshots,
  terminal output, rows in the database, exit codes.
- **Isolate.** Can two instances run side by side (own ports, own data
  folder)? If not, the skill must refuse to drive an instance someone else
  is using.

If the app does not start from a clean checkout, fix that first or report it
exactly. A skill written against a broken base teaches wrong steps.

## 2. Write a small harness and the skill

A script the skill calls beats instructions the agent retypes. Give it one
command per step, and make each command save what it saw:

- **Launch.** Start an isolated instance from an empty data folder (free
  ports, its own run folder) and return only when it is usable. Refuse to
  start a second one.
- **Doctor.** One read-only check: is this instance worth driving? Process
  alive, the right build, the routes answer, migrations ran.
- **Drive.** The real routes and commands a user or a scheduler uses. Not
  internal functions, not test-only setters.
- **Evidence.** Every answer saved in the run folder as a numbered file, and
  one line per command in a log (time, command, result, file). Failed
  commands are logged too.
- **Cleanup.** Stop only the process this harness started, checked by more
  than its pid, and delete its data. Never delete the evidence.

Then write `SKILL.md` with frontmatter (`name` matching the folder, and a
`description` that says when to reach for it) and one section per step, with
the exact commands. Add the proof standards: capture the action and the
state after it; check side effects, not only what the screen shows; a result
from the wrong surface (a unit test, an edited fixture) is not a pass.

If the app handles content from outside (fetched pages, user uploads), say
in the skill what must not be printed into a session that can write code,
and make the harness save it without printing it.

## 3. Map the features

Add `features/README.md` and one file per thing a user can do (start with
three to five). Each file says, from the user's side: what it is, how to
reach it, what correct looks like, the commands that check it, and the
edges. Features the skill does not drive are listed with where they are
checked instead.

## 4. Prove it, then keep it honest

- Run the skill's own steps end to end once: launch, doctor, drive one
  mapped feature, capture, clean up. Confirm the evidence is still there
  after cleanup and the instance is gone.
- Put that sequence in a script and run it in CI, with no network if the
  app allows it. A skill that CI does not exercise drifts.
- Add tests for the harness's own logic, and prove each of its guards
  against the case it is for.
- Rule for later changes: when a feature file says something the app no
  longer does, fix the file in the same PR as the change that moved it.

Open a PR with the skill, the harness, the CI step and a line in
`AGENTS.md` ("How to work here") naming the skill. Follow
`docs/development.md` for the PR and the independent review.

### Method notes

Check the signals in `docs/development.md` ("Method notes") against this
run, and list each note with its signal, step and evidence, or `none`. A
project chartered before that section existed does not have it: read it from
the `charter` skill's own `templates/docs/development.md`.

For a note worth sending to Onus, offer the `petition` skill. You may run
it yourself: it only writes a local draft. Name the draft here.
