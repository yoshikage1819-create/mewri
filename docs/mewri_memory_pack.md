# Mewri Memory Pack

Updated: 2026-06-05

## Purpose

The repository-local `memory/` pack is a compact durable context layer for
Codex, Cursor, and ChatGPT. It reduces the need to paste long handoff history
when a task only needs a few stable project facts.

This is Phase 1 only: repo memory files and documentation. It does not add
Mem0 integration, Obsidian sync, selector tooling, runtime code, app behavior,
Supabase wiring, migrations, env values, deployment, or production changes.

## Canonical Source

`memory/` is canonical for the memory pack. Keep memory short, reviewed, and
high-signal. Long project history belongs in the handoff and source docs, not in
memory files.

Obsidian may later be used as an optional human editing UI, but it is not the
source of truth. Mem0 may later be used as an optional AI-search index, but it
is not introduced in this phase and must not be treated as authoritative.

## How To Select Memory

Before large AI-assisted work:

1. Identify the task surface: product, status, safety, shared beta, agent
   protocol, architecture, or next planning.
2. Read only the matching `memory/*.md` files.
3. For security-sensitive work, check critical memory against `AGENTS.md`,
   `docs/mewri_chatgpt_handoff_current.md`, and the relevant source-of-truth
   docs before acting.
4. Keep prompts narrow. Do not inject all memory files by default.

Suggested selection:

- Product, UX, or copy: `project-core.md`
- Starting a work session: `current-status.md`
- Security, env, Supabase, deploy, or fallback safety:
  `safety-constraints.md`
- Shared-beta route, staging, Storage, RPC, or migration planning:
  `shared-beta-gate.md`
- Codex/Cursor/ChatGPT coordination: `codex-cursor-protocol.md`
- File ownership and repo map: `architecture-index.md`
- Choosing the next slice: `next-actions.md`

## Stale-Memory Risk

Memory files are durable summaries, not live truth. The `last_verified` field is
a review signal, not proof that nothing changed later.

Critical memory covers hard stops, shared-beta gates, security boundaries, and
agent routing. Before auth, RLS, Storage, RPC, migration, env, production,
deployment, or shared mode work, verify critical memory against current repo
docs and the uncommitted diff.

Archived or stale memory must not be injected into security-sensitive prompts.
