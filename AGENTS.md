# AGENTS.md

Guide for any agent (or human) working in this repository. Keep it short and
true. If code and this file disagree, fix one of them in the same PR.

## What this is

Onus is a development method for coding agents, shipped as Agent Skills:
`charter`, `take-case`, `docket`, `cross-examine`, `brief` and
`evidence-kit` under `skills/`. Projects copy those skills; this repository
is where they are written. Plans for larger changes live in `docs/plans/`.

## Commands

```sh
npm install --ignore-scripts      # or: bun install
npm run check                     # must pass before any PR: check-agent-files on skills/
npm test                          # the check scripts' and check-plan's tests
npm run test:bench                # the bench harness with a fake runtime
```

Without network, the same checks run with Bun and no install:
`bun skills/charter/templates/scripts/check-agent-files.mjs --skills skills`
and `bun test skills/charter/templates/scripts/ skills/brief/scripts/`.

## Protected paths

`.github/`, `.claude-plugin/`, `package.json`, `skills/charter/templates/scripts/`,
`skills/brief/scripts/check-plan.mjs`, `bench/`, `AGENTS.md`, `CLAUDE.md`.
These hold this repository's gate (CI, the check scripts, the bench) and
its distribution. You may propose changes; the owner merges them. A `docket`
grant never covers them.

## How to work here

The working method is the one Onus ships:
`skills/charter/templates/docs/development.md`, read as if it were this
repository's `docs/development.md`.

1. Issues labelled `owner:agent-ok` are the agent's to do; `owner:human`
   and `owner:human+agent` need the owner. Branch from `main`; never push
   to `main` directly.
2. Run the check and the tests before pushing.
3. Open a PR. A separate agent with no context from the writing session
   reviews it with `skills/cross-examine`.
4. The owner merges, or grants a `docket` run the right to merge its own
   PRs outside the protected paths.

- One concern per PR.
- A change to a skill's wording is a change to every project that copies
  it: say in the PR what an adopting project will notice.
