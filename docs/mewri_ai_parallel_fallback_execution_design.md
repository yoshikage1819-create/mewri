# Mewri AI Parallel / Fallback Execution Design

Updated: 2026-06-03

Status: active operating design for Codex + Cursor coordination

## Purpose

This document lets Cursor continue implementation safely when Codex usage is
exhausted, and lets ChatGPT help the owner route work without treating ChatGPT
as a code executor or security reviewer. It also lets Codex app, Codex CLI, and
Cursor work without editing the same surface or weakening the closed shared beta
boundary when Codex is available.

It is not a product roadmap. It is an execution design for agent coordination
and token economy.

## Operating Modes

| Mode | Routing | Cursor role | ChatGPT role | Codex role |
| --- | --- | --- | --- | --- |
| Normal mode | Codex CLI 70-85%, Codex app 5-20%, Cursor 0-15% | Optional low-risk support | Product judgment, prompt shaping, short-log interpretation | Primary implementer, validator, reviewer |
| Parallel mode | Codex CLI 55-75%, Codex app 5-15%, Cursor 15-35% | Implements non-overlapping Cursor-safe slices | Helps split tasks and interpret short non-secret logs | Owns security-sensitive work and final review |
| Codex-token fallback mode | Cursor 80-90%, ChatGPT 10-20%, Codex CLI 0%, Codex app 0% | Primary implementer on documented safe lanes only | Command center for next-task choice, prompt rewriting, short-log interpretation, and queue upkeep | Unavailable until reset |
| Codex reset / review mode | Codex CLI returns as reviewer/merger; Cursor pauses overlapping work | Provides handoff and waits for review | Helps summarize Cursor handoffs if needed | Reviews diffs, repairs security-sensitive issues, merges/pushes only with approval |

Fallback mode means both Codex CLI and Codex app are unavailable until reset.
ChatGPT is not a code executor in this workflow. It may help the owner choose
the next Cursor-safe task, interpret short validation logs that contain no
secrets, rewrite Cursor prompts, and maintain the high-level queue. It must not
be treated as a replacement for Codex diff review on auth, RLS, Storage,
migration, API-security, secret-handling, deployment, staging activation, or
production work.

## Codex App / CLI Split

| Surface | Use | Avoid |
| --- | --- | --- |
| Codex app | Decide priority, split the next slice, interpret short logs, produce CLI prompts | Long repo-wide implementation sessions |
| Codex CLI | Implement, run validators, review actual diffs, commit/push after approval | Product strategy debates or broad planning |
| Cursor | Local-demo UI, pure local helpers, docs, fixtures, and non-security tests during fallback | Security-sensitive implementation or main merge |
| ChatGPT | Fallback command center for choosing safe Cursor tasks, rewriting prompts, and interpreting short non-secret logs | Code execution, merge approval, or security-sensitive diff review |

The more security-sensitive the slice is, the more it should move toward
Codex CLI and away from app/Cursor implementation.

## Current Worktrees

| Role | Path | Branch | Use |
| --- | --- | --- | --- |
| Codex primary | `C:\dev\mewri\ph` | `main` unless a Codex branch is created | security-sensitive implementation, final review, merge/push decisions |
| Cursor fallback | `C:\dev\mewri\ph-cursor` | `cursor/parallel-local-ui-docs` | low-risk UI/docs/tests/handoff while Codex is unavailable |

Do not edit the old OneDrive copies for active development.

## Shared Safety Rules

- Production is never touched from fallback or parallel work.
- `MEWRI_RUNTIME_MODE=shared_beta` stays off unless explicitly approved.
- No agent may request, paste, store, or log service role keys, DB passwords,
  JWT secrets, access tokens, refresh tokens, or magic link URLs.
- Supabase migrations are not applied by Cursor.
- Cursor does not merge or push to `main`.
- Cursor and Codex do not edit the same file in the same slice.
- Every slice must preserve the browser-local v0.9 demo.

## Parallel Mode

Parallel mode means Codex and Cursor are both available, but they work on
different surfaces.

### Ownership Matrix

| Surface | Codex | Cursor |
| --- | --- | --- |
| `supabase/**` | Owns | Read-only, or docs-only questions |
| `packages/data/**` shared beta/auth/storage/RPC | Owns | Read-only |
| `apps/web/src/app/api/**` | Owns | Read-only |
| auth/session/env/secrets/deploy | Owns | Stop and hand off |
| local demo UI copy/layout in `apps/web/src/app/page.tsx` and `styles.css` | Review/merge | May implement if Codex is not touching same files |
| `apps/web/src/app/local-demo-ui.ts` and tests | Review/merge | May implement pure local-demo helpers |
| local-only feedback capture UI in `apps/web/src/app/page.tsx` | Review/merge | May implement if it stores only in browser-local state |
| ZINE preview/readability UI that does not touch backend paths | Review/merge | May implement |
| fixture/test data for existing local demo behavior | Review/merge | May implement |
| docs/runbooks/onboarding | May implement/review | May implement |
| non-security tests for local demo helpers | May implement/review | May implement |

### Expanded Cursor-Safe Lanes

Cursor may own more implementation during fallback when every touched file is
inside these lanes and the task does not change shared-beta server boundaries:

- local demo copy, layout, accessibility, keyboard/focus behavior, and mobile
  readability in `apps/web/src/app/page.tsx` and `apps/web/src/app/styles.css`
- pure browser-local helper extraction and tests in
  `apps/web/src/app/local-demo-ui.ts` and matching tests
- local-only product feedback capture UI that persists only through the existing
  browser-local demo state or local component state
- ZINE preview/readability improvements that do not call APIs or change
  persistence contracts
- non-security regression tests for existing local demo behavior, copy helpers,
  and ZINE display helpers
- owner-facing setup docs, runbooks, QA checklists, and handoff cleanup

Cursor must not convert local-only UI into shared-beta behavior. Any task that
needs auth, group membership from Supabase, private Storage, RPC, RLS, an API
route, an env value, or migration work stops and becomes a Codex task.

### Cursor Hard Stops

Cursor must not edit these surfaces during fallback or parallel work:

- `supabase/**`
- `packages/data/**` files related to shared-beta auth, authorization, Storage,
  RPC, runtime, Supabase clients, repository adapters, or migrations
- `apps/web/src/app/api/**`
- `.env*`, deployment config, production config, secret docs containing real
  values, or any code path that asks for credentials
- main merge, push to `main`, production deploy, migration application, or
  participant communication

### Parallel Work Protocol

1. Both agents start by running:

```powershell
git status --short --branch
```

2. Cursor states the files it intends to touch before editing.
3. Codex states the files it intends to touch before editing.
4. If the file lists overlap, Cursor stops and asks for a new slice.
5. Cursor commits only to `cursor/*` when explicitly asked.
6. Codex reviews Cursor work before any merge to `main`.

### Cursor Parallel Prompt

```text
Use Mewri rules.

Parallel mode is active.

Goal:
Implement one low-risk local-demo UI/docs/test slice without touching Codex-owned
security surfaces.

Context:
- Cursor worktree: C:\dev\mewri\ph-cursor
- Branch: cursor/parallel-local-ui-docs
- Codex primary worktree: C:\dev\mewri\ph
- Codex may be working on shared-beta/auth/storage/API files.

Allowed:
- docs/runbooks/onboarding
- local demo copy/layout/accessibility
- local demo pure helpers and tests
- browser-local feedback capture UI
- ZINE preview/readability improvements
- non-security tests for existing local demo behavior

Forbidden:
- supabase/**
- packages/data shared-beta/auth/storage/RPC code
- apps/web/src/app/api/**
- env/secrets/deploy/production
- migrations or shared mode
- merge or push to main

Before editing:
- Run git status.
- List intended files to touch.
- Stop if any intended file overlaps with Codex work.

Done when:
- One coherent low-risk slice is complete.
- npm.cmd run typecheck, npm.cmd test, and npm.cmd run build pass, unless docs-only.
- Report changed files, validation results, risks, and Codex review needs.
```

## Codex-Token Fallback Mode

Fallback mode means Codex CLI and Codex app usage are both exhausted or
unavailable until reset. Cursor becomes the primary implementer, but only on
the Cursor-safe lanes in this document. ChatGPT acts as the owner's command
center for planning and interpretation; it does not execute code and does not
approve security-sensitive diffs as merge-ready.

Fallback routing:

```text
Cursor: 80-90%
ChatGPT: 10-20%
Codex CLI: 0% until reset
Codex app: 0% until reset
```

### How The Owner Uses ChatGPT During Fallback

- Paste Cursor handoff summaries into ChatGPT.
- Ask ChatGPT to choose the next safe Cursor task from the documented queue.
- Ask ChatGPT to rewrite the selected task as a Cursor prompt.
- Ask ChatGPT to explain validation failures only when logs are short and do
  not include secrets, tokens, env files, production data, or participant data.
- Ask ChatGPT to format a handoff for later Codex review when Cursor reaches a
  hard-stop surface.

Do not paste service role keys, DB passwords, JWT secrets, access tokens,
refresh tokens, magic links, `.env` files, production data, or real participant
private data into ChatGPT.

### Fallback Decision Tree

1. If Cursor is unsure and the issue is UI, docs, local-demo helpers, or
   local-demo tests, ask ChatGPT for task clarification or prompt rewriting.
2. If Cursor is unsure and the issue touches auth, RLS, Storage policy,
   migration, server route security, secrets, deploy, staging activation,
   production, or shared-beta backend wiring, Cursor stops and writes a handoff
   for Codex after reset.
3. If validation fails in UI, docs, local-demo helper, or local-demo test code,
   Cursor may fix and rerun validation.
4. If validation fails in shared-beta/security/backend code, Cursor stops and
   writes a handoff. ChatGPT may help format the handoff, but must not approve
   the change as merge-ready.
5. If a task requires editing a forbidden file, Cursor stops before editing and
   asks the owner to queue it for Codex reset/review mode.

### Cursor Task Queue

Cursor should choose from this queue in order unless Codex gives a more recent
task. Each slice must be one coherent change on the `cursor/*` branch, with no
overlap with Codex-owned files.

#### 1. Local Demo Feedback Capture

Goal: Add a local-only feedback note area for demo testers after they view or
generate a ZINE.

Allowed files:
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/styles.css`
- `apps/web/src/app/local-demo-ui.ts`
- `apps/web/src/app/local-demo-ui.test.ts`

Forbidden files:
- `apps/web/src/app/api/**`
- `packages/data/**`
- `supabase/**`
- `.env*`

Acceptance checks:
- Feedback is stored only in browser-local/local component state.
- No network calls, auth, shared-beta mode, API route, or Storage reference.
- Mobile and desktop layout remain readable.

Validation commands:
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `git diff --check`

Handoff format back to Codex:
- changed files, screenshots/viewport notes if UI changed, validation results,
  explicit non-goals, and any shared-beta questions queued for Codex.

How to use ChatGPT:
- Paste the Cursor handoff summary and ask ChatGPT whether the next task should
  continue this slice, move to the next queue item, or wait for Codex reset.

#### 2. ZINE Reading Readability Pass

Goal: Improve generated ZINE reading density, section headings, and mobile
spacing without changing generation logic.

Allowed files:
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/styles.css`
- `apps/web/src/app/local-demo-ui.ts`
- `apps/web/src/app/local-demo-ui.test.ts`

Forbidden files:
- `packages/core/**`
- `packages/data/**`
- `apps/web/src/app/api/**`
- `supabase/**`

Acceptance checks:
- Existing ZINE generation behavior and localStorage persistence are unchanged.
- Text does not overlap at 375px, 390px, and desktop widths.
- No backend, auth, or shared-beta route references are added.

Validation commands:
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `git diff --check`

Handoff format back to Codex:
- before/after UI notes, changed files, viewport sizes checked, validation
  results, and any skipped visual checks.

How to use ChatGPT:
- Ask ChatGPT to turn the handoff into the next Cursor prompt if more local UI
  polish is safe.

#### 3. Local Demo Empty/Error State Helpers

Goal: Extract pure helper functions for local demo empty states and load-error
copy, with focused tests.

Allowed files:
- `apps/web/src/app/local-demo-ui.ts`
- `apps/web/src/app/local-demo-ui.test.ts`
- `apps/web/src/app/page.tsx` only to consume helpers

Forbidden files:
- `packages/data/**`
- `apps/web/src/app/api/**`
- `supabase/**`

Acceptance checks:
- Helpers are pure and deterministic.
- Tests cover no-post, no-ZINE, and load-error states.
- UI behavior remains browser-local.

Validation commands:
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `git diff --check`

Handoff format back to Codex:
- helper names, covered cases, changed files, validation results, and any
  follow-up UI polish candidates.

How to use ChatGPT:
- Paste short test failures only if they contain no secrets; ask for likely
  pure-helper fixes or whether to stop.

#### 4. Local Demo Accessibility Regression Tests

Goal: Add tests or helper coverage for existing accessibility-oriented local
demo behavior, such as status text, button labels, and date formatting.

Allowed files:
- `apps/web/src/app/local-demo-ui.ts`
- `apps/web/src/app/local-demo-ui.test.ts`
- docs only if recording test intent

Forbidden files:
- shared-beta code in `packages/data/**`
- `apps/web/src/app/api/**`
- `supabase/**`

Acceptance checks:
- Tests cover existing behavior without broad refactors.
- No runtime mode, auth, or persistence contract changes.

Validation commands:
- `npm.cmd run typecheck`
- `npm.cmd test`
- `git diff --check`

Handoff format back to Codex:
- covered behavior, changed files, validation results, and residual test gaps.

How to use ChatGPT:
- Ask ChatGPT to choose the next safe local-demo regression test from the queue.

#### 5. Owner Demo Script Refresh

Goal: Update owner-facing demo/QA scripts so a human can test the local v0.9
loop quickly.

Allowed files:
- `docs/**`
- `AGENTS.md` only for durable repeated rules approved by Codex

Forbidden files:
- product code
- `supabase/**`
- env/secrets/deploy files

Acceptance checks:
- Script covers theme -> post -> ZINE contribution -> generated ZINE.
- It explicitly says shared mode remains disabled and no credentials are used.
- No real participant communication is drafted as ready-to-send.

Validation commands:
- `git diff --check`
- `npm.cmd run typecheck` optional if docs-only

Handoff format back to Codex:
- changed docs, summary of new/changed checklist items, validation result, and
  questions requiring Codex/product judgment.

How to use ChatGPT:
- Ask ChatGPT to check whether the docs accidentally ask Cursor to touch
  Codex-only surfaces.

#### 6. Local Demo Post Composer Polish

Goal: Improve the browser-local photo/post composer ergonomics without changing
upload/storage/backend behavior.

Allowed files:
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/styles.css`
- `apps/web/src/app/local-demo-ui.ts`
- `apps/web/src/app/local-demo-ui.test.ts`

Forbidden files:
- `apps/web/src/app/api/**`
- `packages/data/**`
- `supabase/**`
- env/secrets/deploy files

Acceptance checks:
- Composer still uses local file preview and browser-local persistence only.
- Existing post submission and ZINE generation tests pass.
- No references to Supabase upload, signed URLs, auth, or shared mode.

Validation commands:
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `git diff --check`

Handoff format back to Codex:
- UX changes, changed files, viewport notes, validation results, and any
  follow-up risks.

How to use ChatGPT:
- Paste short validation errors for interpretation, or ask ChatGPT to draft a
  narrower follow-up Cursor prompt.

#### 7. Local Demo Fixture Cleanup

Goal: Improve local demo fixture clarity for tests without changing domain
rules or shared-beta behavior.

Allowed files:
- existing local-demo test/helper files under `apps/web/src/app/**`
- docs describing local demo fixtures

Forbidden files:
- `packages/core/**` unless Codex explicitly approves
- `packages/data/**`
- `apps/web/src/app/api/**`
- `supabase/**`

Acceptance checks:
- Tests become clearer or less duplicated.
- Runtime behavior does not change.
- No shared-beta data contract is modified.

Validation commands:
- `npm.cmd run typecheck`
- `npm.cmd test`
- `git diff --check`

Handoff format back to Codex:
- fixture/helper changes, behavioral non-goals, validation results.

How to use ChatGPT:
- Ask ChatGPT whether the fixture cleanup remains local-demo-only.

#### 8. Mobile Navigation Scan Pass

Goal: Improve local demo navigation labels, skip/focus behavior, or scroll
targets based on existing UI only.

Allowed files:
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/styles.css`
- `apps/web/src/app/local-demo-ui.ts`
- `apps/web/src/app/local-demo-ui.test.ts`

Forbidden files:
- backend/API/data/security files
- env/secrets/deploy files

Acceptance checks:
- No overlapping text or broken tap targets at 375px and 390px widths.
- Keyboard focus remains visible.
- No shared-beta route or auth changes.

Validation commands:
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `git diff --check`

Handoff format back to Codex:
- viewports checked, changed files, validation results, remaining visual risks.

How to use ChatGPT:
- Ask ChatGPT to convert viewport notes into a concise Codex review handoff.

#### 9. Non-Secret Local Dev Runbook Improvement

Goal: Make local setup/recovery docs clearer for owner and Cursor without
adding secrets or deployment steps.

Allowed files:
- `docs/mewri_owner_local_dev_disk_setup.md`
- `docs/mewri_cursor_codex_token_fallback.md`
- `docs/mewri_ai_parallel_fallback_execution_design.md`
- `docs/README.md`

Forbidden files:
- `.env*`
- deployment config
- `supabase/**`
- product code unless Codex explicitly approves

Acceptance checks:
- Docs tell the user how to run local validators and which worktree to open.
- Docs explicitly avoid service role, DB password, access tokens, and production.

Validation commands:
- `git diff --check`

Handoff format back to Codex:
- docs changed, validation result, and any commands not run because docs-only.

How to use ChatGPT:
- Ask ChatGPT to select the next non-secret docs or local-demo task.

#### 10. Codex Handoff Compression Cleanup

Goal: Condense stale handoff sections while preserving current status, blockers,
validation evidence, and next gates.

Allowed files:
- `docs/mewri_chatgpt_handoff_current.md`
- `docs/README.md` if index links need updating

Forbidden files:
- product code
- `supabase/**`
- env/secrets/deploy files

Acceptance checks:
- Current phase, uncommitted risks, validation results, and next gate remain
  clear.
- No product decision is changed or erased.

Validation commands:
- `git diff --check`

Handoff format back to Codex:
- sections compressed, information preserved, validation result, and any
  ambiguous status items requiring Codex confirmation.

How to use ChatGPT:
- Ask ChatGPT to verify the handoff still states the current blockers and
  Codex-only gates clearly.

Cursor must stop and queue a Codex task if the work touches:

- auth/session identity
- RLS or Storage policy
- Supabase migrations
- server route security
- secrets/env values
- deployment
- production
- shared mode
- real users or participant communication

### Fallback Cursor Prompt

```text
Use Mewri rules.

Codex-token fallback mode is active.

Goal:
Continue useful low-risk work until Codex usage resets.

Worktree:
C:\dev\mewri\ph-cursor

Branch:
cursor/parallel-local-ui-docs

Read first:
- AGENTS.md
- docs/README.md
- docs/mewri_chatgpt_handoff_current.md
- docs/mewri_ai_parallel_fallback_execution_design.md

Allowed work:
- owner docs
- onboarding/setup docs
- local demo UI copy/layout/accessibility
- local demo pure helpers and tests
- local-only feedback UI
- ZINE preview/readability UI
- handoff notes for Codex

Hard stops:
- auth, RLS, Storage policy, migrations, server route security
- service_role key, DB password, JWT secret, access/refresh token, magic link URL
- MEWRI_RUNTIME_MODE=shared_beta
- production, deploy, real users
- merge or push to main

Done when:
- git status is reported.
- Exactly one low-risk slice is implemented or clearly proposed.
- Validation is run.
- A Codex handoff is written with changed files, validation results, risks, and
  blocked security questions.
```

## Codex Reset / Review Mode

When Codex usage resets, Cursor should pause any overlapping work and hand off
its branch. Codex CLI becomes the reviewer and merger again. ChatGPT may help
the owner summarize Cursor handoffs, but the Codex CLI review over the actual
diff is the required gate before any merge to `main`.

Codex reset checklist:

1. Cursor reports `git status --short --branch`, changed files, validation, and
   explicit non-goals.
2. Codex reviews Cursor's actual diff in the Cursor worktree or branch.
3. If security-sensitive files were touched accidentally, Codex treats the work
   as blocked until repaired or reverted intentionally.
4. Codex reruns relevant validators.
5. Only after owner approval may Codex merge or push to `main`.

## Handoff From Cursor To Codex

Cursor must hand back this exact shape:

```text
Cursor handoff

Branch:
cursor/parallel-local-ui-docs

Base:
<main commit hash used>

Changed files:
- ...

What changed:
- ...

Validation:
- npm.cmd run typecheck: pass/fail/skipped
- npm.cmd test: pass/fail/skipped
- npm.cmd run build: pass/fail/skipped
- git diff --check: pass/fail/skipped

Explicit non-goals:
- No auth/session/RLS/Storage/migration/shared mode/deploy/production changes.

Risks:
- ...

Needs Codex review before:
- merge to main
- any security-sensitive continuation
```

## Handoff From Codex To Cursor

Codex should give Cursor task prompts in this shape:

```text
Cursor task

Mode:
parallel | fallback

Goal:
...

Files allowed:
- ...

Files forbidden:
- ...

Acceptance checks:
- ...

Validation:
- ...

Stop and ask Codex if:
- ...
```

## Context Compression Policy

This chat may be compacted automatically by the Codex app when the context gets
large. Agents cannot force the app-level compaction on a schedule from repo
code, so Mewri keeps durable context in files instead:

- `docs/mewri_chatgpt_handoff_current.md` for current status.
- This document for Codex/Cursor coordination.
- Commit messages for completed slices.

When a turn gets long or a slice finishes, update the handoff with:

- current branch and worktree
- changed files
- validation results
- remaining risks
- exact next gate

That gives Cursor and Codex a manual compression layer even when chat context is
lost or summarized.
