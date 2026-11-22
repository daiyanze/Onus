# Onus

**The burden of proof is on the agent.** A development method for coding
agents: one writer, an independent reviewer that proves what it finds, and
lessons that turn into checks.

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

## ⚖️ The one rule

*Onus probandi*: whoever makes a claim carries the burden of proving it.

| Who claims | What they claim | What counts as proof |
| --- | --- | --- |
| The writer | "Done", "behaviour unchanged", "tests cover it" | Commands and their output; the app driven on its real surface |
| The reviewer | "This is a bug" | A run that shows it fail. Reading the code finds a bug; it does not prove one |
| The reviewer | "This breaks a rule" | The rule quoted, and the lines that break it |
| A document | "This check enforces X" | A test that breaks X and watches the check fail |
| The owner | "Merge" | The owner's own decision. The agent never merges |

Everything else in the method follows from this table.

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
   looks for problems in three passes, and reports only what it can prove. It
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
npx skills add daiyanze/Onus
```

**2. Ask your agent to charter the repository.**

```text
/charter
```

It writes `AGENTS.md`, `CLAUDE.md`, `docs/development.md` and
`docs/lessons.md`, links the skill folders so every runtime finds them, adds
the check, and opens a pull request. It changes no product code; on a Node
project it adds one dev dependency (`yaml`) for the check.

**3. Do the owner's part.** The pull request lists it: create the agent
label, protect your base branch (usually the default branch), decide the
protected paths, strike any proposed invariant you do not want. Then merge.

**4. Work.**

```text
/take-case                        the next issue the agent may do, end to end
/take-case #42                    that issue
/docket finish milestone 2        issue after issue, until the exit condition holds
/cross-examine 57                 an independent review of pull request 57
```

Each issue ends as a pull request with green CI and an independent review
comment. You read the comment and merge.

## 📚 The skills

The names come from a courtroom, because the method is about who has to
prove what. Each description also carries the plain name (next issue, long
run, PR review), so the agent picks the right skill when you ask in your own
words.

| Skill | Plain name | Use it when |
| --- | --- | --- |
| [`charter`](skills/charter/SKILL.md) | adopt the method | Once per repository |
| [`take-case`](skills/take-case/SKILL.md) | next issue | You want the next issue done, or a named one |
| [`docket`](skills/docket/SKILL.md) | long run | You have a goal, not an issue |
| [`cross-examine`](skills/cross-examine/SKILL.md) | PR review | A PR is open and CI is green |
| [`evidence-kit`](skills/evidence-kit/SKILL.md) | make a verify skill | Once per project with something a user can see |

How to call one:

| Runtime | Reads rules from | Finds skills in | Call a skill |
| --- | --- | --- | --- |
| Claude Code | `CLAUDE.md`, which imports `AGENTS.md` | `.claude/skills` | `/take-case` |
| Pi | `AGENTS.md` | `.agents/skills` | `/skill:take-case` |
| Codex | `AGENTS.md` | `.agents/skills` | `$take-case`, or pick it from `/skills` |

Pi loads a project's `.agents/skills` only after you trust the project.

### `charter`: adopt the method

- **Reads:** your README, package scripts, CI workflows, any existing
  `AGENTS.md` or `CLAUDE.md`, `CODEOWNERS`.
- **Asks you:** only what the repository cannot say, usually the agent label
  and which paths need your approval.
- **Writes:** the four documents, the skill-folder link, the check script.
  Existing rules move into `AGENTS.md`; nothing is dropped. An existing
  `docs/development.md` is not overwritten: it stops and asks.
- **Ends with:** a pull request, reviewed by `cross-examine`, listing what
  only you can do. Invariants it inferred are marked "(proposed)".

### `take-case`: the next issue

- **Picks:** an open issue with the agent label, whose "Depends on" issues
  are closed and that no open PR already covers. Among those, the one that
  unblocks the most other issues. It reads the body of labelled issues only.
- **Does:** the loop in `docs/development.md`: branch, implement, check,
  verify on the real app if a user can see the change, push, PR, wait for CI,
  start an independent `cross-examine`.
- **Stops and asks:** on a conflict with a recorded decision, a secret it
  needs, a protected path the issue does not mention, or anything that
  cannot be undone.
- **Reports:** the PR link, what was not verified locally, the review
  verdict, what needs you.

### `docket`: a long run toward one goal

```text
/docket every open agent-ok issue in milestone 2
```

- **Starts** by writing the exit condition as something a command can
  check, and tells you in one line. Example: every open issue with the agent
  label in milestone 2, whose dependencies are closed, has an open PR with
  green CI and an approving review that covers its head.
- **Loops** `take-case` until the condition holds or no candidate is left.
  One row per decision goes into `.runs/<date>-<goal>.tsv`.
- **Parks** an issue for you, and moves on, after three review rounds
  without approval, after three failed fixes of the same check, or when it
  needs a decision only you can make.
- **Picks up** where an earlier session stopped, from the log, the open PRs
  and `git log`, without redoing work.
- **Never** merges, pushes to the base branch, or deploys.

### `cross-examine`: independent PR review

Run it in a new session or a new agent, never in the one that wrote the PR.

- **Reads** the diff before the description, and treats every claim in the
  description as a hypothesis.
- **Runs** the check command in its own worktree, and writes throwaway
  probes to confirm what it suspects.
- **Finds** in three passes (rules, bugs, test evidence), then drops every
  candidate it cannot prove.
- **Posts** one comment and reads it back:

```text
_Review by an independent agent (<model>), at <full head SHA>._

**Verdict:** approve | approve with nits | request changes
**Checks:** the check command's result, and where it ran.

**Acceptance criteria**
- <criterion>: met | not met | cannot tell - the evidence.

**Blocking issues**
1. <file:line permalink> what is wrong, why it matters, how it was confirmed.

**Non-blocking notes**
**Claims checked** / **Not checked** / **How this review ran**
**Second model** / **Protected paths touched**
```

### `evidence-kit`: make the project's verify skill

Builds `.claude/skills/verify-<app>/` for your app: a small harness that
launches an isolated instance, checks it is worth driving, drives the real
routes or commands, saves every answer as evidence, and cleans up only what
it started. It adds a feature map and a CI step that runs the skill's own
steps end to end.

## 🧾 Cases

These happened. Each links to the record.

**A check claimed more than it covered.** Breaker Delta's enforcement table
said protected paths were enforced by CODEOWNERS and branch protection, and
that a dependency check kept the web app away from the pipeline's code. The
review read the repository's rules through the GitHub API: no approval was
required. It then wrote a relative import from the web app into the
pipeline, and the dependency check passed it. Both rows were rewritten to say
what really holds: the first now says the owner's merge is the safeguard,
the second lists the gaps and points to a new review checklist item. ([review](https://github.com/daiyanze/breaker-delta/pull/197#issuecomment-7079384816))

**A cleanup command could stop the wrong process.** The verify harness kept
the process ID of the app it started. The review wrote a stale state file
holding the ID of an unrelated `sleep`, ran the cleanup command, and watched
it kill that process. The harness now signals only a process whose app still
answers. ([review](https://github.com/daiyanze/breaker-delta/pull/196#issuecomment-7079357309))

**A lesson repeated, so it became a check.** A skill-file check read YAML
with a regular expression. The review fed it lines a YAML parser rejects,
and that Pi then drops; the regex passed them. It was the second time a
format had been read with hand-written rules, so the check now uses a real
parser and the lesson names it.
([review](https://github.com/daiyanze/breaker-delta/pull/199#issuecomment-7080396875),
[lesson L14](https://github.com/daiyanze/breaker-delta/blob/develop/docs/lessons.md))

**Three rounds, then the owner decided.** This repository's first pull
request was reviewed three times. Each round asked for changes, each for a
narrower problem: a script that did nothing when reached through a link;
then two shapes the documents said were caught and were not; then one
sentence. The recurring cause was the same claim restated in four places.
The fix was structural: one statement of what the check covers, at the top
of the script, with a test per line. After three rounds the method hands the
decision to the owner, who chose to merge.
([round 1](https://github.com/daiyanze/Onus/pull/18#issuecomment-7081977672),
[round 2](https://github.com/daiyanze/Onus/pull/18#issuecomment-7082233779),
[round 3](https://github.com/daiyanze/Onus/pull/18#issuecomment-7082514830))

**Four reviews were never posted.** In Breaker Delta, four review comments
hold a file name instead of the review: `gh api -f body=@file` sends
`@file` as the text and does not read the file. Those pull requests were
merged without a readable review. `cross-examine` now names the exact posting
command and reads the comment back. In a later round, the read-back caught a
link the posting had altered.

## 🛡️ What it does not do

- It does not merge, deploy or delete. Those stay with the owner.
- It does not enforce itself with code. The skills are instructions; what
  holds them in place is your check command, your branch rules, and the fact
  that only you merge. Say in `AGENTS.md` what your branch rules really
  require.
- It does not replace your tests or CI. It uses them.
- It is not proven across models or teams. One project, one model family so
  far.

## 🗺️ Next

- A benchmark: one test project with planted checkpoints, run without the
  method, with this version and with the previous one, on Claude Code, Pi
  and Codex, with token use recorded. Results will live in this repository.
- `clerk` (watch a PR through CI and review), `recess` (pause safely),
  `precedent` (find repeated mistakes in the history and turn them into
  checks), `debrief` (propose skill edits after a run), `brief` (turn a goal
  into a plan of pull requests).

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
- The earlier design in this repository's history (as Surgical Dev): a
  verdict per acceptance criterion, a verdict bound to one commit, and
  budgets for unattended work.
