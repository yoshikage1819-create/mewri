---
id: architecture-index
scope: architecture
priority: medium
tags:
  - architecture
  - repo-map
last_verified: 2026-06-05
read_for:
  - locating files
  - scoping implementation
  - avoiding wrong ownership boundaries
---

# Architecture Index

```text
apps/web       Next.js UI and web runtime
packages/core  Domain models and pure product logic
packages/data  Repository, service, runtime, and shared-beta boundaries
supabase       Shared beta migration drafts and SQL/RLS/Storage contracts
docs           Product decisions, plans, runbooks, and handoff notes
memory         Canonical compact AI memory pack
```

Boundary rules:

- UI components should not query Supabase directly.
- Persistence and application-service behavior should route through
  `packages/data`.
- Shared-beta SQL/RLS/Storage/API changes are security-sensitive.
- Docs and memory changes should stay compact and should not replace source
  implementation review.
