# kit

A kit for AI agents.

## Installation

```bash
npx add-skill andybons/kit
```

Or using Claude Code commands:

```bash
claude /install https://github.com/andybons/kit.git
```

## Skills

### product-thinking

Strategic product thinking framework combining the Minto Pyramid Principle with Clayton Christensen's Jobs-to-be-Done theory.

Use for:
- Evaluating product ideas
- Structuring PRDs/briefs
- Conducting discovery interviews
- Refining product strategy

### ui

Opinionated constraints for building better interfaces with agents. Covers Tailwind CSS, accessible components, animations, typography, and performance.

By [ibelick](https://github.com/ibelick) · [ui-skills.com](https://www.ui-skills.com)

### visual-hierarchy

Visual hierarchy principles for UX design based on Nielsen Norman Group research. Covers color/contrast, scale, and grouping methods to guide user attention.

Use for:
- Organizing UI elements by importance
- Improving visual prominence and contrast
- Applying the squint test to validate hierarchy

Source: [Nielsen Norman Group](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)

### go-guide

Go code and API rules, one line each with its source: layout, naming, API design, errors, concurrency, testing, and comments.

### architecture-review

Whole-system review of a change: spec divergence, contracts, ownership, parity, structure, tests, docs, and proportion. Pairs with go-guide.

## Mods

### inflight

A Claude Code mod that opens a pane of what is in flight: subagents (running, waiting or paused, failed), your open PRs with CI state and auto-merge, `deploy.yml` and `roll-golden-warmpool.yml` runs that are running or failed in the last 6 hours, and background shell tasks. It polls `gh` read-only every 45 seconds. Requires Claude Code 2.1.287 or later and an authenticated `gh`.

Install:

```
/plugin install inflight --marketplace andybons/kit
```

Open the pane with `/inflight`. It also opens by itself in a terminal 144 columns wide or more. Below that width, run `/inflight`; the pane then sits above the prompt. Set the repositories in `/config` (`repos`, default `meetneptune/boxes,majorcontext/harness`; `deploy_repo`, default `meetneptune/boxes`).
