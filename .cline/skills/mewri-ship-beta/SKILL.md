---
name: mewri-ship-beta
description: Plan, implement, review, and verify work in the Mewri repository while preserving its group-first ZINE product loop and closed-shared-beta safety boundaries. Use for any Mewri feature, bug fix, UI change, Supabase/auth/RLS/storage work, rollout planning, growth experiment, or handoff/documentation update.
---

# Mewri Ship Beta

## Orient

1. Read `AGENTS.md`.
2. Read `docs/README.md` for the active documentation map.
3. Read `docs/mewri_chatgpt_handoff_current.md` and inspect
   `git status --short --branch`.
4. Read product decisions for direction changes, the repository contract for
   persistence work, and the v0.10 foundation document for shared beta work.

## Work

- For feature, database/security, deployment, metrics, or growth work, start
  in Plan mode with hypothesis, scope, non-goals, acceptance checks,
  privacy/security impact, and rollback.
- Treat Cline Provider models tagged `FREE` as a limited secondary path:
  use them for planning, repository navigation, documentation, UI copy/style,
  and small reversible work. Do not rely on them alone for shared-data or
  production-sensitive implementation.
- If a free-model task reaches auth, SQL/RLS/storage, secrets, migration,
  deployment, or a broad data-path change, create a handoff with
  `.clinerules/workflows/handoff-to-codex.md` and ask Codex CLI to implement
  or review it.
- Do not recommend adding Cursor Pro unless token or usage interruptions are
  recorded as a recurring blocker or sustained UI iteration justifies a
  measured one-month trial; it never replaces Codex security review.
- Preserve the local demo and the core
  `Theme -> Post -> ZINE contribution -> generated ZINE` loop.
- Route storage through `packages/data`, keep service keys server-only, and
  require membership/RLS/private storage for shared content.
- Keep AI assistive to the participant-created ZINE experience.
- Keep a human approval point for live credentials, migrations, deployments,
  participant communications, legal/privacy choices, moderation, and cost.

## Verify

Run `npm.cmd run typecheck` and `npm.cmd test` after code changes. Run
`npm.cmd run build` after UI or runtime changes. Security-sensitive work must
test rejected unauthorized access and be reviewed through Codex CLI before
being accepted.

When handing sensitive work to Codex, frame the slice with `Goal`, `Context`,
`Constraints`, and `Done when`, and require a separate Codex review pass after
implementation succeeds.

For rollout prioritization and scale checkpoints, read
`.codex/skills/mewri-ship-beta/references/delivery-checkpoints.md`.
