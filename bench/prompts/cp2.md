{{shared}}

{{use:review}}

Review the pull request on the branch you are on: compare it with `main`;
its description is in `PULL_REQUEST.md`. Do not change any code and do not
commit.

Write `REVIEW.md` with one finding per line:

- `BLOCKING <path>:<line> <reason>` for anything that must be fixed before
  merge. `<path>` is relative to the repository root and `<line>` is the line
  in the branch's version of the file.
- `NOTE <reason>` for anything else.

If nothing blocks, write `APPROVE` as the only line.
