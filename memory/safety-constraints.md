---
id: safety-constraints
scope: safety
priority: critical
tags:
  - hard-stops
  - security
  - shared-beta
  - fallback
last_verified: 2026-06-05
read_for:
  - security-sensitive work
  - Supabase, auth, RLS, Storage, API, env, or deployment work
  - Cursor or ChatGPT fallback routing
---

# Safety Constraints

Critical memory. Verify against `AGENTS.md`, the current handoff, and the
shared-beta docs before security-sensitive work.

## Hard Stops

- No production changes.
- No deploy.
- No `service_role` key use, exposure, or documentation.
- No env or secret changes.
- No migration apply without explicit human approval.
- No `MEWRI_RUNTIME_MODE=shared_beta` without explicit approval.
- No real Supabase connection unless explicitly approved.

## Cursor Forbidden Surfaces

During fallback or low-risk parallel work, Cursor must not edit:

- `supabase/**`
- `apps/web/src/app/api/**`
- shared-beta auth, RLS, Storage, RPC, runtime, or security code in
  `packages/data/**`
- secrets, env, deploy, production, migrations, staging activation, or main
  merge/push paths

Cursor cannot merge or push `main`.

## ChatGPT Fallback Safety

ChatGPT may act as command center only: choose safe tasks, rewrite Cursor
prompts, interpret short non-secret validation logs, and format handoffs.

ChatGPT is not a code executor, not a substitute for Codex review, and must not
approve auth/RLS/Storage/migration/API-security work as merge-ready.

Archived or stale memory must not be injected into security-sensitive prompts.
