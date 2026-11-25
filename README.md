# Onus

**The burden of proof is on the agent.** A development method for coding
agents: one writer, an independent reviewer that proves what it finds, and
lessons that turn into checks.

It is plain Markdown: six Agent Skills, four document templates and two
check scripts. There is no runtime and no controller to install. Claude Code,
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
| A document | "This check enforces X" | The check that fails when X breaks, named, and only what its code covers. Where it is cheap, X broken in a scratch copy and the check seen to fail |
| The owner | "Merge" | The owner's own decision: each merge, or a grant to one `docket` run, given in that session. Without a grant the agent never merges |

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
6. **Plan before a goal is built.** Work bigger than one issue is designed
   first: at least two shapes sketched in code, the chosen one challenged by
   an independent agent that must prove what it finds, a recorded decision,
   and issues of one pull request each whose dependencies a script checks.
7. **Long runs with an exit condition.** Given a goal instead of an issue,
   the agent states a condition a command can check, works issue after
   issue, keeps a decision log, parks what needs the owner, and never
   relaxes the condition to finish.
8. **The owner merges, or grants it.** By default the agent never merges.
   The owner can grant a long run the right to merge its own PRs: each
   one only with an approving review of its current head (or of an
   earlier one followed only by clean merges of the base branch), green CI,
   the base branch merged in, and no protected path or CI workflow touched.
   The agent never pushes to the base branch, and stops to ask before
   anything that cannot be undone, except a merge your grant allowed to
   deploy.

## 🚀 Quickstart

You need a repository on GitHub, the `gh` CLI, and one of the supported
agents.

**1. Put the skills in your repository.** Copy the six folders under
[`skills/`](skills) into `.claude/skills/` in your project. The
[skills CLI](https://github.com/vercel-labs/skills) can do it for several
agents at once:

```bash
npx skills add daiyanze/Onus
```

Or install it as a plugin, and `charter` copies the skills into the
repository for you:

- **Claude Code:** `/plugin install onus --marketplace daiyanze/onus`
  (on Claude Code before 2.1.275: `/plugin marketplace add daiyanze/Onus`,
  then `/plugin install onus@onus`). Plugin skills carry the plugin's
  name: `/onus:charter`.
- **Claude (Cowork):** add `daiyanze/Onus` as a plugin marketplace in the
  Claude desktop app, or upload `onus.plugin` from the
  [latest release](https://github.com/daiyanze/Onus/releases). Build that
  file yourself with `npm run plugin`.

**2. Ask your agent to charter the repository.**

```text
/charter
```

(`/onus:charter` when Onus came as a plugin.)

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
/brief per-source rate limits     design it, then split it into issues
```

Each issue ends as a pull request with green CI and an independent review
comment. You read the comment and merge.

## 📚 The skills

The names come from a courtroom, because the method is about who has to
prove what. Each description also carries the plain name (next issue, PR
review), so the agent picks the right skill when you ask in your own words.
`docket` is the exception: it starts only when you name it, because a long
run should never start by itself. `disable-model-invocation` in its
frontmatter tells Claude Code and Pi not to pick it on their own, and
`agents/openai.yaml` tells Codex.

| Skill | Plain name | Use it when |
| --- | --- | --- |
| [`charter`](skills/charter/SKILL.md) | adopt the method | Once per repository |
| [`take-case`](skills/take-case/SKILL.md) | next issue | You want the next issue done, or a named one |
| [`docket`](skills/docket/SKILL.md) | long run | You have a goal, not an issue |
| [`cross-examine`](skills/cross-examine/SKILL.md) | PR review | A PR is open and CI is green |
| [`evidence-kit`](skills/evidence-kit/SKILL.md) | make a verify skill | Once per project with something a user can see |
| [`brief`](skills/brief/SKILL.md) | design and split into issues | A goal needs more than one pull request |

How to call one:

| Runtime | Reads rules from | Finds skills in | Call a skill |
| --- | --- | --- | --- |
| Claude Code | `CLAUDE.md`, which imports `AGENTS.md` | `.claude/skills` | `/take-case` |
| Pi | `AGENTS.md` | `.agents/skills` | `/skill:take-case` |
| Codex | `AGENTS.md` | `.agents/skills` | `$take-case`, or pick it from `/skills` |

Pi loads a project's `.agents/skills` only after you trust the project.

### `charter`: adopt the method

- **Reads:** your README, package scripts, CI workflows, any existing
  `AGENTS.md` or `CLAUDE.md`, `CODEOWNERS`, and how your own open issues
  write "Depends on" and name milestones.
- **Asks you:** only what the repository cannot say, usually the issue labels
  (defaults `owner:agent-ok`, `owner:human`, `owner:human+agent`)
  and which paths need your approval.
- **Writes:** the four documents, the skill-folder link, the check script.
  Existing rules move into `AGENTS.md`; nothing is dropped. An existing
  `docs/development.md` is not overwritten: it stops and asks.
- **Ends with:** a pull request, reviewed by `cross-examine`, listing what
  only you can do. Invariants it inferred are marked "(proposed)".

### `take-case`: the next issue

- **Picks:** an open issue with the agent label, whose "Depends on" issues
  are closed and that no open PR already covers. If the project works by
  milestone, only those in the earliest milestone that still has one, or
  whatever order your `docs/development.md` gives. It reads the dependency
  forms you list there too. Among those, the one that unblocks the most other issues, then the lowest
  number. It reads the body of labelled issues only.
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
/docket every open owner:agent-ok issue in milestone 2
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
- **Merges** only if you grant it in the session (`/docket finish milestone
  2, you may merge`), and only a PR it opened that has an approving review
  of its current head (or of an earlier one followed only by clean merges
  of the base branch), green CI, the base branch merged in, and no
  protected path, CI workflow or check-command change. It merges that
  exact commit, never with `--admin`. A failed CI run on the base branch
  after a merge stops all merging for the run, and the issues that wait on
  a merge start only after the base branch's CI passes. A new session or a scheduled run needs a new grant.
  Unless `AGENTS.md` says a merge deploys nothing, a merge counts as
  deploying, and the grant must say that merging may deploy. Only comments
  from the run's own account count as its review.
- **Never** pushes to the base branch, and deploys only through a merge
  that your grant allowed to deploy.

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

### `brief`: design a goal and split it into issues

```text
/brief per-source rate limits
```

- **Frames** the goal: what "done" is, as a check, and what is out of scope.
  Work one pull request can do is sent back to the normal loop, once the
  interview has drawn the scope.
- **Interviews you** while the goal is unclear: one question at a time, each
  with a recommended answer, only about what the code and the docs cannot
  answer, until "done" is a check and the scope is drawn. Then it judges the
  size, with that scope. Later it asks again only about a choice that is
  yours. When you are away (a scheduled run, or you said you would check
  back), it takes its recommended answers, marks them as assumed, and lists
  them for you in the plan's pull request, or in the draft issue when the
  goal fits one pull request.
- **Grounds** it in the invariants, the recorded decisions, the lessons and
  the code, and settles the unknowns that would change the shape with
  probes, not arguments.
- **Sketches** at least two shapes that differ in structure, as code on
  scratch branches the type check reads, after writing how the result will
  be used. It compares them on one owner per piece of state, what a caller
  must know, how each fails and is verified, the invariants, and the
  one-way doors.
- **Has it challenged** by a separate agent with no context, which reports
  only what it proves. Three rounds at most, then you decide.
- **Records** the decision, with the chosen types as the contract and the
  signs that would mean the shape is wrong.
- **Splits** it into `docs/plans/<slug>.yaml`: one concern per issue, riskiest
  first, the contract early, acceptance criteria that are checks.
  `scripts/check-plan.mjs` checks the plan's form and prints the order to
  create the issues in; the comment at its top says what it checks and what
  it does not.
- **Ends with** a pull request for you. After you merge it, and only when you
  ask, it creates the issues, without the agent label: you label the ones
  the agent may do.

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

**Three rounds, then the owner decided.** The pull request that rewrote
this repository ([#18](https://github.com/daiyanze/Onus/pull/18)) was
reviewed three times. Each round asked for changes, each for a narrower
problem: a script that did nothing when reached through a link;
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
merged without a readable review on the PR. `cross-examine` now names the
exact posting command (`-F body=@file`) and reads the comment back.
([#177](https://github.com/daiyanze/breaker-delta/pull/177#issuecomment-7061908475),
[#178](https://github.com/daiyanze/breaker-delta/pull/178#issuecomment-7062356065),
[#179](https://github.com/daiyanze/breaker-delta/pull/179#issuecomment-7062784471),
[#181](https://github.com/daiyanze/breaker-delta/pull/181#issuecomment-7063079058))

## 🛡️ What it does not do

- It does not merge unless you grant it for one long run. It does not
  delete, and it deploys only through a merge your grant allowed to deploy.
  The rest stays with the owner.
- It does not enforce itself with code. The skills are instructions; what
  holds them in place is your check command, your branch rules, and the fact
  that only you merge, or grant merging. No branch rule can read a review
  verdict, so a granted merge rests on the agent following `docket`. Say in
  `AGENTS.md` what your branch rules really require.
- It does not replace your tests or CI. It uses them.
- It is not proven across models or teams. One project, one model family so
  far.

## 📏 Bench

[`bench/`](bench/README.md) runs the same small tasks with no method, with
this version and with an earlier one, on Claude Code, Codex and Pi, and
records each trial's result and token use. Three checkpoints, each testing
one claim: a bug that only shows on the running server, a PR with two
planted bugs, and the same PR without them. Graders check what happened, not
what the agent reports. Results: [`bench/RESULTS.md`](bench/RESULTS.md).

```sh
node bench/run.mjs --runtime claude --arms none,onus,onus@<previous tag> --trials 3
node bench/report.mjs
```

## Versions

The release version is written in two places that must agree:
`package.json` and `.claude-plugin/plugin.json`. `npm run check` fails when
they differ. Skills carry no version of their own. A skill's wording is
named by its content hash, `tr -d '\r' < SKILL.md | git hash-object
--stdin`, run in the skill's folder. Stripping `\r` gives the committed hash
on any line endings. The hash changes with every edit, needs no bump, and
travels with the file; `git log --all --find-object=<hash>` finds the
commit that had it. A petition cites that hash.

## 🗺️ Next

- Bench results for this version on all three runtimes, then a tag.
- `clerk` (watch a PR through CI and review), `recess` (pause safely),
  `precedent` (find repeated mistakes in the history and turn them into
  checks), `debrief` (propose skill edits after a run).

## Sources

- [Andrej Karpathy's coding observations](https://x.com/karpathy/status/2015883857489522876)
  and the [community Skill](https://github.com/multica-ai/andrej-karpathy-skills):
  the four principles.
- Anthropic's Claude Code best practices and its `code-review` plugin:
  explore, plan, code, commit; evidence over claims; independent finders,
  then validation of every finding.
- [pstack](https://github.com/cursor/plugins/tree/main/pstack) by poteto:
  verify on the real surface, playbooks per kind of work, exit conditions
  for long runs, a rule for each mistake and what enforces it. `brief`
  takes its ideas from pstack's `architect`, `interrogate` and
  `figure-it-out`: usage before types, at least two structurally different
  shapes, adversaries that must prove what they find, riskiest work first,
  and abandoning a shape that keeps needing workarounds. Merging under a
  grant in `docket` follows pstack's `autopilot-full`: the operator's go
  covers only the run's own PRs, green CI on each new head, an independent
  verdict, and a check against the base branch right before merging.
- Matt Pocock's [`grill-me`](https://github.com/mattpocock/skills) and the
  `grilling` skill it now hands off to: `brief`'s interview takes from them
  a recommended answer with each question, so a yes settles it, walking the
  choices in the order they depend on each other, and looking in the code
  before asking. Asking one question at a time is `brief`'s own choice.
- Marcos Hernanz's AGENTS.md rules, shared on X in August 2026 (copied
  in [this gist](https://gist.github.com/gulbaki/792d7430b3f0295b4bb43454a35ffbca)):
  check what the dependencies already do before adding a package, prefer
  maintained libraries, follow how mature products solve the problem, grow
  from a version that works end to end, and, as an opt-in rule while
  nothing outside depends on the code, no backward compatibility.
- [Agent Skills specification](https://agentskills.io/specification): the
  portable skill format.
- The earlier design in this repository's history (as Surgical Dev): a
  verdict per acceptance criterion, a verdict bound to one commit, and
  budgets for unattended work.
