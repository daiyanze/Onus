---
name: adopt
description: Set up the Surgical Dev method in the repository you are in - one rules file every agent runtime reads, the method and lessons docs, skill folders wired for Claude Code, Pi and Codex, and a check that keeps it so. Use once per repository, when the owner asks to adopt or install the method.
---

# Adopt the method in this repository

One-time setup. It writes documents and one check script, changes no
product code, and ends in a pull request the owner merges. The files to copy
are in `templates/` next to this file.

Needs: a Git repository on GitHub, the `gh` CLI, a clean working tree.
Work on a branch from the default branch.

## 1. Read the repository first

Find out, without asking: what the project does; how to install, check,
test and run it (README, package scripts, Makefile, CI workflows); the
default branch; any existing `AGENTS.md`, `CLAUDE.md` or other agent
instruction file; `CODEOWNERS`; where design decisions are recorded; which
skill folders exist (`.claude/skills`, `.agents/skills`).

Ask the owner only what the repository cannot tell you. Usually that is:
the label that marks an issue as the agent's to do (default `agent-ok`), and
which paths need the owner's approval.

## 2. Rules: `AGENTS.md`, and `CLAUDE.md` importing it

Copy `templates/AGENTS.template.md` to `AGENTS.md` and fill every `<...>`.

- If `AGENTS.md` or `CLAUDE.md` already has content, move all of it into the
  matching sections. Drop nothing; if a line fits no section, keep it under
  "How to work here".
- Copy `templates/CLAUDE.template.md` to `CLAUDE.md`. It only imports
  `AGENTS.md`, so there is one copy of the rules.
- No `AGENTS.override.md`: Pi and Codex read it instead of `AGENTS.md`.
- **Invariants.** Take them from what the project already states (README,
  decision records, comments that say "never" or "must"). If you propose one
  the project does not state, mark it "(proposed)" so the owner can strike
  it in the PR. Three true invariants beat ten guesses.
- **What enforces each rule.** For each invariant, find what actually fails
  when it is broken: a type, a test, a lint rule. Say only what that check
  covers. If nothing fails, write "review checklist n" and add the question
  to "Review checklist" in `docs/development.md`. When it is cheap, break
  the rule in a scratch copy and watch the check fail before you write that
  it does.

## 3. Method and lessons

Copy `templates/docs/development.md` and `templates/docs/lessons.md` to
`docs/`. In `development.md`, fill the agent label, the example exit
condition and the review checklist. Leave `lessons.md` empty: lessons are
this project's own mistakes, added as they happen.

## 4. Skills every runtime can find

Claude Code reads `.claude/skills`; Pi and Codex read `.agents/skills`. The
skills `next`, `long-run` and `review` must be in both, as one copy.

- If a skills installer already put them in both places with links, keep
  that.
- Otherwise put the real folders in `.claude/skills` and make
  `.agents/skills` a link to it: `mkdir -p .agents && ln -s ../.claude/skills
  .agents/skills`. If `.agents/skills` already holds other skills, link each
  skill instead.

Do not name a skill `run`: Claude Code ships one.

## 5. The check

Copy `templates/scripts/check-agent-files.mjs` and its test to `scripts/`,
and add `check-agent-files.mjs` to the project's check command so CI runs
it. It fails when `CLAUDE.md` holds more than the import, when
`AGENTS.override.md` exists, when a skill is missing from one of the two
folders or exists as two copies, and when a skill's frontmatter is not valid
YAML with a matching `name` and a `description`.

- Bun runs it as it is. On Node, add the `yaml` package as a dev dependency.
- If the project has neither, skip the script and write "review" in that
  row of the enforcement table.

Run it. It must print `agent files ok`.

Add `.runs/` to `.gitignore` (long-run decision logs).

## 6. Open the pull request

Follow the method you just installed: title `chore(agents): adopt the
Surgical Dev method`; sections Why, What changed, Scope, Verification. Then
start a separate agent with no context from this session and have it follow
the `review` skill on the PR. Ask it in particular to test every "Enforced
by" entry against the code.

List in the PR what only the owner can do:

- Create the agent label, and label the first issues. Give each issue
  acceptance criteria and a "Depends on" section.
- Protect the default branch: require a pull request and the check command.
- Add `CODEOWNERS` for the protected paths, and decide whether code-owner
  approval is required. Until it is, the safeguard is that only the owner
  merges; say so in the "Protected paths" row.
- Decide which invariants marked "(proposed)" stay.

## 7. Next

If the project has something a user can see or do, create its verify skill
with `make-verify-skill`. Then the owner can ask for the next issue.
