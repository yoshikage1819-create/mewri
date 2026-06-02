# Mewri AI Parallel / Fallback Execution Design

Updated: 2026-06-02

Status: active operating design for Codex + Cursor coordination

## Purpose

This document lets Cursor continue implementation safely when Codex usage is
exhausted, and lets Codex and Cursor work in parallel without editing the same
surface or weakening the closed shared beta boundary.

It is not a product roadmap. It is an execution design for agent coordination.

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
| docs/runbooks/onboarding | May implement/review | May implement |
| non-security tests for local demo helpers | May implement/review | May implement |

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

Fallback mode means Codex usage is exhausted. Cursor may continue only on
non-security work that is safe to review later.

### Fallback Queue

Cursor should choose from this queue in order:

1. Owner-facing docs and non-secret setup guides.
2. Local demo UI copy/accessibility polish.
3. Tests for existing local demo behavior.
4. Handoff cleanup and issue lists for Codex.
5. Small refactors of pure local-demo helpers if covered by tests.

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
- local demo tests
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
