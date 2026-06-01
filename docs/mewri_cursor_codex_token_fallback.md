# Mewri Cursor Fallback When Codex Usage Is Exhausted

Updated: 2026-06-01

## Purpose

This runbook lets work continue safely in Cursor while waiting for Codex usage
to reset. It follows the research report's split:

- Cursor: fast local loop for low-risk UI, docs, tests, and handoff work.
- Codex: security-sensitive implementation, independent review, Supabase,
  auth, RLS, Storage, migrations, deployment, and final merge decisions.

## Safe Starting Point

Use the dedicated Cursor worktree named:

```text
ph-cursor
```

Expected branch:

```text
cursor/parallel-local-ui-docs
```

Do not work in the Codex worktree at the same time:

```text
ph
```

## What Cursor May Do During Codex Downtime

- Read repository status and active docs.
- Propose one safe next task.
- Improve docs, onboarding notes, non-secret setup guides, and owner-facing
  explanations.
- Make small UI copy or layout improvements that do not touch auth,
  persistence, shared data, or Supabase.
- Add tests for existing non-security behavior.
- Run:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

- Commit to a `cursor/*` branch only when the owner explicitly asks.
- Prepare a Codex handoff with changed files, validation results, risks, and
  questions.

## What Cursor Must Not Do Without Codex Review

- Apply or edit Supabase migrations for use.
- Change auth, session, RLS, Storage policy, server route security, or secret
  handling.
- Ask for or store service role keys, database passwords, JWT secrets, access
  tokens, refresh tokens, or magic link URLs.
- Enable `MEWRI_RUNTIME_MODE=shared_beta`.
- Touch production, deploy, or contact real users.
- Merge to `main` or push to `main`.
- Give final security approval.

## Cursor Prompt To Continue Safely

Run this in Cursor after opening the `ph-cursor` worktree:

```text
Use $mewri-ship-beta.

Codex-token fallback mode is active.

Goal:
Continue useful low-risk work while Codex usage is exhausted, without touching
security-sensitive shared-beta implementation.

Context:
- Worktree: ph-cursor
- Branch: cursor/parallel-local-ui-docs
- Codex will later review anything before merge to main.
- Main Codex worktree is ph.

Constraints:
- Do not edit the main Codex worktree.
- Do not touch production.
- Do not use or ask for service_role key, database password, JWT secret,
  access token, refresh token, or magic link URL.
- Do not apply migrations.
- Do not enable MEWRI_RUNTIME_MODE=shared_beta.
- Do not deploy.
- Do not contact real users.
- Do not change auth, RLS, Storage policy, server route security, or secret
  handling.
- Do not merge or push to main.

Done when:
- Read git status and the current handoff doc.
- Propose or implement one low-risk UI/docs/test task.
- Run relevant validation.
- Report changed files, validation results, remaining risks, and what Codex
  must review after usage resets.
```

## Handoff Back To Codex

When Codex is available again, provide:

- Cursor branch name.
- `git status --short --branch`.
- `git log --oneline main..HEAD`.
- Changed files.
- Validation results.
- Any skipped checks.
- Any question involving auth, RLS, Storage, migrations, shared mode, deploy,
  production, or secrets.
