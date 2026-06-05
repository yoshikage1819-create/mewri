---
id: codex-cursor-protocol
scope: ai-workflow
priority: high
tags:
  - codex
  - cursor
  - chatgpt
  - fallback
last_verified: 2026-06-05
read_for:
  - coordinating AI agents
  - planning parallel work
  - Codex usage exhaustion fallback
---

# Codex / Cursor / ChatGPT Protocol

## Normal Mode

- Codex app is the command center for product judgment, priority, and compact
  CLI prompts.
- Codex CLI is the default implementer, validator, and diff reviewer.
- Cursor may help with exploration, UI/docs drafts, and low-risk navigation.

## Parallel Mode

- Codex owns security-sensitive, shared-beta, Supabase, API, persistence, and
  review-heavy work.
- Cursor may work only on clearly separated low-risk slices, especially local
  demo UI/accessibility, docs/runbooks, fixtures, and handoff cleanup.
- Do not have Codex and Cursor edit the same working tree or same files at the
  same time.

## Fallback Mode

Fallback means Codex CLI and Codex app are unavailable until reset.

- Cursor is the implementer, but only in the dedicated Cursor worktree and only
  for Cursor-safe tasks.
- ChatGPT is the command center for task choice, short non-secret log
  interpretation, Cursor prompt rewriting, and handoff formatting.
- Codex CLI/app are 0% until reset.

Cursor cannot merge or push `main`. Cursor must stop and queue work for Codex if
it reaches auth, RLS, Storage, RPC, migrations, shared mode, production, deploy,
secrets, or security-sensitive API/server paths.
