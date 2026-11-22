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
| Lessons that repeated although written down | at least 2 (a check claimed to cover more than it did; a format read with hand-written rules instead of its parser). Both were caught by the review and then turned into checks |

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
| `review` | Used 29 times on 23 pull requests | Generalized: the project checklist moved to `docs/development.md`. Not run since |
| `review`: a line per acceptance criterion | Not in use | New here. Never run |
| `review`: a verdict covers one commit; later commits need a re-review unless they only fix its notes | Practised without being written down | New wording. Never run as a rule |
| `next` | Written and available; how often it was invoked was not counted | Dependency and milestone rules simplified. Not run since |
| `long-run` | Written, **never run** | Same, plus per-issue budgets. **Never run** |
| `adopt` | Done by hand, over several pull requests | New skill. **Never run** |
| `make-verify-skill` | One verify skill built by hand (`verify-local`) and exercised in CI | New skill. **Never run** |
| `check-agent-files.mjs` | A Bun and TypeScript version runs in CI | Ported to plain JavaScript for Bun and Node. Its tests pass on both here |
| Claude Code finds the rules and skills | Observed in sessions | Same layout |
| Pi and Codex find the rules and skills | **Not confirmed on a machine.** Rests on their documentation and on reading Pi's source | Same |
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
