---
id: memory-index
scope: repo-memory
priority: high
tags:
  - memory
  - ai-context
  - docs
last_verified: 2026-06-05
read_for:
  - choosing project memory for Codex, Cursor, or ChatGPT
  - understanding which memory files are canonical
---

# Mewri Memory Pack

This directory is the canonical repository-local memory pack for Mewri.
It is a compact, reviewed layer for durable context that AI tools can inject
selectively before work.

Do not inject every memory file by default. Select only the files relevant to
the task, then confirm critical or stale claims against current repo docs before
security-sensitive work.

## Files

- `project-core.md`: product loop, positioning, and AI role.
- `current-status.md`: current default mode, shared-beta status, and worktrees.
- `safety-constraints.md`: hard stops, forbidden surfaces, and fallback safety.
- `shared-beta-gate.md`: fail-closed staging route and activation blockers.
- `codex-cursor-protocol.md`: normal, parallel, and fallback AI routing.
- `architecture-index.md`: repository map.
- `next-actions.md`: next safe gates and task ownership.

## Rules

- `memory/` is canonical for this memory pack.
- Obsidian may become an optional human editing UI later; it is not canonical.
- Mem0 may become an optional AI-search index later; it is not present now.
- Archived or stale memory must not be injected into security-sensitive prompts.
