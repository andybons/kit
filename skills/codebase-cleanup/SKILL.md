---
name: codebase-cleanup
description: Use when a codebase has drifted after weeks of agent work and shows no overall design, piles of tests, comment bloat, dead code, or growing complexity. Also use when setting up or running a recurring maintenance pass that keeps a repo in shape. Language-agnostic.
---

# Codebase cleanup

Agent work optimizes each diff, so a repo drifts toward local maxima: a second copy of a fact, a test per edit, a comment per line. Do mode 1 by hand, once. Run mode 2 on a schedule.

Read the repo's AGENTS.md or CLAUDE.md first; its limits, tools, and tracking win. Map each limit to the repo's own tool and do not hand-roll a checker: `references/limits-and-tools.md`.

## Mode 1: initial cleanup

Work in this order. Land each step as its own change.

1. **Architecture.** Run `architecture-review` on the whole tree, not a diff. Record the target design in the repo's docs. Fix boundaries before comments and tests.
2. **Tests.** Measure first: speed, coverage of branches and rules (not glue or markup), and duplication. Delete or merge what the measurement names. Keep the fastest honest cover; a contract test is one tool, not a mandate.
3. **Comments and dead code.** One area at a time. Zero comments by default. Keep only a constraint, a hazard, a rejected alternative, or a non-obvious why. Delete history (dates, incidents, PR numbers, names, "no longer", "now", "instead of"). Remove dead code the tool names after checking callers, config, and reflection.
4. **Limits.** Install the ratchet last, once the tree is cleaner: new files meet the limits, touched files do not get worse, and an exceptions file lists each over-limit file with a reason and can only shrink.

## Mode 2: maintenance loop

A scheduled agent runs one bounded pass, using the prompt in `references/maintenance-loop.md`:

1. Read memory: the shared memory and the repo's tracking (issues, ledger). Create no new tracking file.
2. Run the limit tools. Fix a failure first.
3. Find drift the tools miss: two owners of one concept, overlapping tests, a comment that restates its line.
4. Fix a bounded amount, within the open-PR cap.
5. A fresh reviewer subagent checks each change. Merge when it approves and CI is green. Flag a risky change for a human.
6. Record the result where step 1 read.

## Rules for every deletion

- An independent reviewer checks every deleted comment and test against the old text, per change. The author's own check does not count, and no verdict is not approval.
- List every rule in the old text before rewording it. A reword that drops a rule is a regression.
- Edit by hand. A scripted deletion or a mechanical rewrap is banned: it loses constraints that sit among the noise.

## Red flags

- "The repo is small, skip the reviewer."
- "I will write a guard script." Use the repo's tools.
- A limit that fails every existing file on day one. Ratchet against the merge base.
- Merging with no reviewer, no CI, or a new notes file for the next run.
