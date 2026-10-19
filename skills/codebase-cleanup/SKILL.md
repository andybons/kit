---
name: codebase-cleanup
description: Use when a codebase has drifted after weeks of agent work and shows no overall design, piles of tests, comment bloat, dead code, or growing complexity. Also use when setting up or running a recurring maintenance pass that keeps a repo in shape.
---

# Codebase cleanup

Agent work optimizes each diff, so a repo drifts toward local maxima: a second copy of a fact, a test per edit, a comment per line. Do mode 1 by hand, once. Run mode 2 on a schedule.

Read the repo's AGENTS.md or CLAUDE.md first; its limits, tools, and tracking win. Map each limit to the repo's own tool and do not hand-roll a checker: `references/limits-and-tools.md`.

## Mode 1: initial cleanup

Work in this order. Land each step as its own change. The spec binds: keep current behavior and simplify structure, not behavior. A behavior change needs a recorded decision.

1. **Architecture.** Run `architecture-review` on the whole tree, not a diff. Record the target design in the repo's docs. Fix boundaries before comments and tests.
2. **Tests.** Measure first: speed, coverage of branches and rules (not glue or markup), and duplication. Delete or merge what the measurement names, keeping the fastest honest cover. Prefer contract tests. Delete a test that a contract scenario covers. Never weaken an assertion, delete a case, or edit a test to make a change pass; fix the code.
3. **Comments and dead code.** One area at a time. Zero comments by default; state why, never what. Keep only a constraint, a hazard, a rejected alternative, or a non-obvious why. Added comment lines stay under one third of added code lines. Delete history (dates, incidents, PR or issue numbers, names, a doc path cited to justify the code, "no longer", "now", "instead of"). Docs state facts: no attribution, names, dates, or PR or issue numbers. Delete dead code; never comment it out. Check callers, config, and reflection first.
4. **Limits.** Install the ratchet last, once the tree is cleaner: new files meet the limits, touched files do not get worse, and an exceptions file lists each over-limit file with a reason and can only shrink.

## Mode 2: maintenance loop

A scheduled agent runs one bounded pass with the prompt in `references/maintenance-loop.md`. It reads memory (shared memory and the repo's tracking; no new tracking file), runs the limit tools (fixing a failure first), finds drift the tools miss, and fixes a bounded amount within the open-PR cap. A fresh reviewer subagent checks each change. It merges when the reviewer approves and CI is green, flags a risky change for a human (any deleted assertion, including a whole covered test, is risky), and records the result where it read.

## Rules for every deletion

- An independent reviewer checks every deleted comment and test against the old text, per change. The author's own check does not count, and a missing verdict is not approval.
- List every rule in the old text before rewording it. A reword that drops a rule is a regression.
- Edit by hand. A scripted deletion or a mechanical rewrap is banned: it loses constraints that sit among the noise.

## Red flags

- "The repo is small, skip the reviewer."
- "I will write a guard script." Use the repo's tools.
- A limit that fails every existing file on day one. Ratchet against the merge base.
- Merging with no reviewer, no CI, or a new notes file for the next run.
- A followup: do it now or drop it. Loop state (the next area) is not a followup.
- A time estimate. Report milestones.
- Looping on review. Fix real defects. After one or two rounds, decline rare edge cases and nitpicks with a reason.
