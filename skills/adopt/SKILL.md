---
name: adopt
description: Set up the Surgical Dev method in the repository you are in - one rules file every agent runtime reads, the method and lessons docs, skill folders wired for Claude Code, Pi and Codex, and a check that keeps it so. Use once per repository, when the owner asks to adopt or install the method.
---

# Adopt the method in this repository

One-time setup. It writes documents and one check script and ends in a pull
request the owner merges. It changes no product code; on a Node project it
adds one dev dependency for the check. The files to copy are in `templates/`
next to this file.

Needs: a Git repository on GitHub, the `gh` CLI, and a working tree with no
changes other than the skill folders you were just given. Work on a branch
from the default branch.

## 1. Read the repository first

Find out, without asking: what the project does; how to install, check,
test and run it (README, package scripts, Makefile, CI workflows); the
default branch, and whether work is integrated on another branch; any
existing `AGENTS.md` or `CLAUDE.md`; instruction files for other tools
(`.cursorrules`, `.github/copilot-instructions.md`, `GEMINI.md` and the
like); `CODEOWNERS`; where design decisions are recorded; which skill
folders exist (`.claude/skills`, `.agents/skills`).

Ask the owner only what the repository cannot tell you. Usually that is:
the label that marks an issue as the agent's to do (default `agent-ok`), and
which paths need the owner's approval.

## 2. Copy the four documents

| From `templates/` | To |
| --- | --- |
| `AGENTS.template.md` | `AGENTS.md` |
| `CLAUDE.template.md` | `CLAUDE.md` |
| `docs/development.md` | `docs/development.md` |
| `docs/lessons.md` | `docs/lessons.md` |

If `AGENTS.md` or `CLAUDE.md` already has content, keep that content aside
first: step 3 moves all of it into the new `AGENTS.md`.

## 3. Fill `AGENTS.md`

Replace every `<...>`. Delete a line or a section that does not apply to
this project (no run command for a library, no decision records); leave no
placeholder behind.

- **Existing rules.** Move everything from the old `AGENTS.md` or
  `CLAUDE.md` into the matching sections. Drop nothing; a line that fits no
  section goes under "How to work here".
- **`CLAUDE.md`** stays as copied: the import and its note. No
  `AGENTS.override.md`, no `.claude/CLAUDE.md`, no `.claude/rules`: they
  would give one runtime rules the others do not see.
- **Other tools' instruction files.** Leave them as they are and list them
  in the PR, with any place where they contradict `AGENTS.md`, so the owner
  can decide.
- **Base branch.** `<base branch>` is the default branch, unless the project
  integrates work on another one; then use that and say so.
- **Invariants.** Take them from what the project already states (README,
  decision records, comments that say "never" or "must"). If you propose one
  the project does not state, mark it "(proposed)" so the owner can strike
  it in the PR. Three true invariants beat ten guesses.
- **What enforces each rule.** For each invariant, find what actually fails
  when it is broken: a type, a test, a lint rule. Say only what that check
  covers, and list its gaps under the table. If nothing fails, write "review
  checklist n" and add the question in step 4. When it is cheap, break the
  rule in a scratch copy and watch the check fail before you write that it
  does.

## 4. Fill `docs/development.md`

Replace `<agent label>`, the example exit condition, and the "Review
checklist" with this project's questions (the ones step 3 marked "review").
Leave `docs/lessons.md` empty: lessons are this project's own mistakes,
added as they happen.

## 5. Skills every runtime can find

Claude Code reads `.claude/skills`; Pi and Codex read `.agents/skills`.
Every skill in either folder must be in both, as one copy. The check in
step 6 holds the project to that.

- If a skills installer already put them in both places with links, keep
  that.
- Otherwise put the real folders in `.claude/skills` and make
  `.agents/skills` a link to it: `mkdir -p .agents && ln -s ../.claude/skills
  .agents/skills`.
- If both folders already hold skills, link each skill that is missing on
  one side from the other side, including skills the project had before.

Do not name a skill `run`, `review` or `code-review`: Claude Code ships
skills with those names.

## 6. The check

Copy `templates/scripts/check-agent-files.mjs` and its test to `scripts/`.
It fails when `CLAUDE.md` holds more than the import and a short note, when
a file exists that gives one runtime its own rules (`AGENTS.override.md`,
`.claude/CLAUDE.md`, `.claude/rules`), when a skill is missing from one of
the two folders or exists as two copies, and when a skill's frontmatter is
not valid YAML with a matching `name` and a `description`.

- Add it to the project's check command, so CI runs it. If the project has
  no check command or no CI, add a script entry that runs it and say in the
  PR that nothing runs it automatically yet.
- Bun runs it as it is. On Node, add the `yaml` package as a dev dependency.
- If the project has neither Bun nor Node, skip the script and write
  "review" in that row of the enforcement table.

Run it. It must print `agent files ok`.

Add `.runs/` to `.gitignore` (long-run decision logs).

## 7. Open the pull request

Follow the method you just installed: title `chore(agents): adopt the
Surgical Dev method`; sections Why, What changed, Scope, Verification. Then
start a separate agent with no context from this session and have it follow
the `pr-review` skill on the PR. Ask it in particular to test every
"Enforced by" entry against the code.

List in the PR what only the owner can do:

- Create the agent label, and label the first issues. Give each issue
  acceptance criteria and a "Depends on" section.
- Protect the base branch: require a pull request and the check command.
- Add `CODEOWNERS` for the protected paths, and decide whether code-owner
  approval is required. Until it is, the safeguard is that only the owner
  merges; say so in the "Protected paths" row.
- Decide which invariants marked "(proposed)" stay.
- In Pi, trust the project: Pi loads a project's `.agents/skills` only
  after that.

## 8. Next

If the project has something a user can see or do, create its verify skill
with `make-verify-skill`. Then the owner can ask for the next issue.
