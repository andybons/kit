# Limits and tools

State each limit as an idea. Map it to a tool the repo already runs. Add a tool only when none covers the idea. If the repo has its own gate package or lint config, extend it.

## Limits

| Idea | Default |
|---|---|
| Comment share | Added comment lines under one third of added code lines, counted across the whole change; a change under 20 added code lines is exempt |
| File size | 800 lines |
| Function size | 80 lines |
| Test-to-code ratio | Added test lines at or below added code lines |
| History in comments | None: dates, incidents, PR or issue numbers, names, a doc path cited to justify the code, "no longer", "now", "instead of" |
| Test placement | Each test lives where the repo says tests live |
| Exceptions file | One path per line, one reason each; entries are removed, never added without a reason |
| Import boundaries | A baseline of known violations that can only shrink |
| Merge base ratchet | New files meet every limit; a touched file does not get worse |

## Tools by stack

| Idea | TypeScript | Go |
|---|---|---|
| File size | `max-lines` (oxlint, ESLint) | a repo gate test (a test that walks the tree) |
| Function size | `max-lines-per-function` | a repo gate test (a test that walks the tree) |
| Existing violations | ESLint bulk suppressions, or Betterer | exceptions file read by the gates package |
| Dead code, unused exports and dependencies | knip | `staticcheck`, `deadcode` |
| Boundaries and cycles | dependency-cruiser | gates import-direction test |
| Duplication | jscpd | `dupl` or jscpd |
| Comment share, history ban | small lint rule or repo script run by the lint command | comment lint run in CI |
| Rule has a failing test | mutate the code by hand, or Stryker | `go-mutesting`, or by hand |
| Test speed and coverage | runner timing report, coverage on changed files | `go test -race -cover`, `-json` timings |

## Ratchet

1. Record the baseline: every current violation, by file.
2. Fail a new file that breaks a limit.
3. Fail a touched file whose count of violations rose against the merge base.
4. Let a count fall. Never let it rise.
5. Delete an exceptions entry when its file meets the limit.

Count test-to-code ratio on net added lines. Match history words as phrases in comments only, and tune on the repo's own comments. Plant one violation per limit to prove the tool fires. A gate fails when its input is missing, such as an absent base ref; it never passes silently.

A limit that fails every existing file on the first run is wrong. Start with the baseline.

## Measuring tests

- Speed: list the slowest tests and total wall time. A sleep or a real network call is the first finding.
- Meaningful cover: for each rule or branch, name the test that fails when the rule breaks. Mutate the code to check. Markup and glue need no test.
- Duplication: two tests that pin one behavior at one level; a test that restates the implementation; setup larger than the code under test.
- A deletion needs a named reason: the behavior is pinned elsewhere, or the code is gone. In the maintenance loop a human approves any deleted assertion, including a whole covered test.
