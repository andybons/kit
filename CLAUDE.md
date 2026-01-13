# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a kit repository containing reusable AI assistant extensions: skills, hooks, and other plugins that can be used across different AI assistants and tools.

## Structure

- `skills/` - Skill definitions that teach AI assistants specialized capabilities
  - Each skill lives in its own folder named after the skill (e.g., `skills/product-thinking/`)
  - `SKILL.md` - Main skill file with YAML frontmatter (`name`, `description`) and instructions
  - `references/` - Supporting documentation the skill references

## Skill File Format

Skills use YAML frontmatter:
```yaml
---
name: skill-name
description: Brief description of when and how to use this skill
---
```

The body contains instructions, workflows, templates, and references to supporting files in the `references/` subdirectory.

## Git Conventions

- Use conventional commits (e.g., `feat:`, `fix:`, `docs:`, `chore:`)
- Never include Co-Authored-By trailers
