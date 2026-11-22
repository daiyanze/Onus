# Surgical Dev

**A development method for coding agents: one writer, an independent
reviewer that proves what it finds, and lessons that turn into checks.**

It is plain Markdown: five Agent Skills, four document templates and one
check script. There is no runtime and no controller to install. Claude Code,
Pi and Codex read the same files.

The method was extracted from a real project,
[Breaker Delta](https://github.com/daiyanze/breaker-delta), where it took
shape over a few days of real pull requests. What has and has not been tried
is in [VALIDATION.md](VALIDATION.md); read that before you rely on a part of
it.

## 🎯 The problem it solves

Coding agents write a plausible change quickly. The trouble starts after:

- **"Done" is a claim, not evidence.** Tests pass, but nobody started the
  app. The PR says "behaviour unchanged" and nothing shows it.
- **The author reviews its own work.** The session that wrote the change
  believes its own description of it.
- **The same mistake comes back.** A correction lives in one chat and is
  gone in the next. A rule in a document is read, agreed with, and broken.
- **Each tool sees different rules.** Instructions written for one agent
  runtime are invisible to the others.

## 🧭 The method on one page

1. **One rules file.** `AGENTS.md` holds what the project is, its commands,
   its invariants, and a table of what enforces each rule. `CLAUDE.md` only
   imports it, so every runtime reads the same text.
2. **One loop for every change:** explore, plan, code, verify, PR, review,
   learn. Four principles run through it: think before coding, simplicity
   first, surgical changes, goal-driven execution.
3. **Verify on the real thing.** The check command covers types, lint and
   tests. Anything a user can see is also driven on the running app with the
   project's own verify skill, which keeps the evidence.
4. **An independent review on every PR.** A fresh agent with none of the
   writer's context reads the diff before the description, runs the change,
   looks for problems in three passes, and reports only what it can prove: a
   bug needs a run that shows it, a rule violation needs the rule quoted. It
   answers each acceptance criterion and posts one comment. Its verdict
   covers one commit; later commits need a new review unless they only fix
   its notes.
5. **Lessons become checks.** A mistake caught by the owner, CI or the
   review is written down with its scope. If a check can enforce it, the
   check is added, at the highest level that works: architecture, then
   types, then lint or CI, then a test, and written rules last. A mistake
   that repeats moves its rule one level up.
6. **Long runs with an exit condition.** Given a goal instead of an issue,
   the agent states a condition a command can check, works issue after
   issue, keeps a decision log, parks what needs the owner, and never
   relaxes the condition to finish.
7. **The owner merges.** The agent never merges, never pushes to the base
   branch, and stops to ask before anything that cannot be undone.

## 🚀 Quickstart

You need a repository on GitHub, the `gh` CLI, and one of the supported
agents.

**1. Put the skills in your repository.** Copy the five folders under
[`skills/`](skills) into `.claude/skills/` in your project. The
[skills CLI](https://github.com/vercel-labs/skills) can do it for several
agents at once:

```bash
npx skills add daiyanze/surgical-dev
```

**2. Ask your agent to adopt the method.**

```text
/adopt
```

(`/skill:adopt` in Pi, `$adopt` in Codex.) The agent reads your repository,
writes `AGENTS.md`, `CLAUDE.md`, `docs/development.md` and
`docs/lessons.md`, links the skill folders so every runtime finds them, adds
the check, and opens a pull request. It changes no product code; on a Node
project it adds one dev dependency (`yaml`) for the check.

**3. Do the owner's part.** The pull request lists it: create the agent
label, protect your base branch (usually the default branch), decide the
protected paths, strike any proposed invariant you do not want. Then merge.

**4. Work.**

```text
/next                         the next issue the agent may do, end to end
/next #42                     that issue
/long-run finish milestone 2  issue after issue, until the exit condition holds
```

Each issue ends as a pull request with green CI and an independent review
comment. You read the comment and merge.

## 📚 What is in the box

| Skill | Use it when | What you get |
| --- | --- | --- |
| [`adopt`](skills/adopt/SKILL.md) | Once per repository | The rules file, the method and lessons docs, wired skill folders, the check, as a PR |
| [`next`](skills/next/SKILL.md) | You want the next issue done | A branch, a PR with evidence, CI, an independent review |
| [`long-run`](skills/long-run/SKILL.md) | You have a goal, not an issue | PRs for every issue the agent can do, a decision log, a list of what waits on you |
| [`pr-review`](skills/pr-review/SKILL.md) | A PR is open and CI is green | One comment: verdict, acceptance criteria, proven findings |
| [`make-verify-skill`](skills/make-verify-skill/SKILL.md) | Once per project with something a user can see | A verify skill and harness for your app, exercised in CI |

Templates, in [`skills/adopt/templates/`](skills/adopt/templates):
`AGENTS.template.md`, `CLAUDE.template.md`, `docs/development.md` (the
method as the agent reads it), `docs/lessons.md`, and
`scripts/check-agent-files.mjs` with its tests.

## 🤖 Supported agent runtimes

| Runtime | Reads rules from | Finds skills in | Call a skill |
| --- | --- | --- | --- |
| Claude Code | `CLAUDE.md`, which imports `AGENTS.md` | `.claude/skills` | `/next` |
| Pi | `AGENTS.md` | `.agents/skills` | `/skill:next` |
| Codex | `AGENTS.md` | `.agents/skills` | `$next`, or `/skills` |

One of the two skill folders is a link to the other, so there is one copy.
`check-agent-files.mjs` fails your check command when the runtimes would not
see the same rules and skills; the comment at the top of
[the script](skills/adopt/templates/scripts/check-agent-files.mjs) lists
exactly what it fails on and what it does not see. Pi loads a project's
`.agents/skills` only after you trust the project. The review skill is
called `pr-review`, not `review`, because Claude Code ships its own
`/review`.

## 🔍 Why the review works this way

- **No shared context.** The reviewer is a new agent. It gets the PR, not
  the conversation that produced it.
- **Diff first.** A description that says "no bugs" lowers a reviewer's
  detection rate, so claims are read after the code and treated as things to
  test.
- **Proof or silence.** A finding nobody can reproduce costs the owner
  attention and teaches everyone to skim the review. Unproven candidates are
  dropped.
- **One comment.** Verdict, acceptance criteria, blocking issues, notes,
  and what could not be checked.

In Breaker Delta the first review asked for changes on 6 of 23 pull
requests, each time with a reproduction or a quoted rule. Details and limits:
[VALIDATION.md](VALIDATION.md).

## 🛡️ What it does not do

- It does not merge, deploy or delete. Those stay with the owner.
- It does not enforce itself with code. The skills are instructions; what
  holds them in place is your check command, your branch rules, and the fact
  that only you merge. Say in `AGENTS.md` what your branch rules really
  require.
- It does not replace your tests or CI. It uses them.
- It is not proven across models or teams. One project, one model family so
  far.

## Sources

- [Andrej Karpathy's coding observations](https://x.com/karpathy/status/2015883857489522876)
  and the [community Skill](https://github.com/multica-ai/andrej-karpathy-skills):
  the four principles.
- Anthropic's Claude Code best practices and its `code-review` plugin:
  explore, plan, code, commit; evidence over claims; independent finders,
  then validation of every finding.
- [pstack](https://github.com/cursor/plugins/tree/main/pstack) by poteto:
  verify on the real surface, playbooks per kind of work, exit conditions
  for long runs, a rule for each mistake and what enforces it.
- [Agent Skills specification](https://agentskills.io/specification): the
  portable skill format.
- The earlier Surgical Dev design (in this repository's history): a verdict
  per acceptance criterion, a verdict bound to one commit, and budgets for
  unattended work.
