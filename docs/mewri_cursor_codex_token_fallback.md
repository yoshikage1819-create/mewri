# Mewri Cursor Fallback When Codex Usage Is Exhausted

Updated: 2026-06-03

## Purpose

This runbook lets work continue safely in Cursor while waiting for Codex usage
to reset. In this mode Codex CLI and Codex app are unavailable; ChatGPT may help
the owner route work, but it is not a code executor or security reviewer. The
fallback split is:

- Cursor: primary implementer, 80-90%, limited to documented safe lanes.
- ChatGPT: command center/planning/log interpretation, 10-20%.
- Codex CLI: 0% until reset.
- Codex app: 0% until reset.

After reset, Codex returns as the security-sensitive implementer/reviewer for
Supabase, auth, RLS, Storage, migrations, deployment, main merge/push, and final
security decisions.

For the concrete parallel/fallback implementation design, use
`docs/mewri_ai_parallel_fallback_execution_design.md`.

## Safe Starting Point

Use the dedicated Cursor worktree on a **local disk outside OneDrive**:

```text
C:\dev\mewri\ph-cursor
```

Expected branch:

```text
cursor/parallel-local-ui-docs
```

Do not work in the Codex worktree at the same time:

```text
C:\dev\mewri\ph
```

Legacy OneDrive copies are not active worktrees. Do not reopen them for new work.

## What Cursor May Do During Codex Downtime

- Read repository status and active docs.
- Read `docs/mewri_ai_parallel_fallback_execution_design.md`.
- Propose one safe next task.
- Improve docs, onboarding notes, non-secret setup guides, and owner-facing
  explanations.
- Make small UI copy, layout, accessibility, and navigation improvements that
  do not touch auth, persistence contracts, shared data, or Supabase.
- Add or refactor pure local-demo helper functions and tests.
- Add local-only feedback capture UI that stores only in browser-local or
  component state.
- Improve generated ZINE preview/readability without changing backend paths or
  generation contracts.
- Add fixtures and regression tests for existing browser-local behavior.
- Run:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

- Commit to a `cursor/*` branch only when the owner explicitly asks.
- Prepare a Codex handoff with changed files, validation results, risks, and
  questions.

## How The Owner Uses ChatGPT During Fallback

- Paste Cursor handoff summaries into ChatGPT.
- Ask ChatGPT to choose the next safe Cursor task from the queue in
  `docs/mewri_ai_parallel_fallback_execution_design.md`.
- Ask ChatGPT to rewrite the selected task as a Cursor prompt.
- Ask ChatGPT to explain validation failures only when logs are short and do
  not include secrets.
- Ask ChatGPT to format handoffs for later Codex review.

Do not paste secrets, tokens, service role keys, DB passwords, JWT secrets,
magic links, env files, production data, or participant private data into
ChatGPT. ChatGPT must not approve auth/RLS/Storage/migration/API-security work
as merge-ready.

## What Cursor Must Not Do Without Codex Review

- Apply or edit Supabase migrations for use.
- Change auth, session, RLS, Storage policy, server route security, or secret
  handling.
- Edit `supabase/**`, `apps/web/src/app/api/**`, or `packages/data/**`
  shared-beta auth/storage/RPC/security code.
- Ask for or store service role keys, database passwords, JWT secrets, access
  tokens, refresh tokens, or magic link URLs.
- Enable `MEWRI_RUNTIME_MODE=shared_beta`.
- Touch production, deploy, or contact real users.
- Merge to `main` or push to `main`.
- Give final security approval.

## Fallback Decision Tree

- If Cursor is unsure but the issue is UI, docs, local-demo helpers, or
  local-demo tests, ask ChatGPT for task clarification or prompt rewriting.
- If Cursor is unsure and the issue touches auth, RLS, Storage, migration,
  server route security, secrets, deploy, staging activation, production, or
  shared-beta backend wiring, stop and queue it for Codex after reset.
- If validation fails in UI/docs/local-demo code, Cursor may fix and rerun
  validation.
- If validation fails in shared-beta/security/backend code, stop and write a
  handoff. ChatGPT may help format the handoff, but must not approve it.

## Cursor Prompt To Continue Safely

Run this in Cursor after opening the `ph-cursor` worktree:

```text
Use $mewri-ship-beta.

Codex-token fallback mode is active.

Goal:
Continue useful Cursor-safe implementation work while Codex usage is exhausted,
without touching security-sensitive shared-beta implementation.

Context:
- Worktree: ph-cursor
- Branch: cursor/parallel-local-ui-docs
- Codex CLI and Codex app are unavailable until reset.
- ChatGPT may help the owner choose safe tasks and interpret short non-secret
  logs, but is not a code executor or security reviewer.
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
- Propose or implement one Cursor-safe task from
  `docs/mewri_ai_parallel_fallback_execution_design.md`.
- Run relevant validation.
- Report changed files, validation results, remaining risks, and what Codex
  must review after usage resets.
```

## Recommended Cursor Queue

Use the concrete queue in
`docs/mewri_ai_parallel_fallback_execution_design.md`. Preferred fallback
tasks are:

1. Local demo feedback capture.
2. ZINE reading readability pass.
3. Local demo empty/error state helpers.
4. Local demo accessibility regression tests.
5. Owner demo script refresh.
6. Local demo post composer polish.
7. Local demo fixture cleanup.
8. Mobile navigation scan pass.
9. Non-secret local dev runbook improvement.
10. Codex handoff compression cleanup.

Cursor must include allowed files, forbidden files, validation results, and a
Codex handoff for every slice.

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
