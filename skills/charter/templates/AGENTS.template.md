# AGENTS.md

Guide for any agent (or human) working in this repository. Keep it short and
true. If code and this file disagree, fix one of them in the same PR.

Every agent runtime reads this one file: Pi and Codex read `AGENTS.md`
directly, and `CLAUDE.md` imports it for Claude Code. The procedures are
skills (`take-case`, `docket`, `cross-examine`), found in `.claude/skills` and
`.agents/skills`.

## What this is

<Two or three sentences: what the project does, and the few terms a newcomer
must know. A table of concepts if there are more than three.>

## Commands

```sh
<install command>
<check command>      # must pass before any PR: <what it runs>
<test command>       # tests only
<run command>        # run it locally
```

## Architecture map

- `<path>` - <what lives here and the one rule about it>.
- `<path>` - <...>.

<How dependencies may point, and what checks that.>

## Invariants (do not change without the owner's explicit approval)

1. **<Name>.** <A rule that must hold whatever the change. Say what decides
   it or where it is computed.>
2. **<Name>.** <...>

## What enforces each rule

A rule nothing enforces is only as good as the next reader. When a mistake
repeats, move its rule up this table (`docs/development.md`, "Lessons").
Say what a check really covers, and below the table point to where each
check lists what it does not cover.

| Rule | Enforced by | Kind |
| --- | --- | --- |
| <Invariant 1> | <the type, check or test that fails when it breaks, or "review checklist n"> | types / check / test / review |
| <Invariant 2> | <...> | <...> |
| Protected paths | <CODEOWNERS; what the branch rules really require; who merges> | check / owner |
| Lessons with a check | each lesson's `Check:` line in `docs/lessons.md` | check |
| Every runtime finds the rules and the skills | `scripts/check-agent-files.mjs` in the check command; the comment at its top lists what it fails on and what it does not see | check |

Rows marked review only are the next to enforce. Known gaps in the checks:
<what each check above does not cover. Keep each list in one place, next to
the check, and point to it from here.>

## Protected paths

`<paths>`, `.claude`, `.agents`, `AGENTS.md`, `CLAUDE.md`. You may propose
changes; the owner must approve them.

## How to work here

The working method is `docs/development.md`; read it and `docs/lessons.md`
before starting a task.

1. Pick an issue (the `take-case` skill finds the next one labelled
   `<agent label>`; the `docket` skill works through a whole goal). Branch
   from `<base branch>`. Never push to `<base branch>` directly. Stop and
   ask before anything that cannot be undone.
2. Implement, then run the check command locally. Drive anything a user sees
   on the real app with the project's verify skill, if it has one.
3. Push the branch and open a PR. CI runs the check command.
4. A separate review agent, with no context from the writing session,
   reviews the PR with the `cross-examine` skill. The session that wrote a PR
   does not review it.
5. The owner merges.
6. A mistake caught by the owner, CI or review becomes a lesson in
   `docs/lessons.md`, or a check.

- One concern per PR.
- Record a decision that changes the design where the project keeps
  decisions (`<docs/adr>`).
- Never put secrets or personal data in logs, issues, PR descriptions or
  test fixtures.
