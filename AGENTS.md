# Mewri Agent Guide

This repository is Mewri, a group-first photo product in which daily themes
lead to posts and a multi-day generated ZINE. AI assists the experience; it
does not replace participant meaning or ownership.

## Start Here

Before meaningful work:

1. Read `docs/README.md` to identify the active source-of-truth document.
2. Read `docs/mewri_chatgpt_handoff_current.md` for current implementation
   status and uncommitted work.
3. Read `docs/mewri_requirements_definition_v0_3.md` and
   `docs/mewri_decision_log.md` before changing product direction.
4. Read `docs/mewri_repository_contract_v0_4.md` before changing persistence
   or service behavior.
5. Read `docs/mewri_ai_workbench_setup.md` for Codex/Cline operating boundaries
   when coordinating agents or planning growth work.
6. Run `git status --short --branch` and preserve unrelated user changes.

## Current Boundary

- Working product: browser-local v0.9 demo using `localStorage`.
- In progress: v0.10 closed shared beta foundation for invited small groups.
- Supabase migration and runtime selector are preparation, not a live backend.
- Do not enable shared mode until authenticated server operations and a real
  adapter exist and authorization has been verified.

## Product Invariants

- Protect the core loop: today's theme -> post -> ZINE contribution -> read
  the generated ZINE.
- Start from invited small groups; do not expand public social scope before
  validating shared ZINE creation.
- Keep local demo behavior functional while shared beta is unfinished.
- Keep AI assistive: theme/title/layout/intro suggestions are acceptable;
  participants' photographs and participation remain the value.

## Architecture And Security

- Keep domain logic in `packages/core`.
- Keep persistence and application-service boundaries in `packages/data`.
- Do not query Supabase directly from UI components in `apps/web`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or add a `NEXT_PUBLIC_` form of it.
- Shared images must use private storage, not data URLs.
- Shared reads and writes require authenticated membership checks and RLS.
- Treat SQL/RLS/auth/storage changes as security-sensitive changes requiring
  focused tests and explicit review.

## Working Method

- For a small isolated fix, implement and verify directly.
- For a new feature, data model change, security change, deployment change, or
  growth experiment, start with a short plan: hypothesis, scope, non-goals,
  acceptance checks, security/privacy impact, and rollback.
- Implement one verifiable slice at a time. Do not silently broaden scope.
- Update the handoff or decision documentation when implementation status or a
  lasting product decision changes.

## Codex Execution Loop

- Define each CLI implementation slice with `Goal`, `Context`, `Constraints`,
  and `Done when`; keep durable repository rules in this file and the Skill.
- Inspect relevant files and existing changes before editing; do not implement
  from assumptions about route, auth, persistence, or UI behavior.
- Use the loop `implement -> run validators -> review diff -> repair ->
  validate again` until the selected slice is clean.
- For auth, RLS, storage, migration, secrets, server routes, or shared-data
  changes, run a distinct Codex review pass over the uncommitted diff before
  staging, migration application, or deployment.
- Add durable guidance only for repeated failure modes; do not grow agent
  instructions from one-off preferences.

## Agent Routing

- Use Codex CLI as the primary implementer and verifier for application code,
  multi-file slices, auth, SQL/RLS/storage, and security review.
- On this Windows machine invoke Codex as `codex.cmd`; plain `codex` resolves
  to a PowerShell shim blocked by the local execution policy.
- Use Cline in VS Code for plan exploration, repository navigation, UI/docs
  drafts, and narrowly scoped low-risk changes.
- Prefer Cline's `OpenAI Codex` provider when it is available through the
  user's eligible ChatGPT access. If using a Cline Provider model tagged
  `FREE`, limit it to non-sensitive exploration and small reversible changes.
- Do not use a free cloud model as the sole reviewer for auth, membership,
  RLS, storage policy, secret handling, deployment, or migration decisions.
- Do not have Cline and Codex edit the same working tree concurrently. Finish
  or review one slice, then hand it to the other agent with the diff and test
  results.
- If Codex usage is exhausted, Cursor may continue only in the dedicated
  Cursor worktree/branch with low-risk UI, docs, tests, and handoff work.
  Cursor must not merge to `main`, enable shared mode, apply migrations,
  touch production, handle secrets, deploy, or make security-sensitive
  decisions while waiting for Codex usage to reset. Queue those items for
  Codex review.

## Verification

Use Windows-compatible commands in this environment:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

For UI changes, also inspect at mobile and desktop widths. For data/security
changes, add tests for rejected unauthorized access before any beta rollout.
For security-sensitive Codex CLI slices, record the independent review result
alongside validator results in the current handoff document.

## Paths

```text
apps/web       Next.js UI and web runtime
packages/core  Domain models and pure product logic
packages/data  Repository/service/runtime boundaries
supabase       Shared beta migration drafts
docs           Product decisions, plans, and handoff notes
```
