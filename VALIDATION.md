# Validation

What has been tried, where, and what has not. Written 2026-11-23, when the
method was extracted from
[Breaker Delta](https://github.com/daiyanze/breaker-delta) at commit
`b0646ce` (branch `develop`). The numbers below are a count at that commit,
not a standing claim.

## Where the evidence comes from

Breaker Delta used the method from 2026-11-21 to 2026-11-23, with Claude
models as both writer and reviewer, working through GitHub pull requests
that the owner merged.

| What | Observed |
| --- | --- |
| Pull requests reviewed by an independent agent before merge | 23 (#176 and #182 to #203) |
| First verdict | 6 request changes, 16 approve with nits, 1 approve |
| After the writer's fixes | all 6 approved on the second review |
| Lessons recorded | 16; 5 of them name a check that now enforces them |
| Lessons that repeated although written down | at least 2 (a check claimed to cover more than it did; a format read with hand-written rules instead of its parser). Both were caught by the review. The second became a check; the first ended as narrower wording and a review checklist item |
| Reviews lost when posting | 4 (#177, #178, #179, #181): the comment holds a file name instead of the review, because `gh api -f body=@file` does not read files. They are not in the 23 |

How to recount: the review comments start with `_Review by an independent`
and carry a `**Verdict:**` line; the lessons are `docs/lessons.md` in that
repository.

What this supports: an independent review that must prove its findings does
find real problems in an agent's own pull requests, and written lessons
alone did not stop repeats. What it does not support: any claim about
speed, cost, other models, other teams, or how often the review misses
something. Nobody measured missed defects.

## Status of each part

| Part | In Breaker Delta | In this repository's wording |
| --- | --- | --- |
| The loop, PR format, lessons rules (`docs/development.md`) | Used on the pull requests above | Reworded to remove project names. Not run since rewording |
| `pr-review` (named `review` there) | Used 29 times on 23 pull requests | Generalized, and run once: on this repository's pull request #18, where it asked for changes. Nine places where it was hard to follow were fixed in that pull request; the fixed text has not been run |
| `pr-review`: a line per acceptance criterion | Not in use | New here. Run once (#18) |
| `pr-review`: a verdict covers one commit; later commits need a re-review unless they only fix its notes | Practised without being written down: 20 of the 23 pull requests were merged at a later commit than the reviewed one | New wording. Never run as a rule |
| `pr-review`: the exact posting command, and reading the comment back | Not in use; four reviews were lost without it | New here. Never run |
| `next` | Written and available; how often it was invoked was not counted | Dependency and milestone rules simplified. Not run since |
| `long-run` | Written, **never run**. It already parks an issue after three review rounds | Same, plus parking after three failed fixes of the same check. **Never run** |
| `adopt` | Done by hand, over several pull requests | New skill. Steps 1 to 5 were dry-run in two scratch repositories by the reviewer of #18; seven unclear steps were fixed. **Never run on a real repository** |
| `make-verify-skill` | One verify skill built by hand (`verify-local`) and exercised in CI | New skill. **Never run** |
| `check-agent-files.mjs` | A Bun and TypeScript version runs in CI as a test | Ported to plain JavaScript for Bun and Node, with a command line. Its tests, including the command line, pass on both here |
| Claude Code finds the rules and skills | Observed in sessions | Same layout |
| Pi and Codex find the rules and skills | **Not confirmed on a machine.** Rests on their documentation and on reading Pi's source. Pi loads project skills only in a trusted project | Same |
| Second-model review | Written, never done | Same |
| Installing with `npx skills add` | Not used | **Not tried** |

## Reproduce the checks in this repository

```bash
npm install          # one dev dependency: yaml
npm test             # the check script's tests, on Node
npm run check        # this repository's own skills pass the check
bun test skills/adopt/templates/scripts/   # the same tests on Bun, no dependency
```

## Limits

- One project, one owner, one model family, three days.
- The generalized skills have not been run in any repository yet. The first
  adoption outside Breaker Delta is the next test, and its findings belong
  in this file.
- The skills are instructions. Nothing here stops an agent that ignores
  them; a project's check command, branch rules and the owner's merge do.
