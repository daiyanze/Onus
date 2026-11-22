# AGENTS.md

Guide for any agent (or human) working in this repository. Keep it short and
true. If code and this file disagree, fix one of them in the same PR.

Every agent runtime reads this one file: Pi and Codex read `AGENTS.md`
directly, and `CLAUDE.md` imports it for Claude Code. The procedures are
skills (`{{skill:issue}}`, `{{skill:run}}`, `{{skill:review}}`), found in
`.claude/skills` and `.agents/skills`.

## What this is

A small notes service. It keeps notes in memory and serves them as JSON over
HTTP. `README.md` lists the API.

## Commands

```sh
bun run check        # must pass before any PR: the tests
bun test             # tests only
bun run start        # run it locally on PORT (default 3000)
```

## Architecture map

- `src/notes.ts` - the note rules as pure functions. No IO, no clock (time is
  a parameter).
- `src/server.ts` - the HTTP surface. Parses requests, calls `src/notes.ts`,
  writes JSON. No note rules here.
- `test/` - tests for `src/notes.ts`.

## Invariants (do not change without the owner's explicit approval)

1. **The API in `README.md` is the contract.** A route, a query parameter or
   a status code changes only with the README in the same PR.
2. **Rules live in `src/notes.ts`.** The server only translates HTTP.

## What enforces each rule

| Rule | Enforced by | Kind |
| --- | --- | --- |
| 1. The API is the contract | review checklist 1 | review |
| 2. Rules live in `src/notes.ts` | review checklist 2 | review |
| Lessons with a check | each lesson's `Check:` line in `docs/lessons.md` | check |

Known gaps: nothing tests `src/server.ts`; the tests cover `src/notes.ts`
only.

## Protected paths

`AGENTS.md`, `CLAUDE.md`, `.claude`, `.agents`. You may propose changes; the
owner must approve them.

## How to work here

The working method is `docs/development.md`; read it and `docs/lessons.md`
before starting a task.

1. Pick an issue (the `{{skill:issue}}` skill finds the next one labelled
   `agent-ok`). Branch from `main`. Never commit to `main` directly. Stop
   and ask before anything that cannot be undone.
2. Implement, then run `bun run check`. Drive anything a user sees on the
   running server.
3. Open a PR.
4. A separate review agent, with no context from the writing session,
   reviews the PR with the `{{skill:review}}` skill.
5. The owner merges.
6. A mistake caught by the owner or review becomes a lesson in
   `docs/lessons.md`, or a check.

- One concern per PR.
- Never put secrets or personal data in logs, issues or PR descriptions.
