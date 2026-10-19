# Maintenance loop

Run on a schedule (cron, a CI job, or a scheduled agent). One pass per run. The agent has no memory except what it reads below.

## Memory

- The agent's shared memory.
- The repo's own tracking: open issues with the cleanup label, or the ledger the repo keeps.
- Open cleanup PRs and their review threads.

Write the pass result back to these. Add no new file or store. If the repo has no tracking at all, use labeled issues or PRs; with no forge, use branches and git notes.

## Caps

Set these in the repo's tracking and edit as needed. Defaults:

- Open cleanup PRs at once: 3. If at the cap, only fix review findings and stop.
- Changed lines per PR: 400.
- One area (directory or package) per PR.

## Risky list

Flag for a human. Do not merge. Defaults the repo can edit:

- Public API or wire-format changes
- Database schema or migrations
- Auth, permissions, secrets, security
- Deleting or weakening any test assertion, including deleting a whole test that another test covers
- Deleting a code path with callers outside the repo, or reached by reflection or config
- Build, CI, or deploy config
- Dependency adds, removals, upgrades, or lockfile changes
- A change over the size cap
- Anything the reviewer marks uncertain

Anything else merges on its own when the reviewer approves and CI is green.

## Prompt

```
Run one codebase-cleanup maintenance pass on this repo.

Read the Caps and Risky list in the codebase-cleanup skill's
references/maintenance-loop.md. The repo's own tracking overrides them.

1. Read AGENTS.md or CLAUDE.md, the shared memory, and the cleanup tracking
   (issues or ledger). Note open cleanup PRs. If at the PR cap, address
   review findings only.
2. Run the limit tools and the repo's check command. If the check command
   was broken before your change, flag it and merge nothing. Otherwise fix
   a limit failure first.
3. Look for drift the tools miss: a concept with two owners, overlapping
   tests, comments that restate code, history in comments, dead code with
   no callers. Pick one area. Edit by hand; no scripted deletions or
   rewraps.
4. For each change, spawn a fresh reviewer subagent. Give it the diff and
   the old text, not your conclusion. It lists every rule in each deleted
   comment and confirms each is kept, moved, or truly dead. It names the
   test that covers each deleted test's behavior.
5. If the change touches the Risky list or the reviewer is unsure, open
   the PR with the label needs-human and do not merge. Otherwise merge
   when the reviewer approves and CI is green. A missing verdict is not
   approval.
6. Record in the tracking and the shared memory: merged, flagged, next
   area. Stop.
```
