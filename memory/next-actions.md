---
id: next-actions
scope: planning
priority: high
tags:
  - next-gates
  - cursor-safe
  - codex-only
last_verified: 2026-06-16
read_for:
  - choosing the next implementation slice
  - planning Cursor fallback work
  - preparing handoffs
---

# Next Actions

## 30-Day Operating Focus

Do not add new AI roles, new memory systems, new external tools, or new product
features during this window unless they directly unblock one of these tracks.

## Track A: User Learning

Goal: prove whether the theme -> post -> ZINE -> return loop matters to real
people before expanding the technical surface.

- Use the browser-local demo and friend-facing docs only.
- Invite 3-5 trusted people after the owner approves the wording.
- Observe whether they can understand Mewri in one sentence, complete one
  post/ZINE loop, and say whether they would return for another theme.
- Success signals before broader beta: 2 people want to try it, 1 person
  completes the loop, and at least 1 person can explain Mewri simply.
- If friends say they cannot judge without real shared posts or a jointly
  completed ZINE, treat that as evidence for the next closed shared beta gate,
  not as a reason to keep polishing local-only UI indefinitely.
- Cursor may help with local-demo UI, copy, observation notes, and friend docs.

## Track B: Shared Beta Safety

Goal: complete only the minimum C-8e live staging upload-broker verification
needed to prove the closed shared beta path can work safely.

- Next Red gate: C-8e live staging upload-broker verification.
- Stop before real credentials, env values, live Supabase requests, shared mode,
  migrations, deploy, production, or beta-user communication unless the owner
  explicitly approves the exact C-8e approval text.
- Codex owns auth, RLS, Storage, RPC, migration, route security, staging
  activation, and final review.

## Approval Cards Only

For the next 30 days, keep human approval to these four categories:

- staging credential/env approval;
- migration approval;
- shared mode activation approval;
- real user invitation approval.

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
