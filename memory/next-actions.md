---
id: next-actions
scope: planning
priority: high
tags:
  - next-gates
  - cursor-safe
  - codex-only
last_verified: 2026-06-05
read_for:
  - choosing the next implementation slice
  - planning Cursor fallback work
  - preparing handoffs
---

# Next Actions

## Next Safe Gates

- Review and merge the Cursor fallback UI branch after fixes and Codex review.
- Continue C-5 only after C-4 is committed and reviewed.
- Plan the Storage upload policy/mechanism before live staging activation.

## Cursor-Safe Tasks

- Local demo UI/accessibility refinements.
- Pure local-demo helpers and tests.
- Local-only feedback UI.
- ZINE preview/readability improvements.
- Fixtures and non-secret regression tests.
- Owner docs, runbooks, and handoff cleanup.

## Codex-Only Tasks

- Auth, RLS, Storage policy, RPC, migration, shared-beta route security, and
  server adapter work.
- Real Supabase connection or staging activation.
- Env, secrets, deploy, production, or shared mode decisions.
- Main merge/push decisions.
