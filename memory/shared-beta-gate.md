---
id: shared-beta-gate
scope: shared-beta
priority: critical
tags:
  - shared-beta
  - staging
  - fail-closed
  - supabase
last_verified: 2026-06-05
read_for:
  - shared-beta route work
  - staging activation planning
  - auth, RLS, Storage, RPC, or migration review
---

# Shared Beta Gate

Critical memory. The staging shared-beta route remains fail-closed by default.

Real staging activation still needs:

- an approved trusted authorization source for member/group/theme checks
- an approved Storage upload mechanism and policy
- reviewed staging-only adapter wiring
- explicit human approval before any live connection or mode change

Auth, RLS, Storage, RPC, migration, shared-data route, and server adapter work
requires Codex implementation or Codex review. Cursor and ChatGPT fallback work
must stop before these surfaces.

Do not enable `MEWRI_RUNTIME_MODE=shared_beta` or connect to real Supabase from
memory alone.
