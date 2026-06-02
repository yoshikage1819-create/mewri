---
name: mewri-ship-beta
description: Plan, implement, review, and verify work in the Mewri repository while preserving its group-first ZINE product loop and closed-shared-beta safety boundaries. Use for any Mewri feature, bug fix, UI change, Supabase/auth/RLS/storage work, rollout planning, growth experiment, or handoff/documentation update.
---

# Mewri Ship Beta

## Orient

1. Read `AGENTS.md`.
2. Read `docs/README.md` for the active documentation map.
3. Read `docs/mewri_chatgpt_handoff_current.md` for the current phase and
   working tree cautions.
4. Inspect `git status --short --branch` before editing.
5. Read only the relevant source-of-truth document:
   - product direction: `docs/mewri_requirements_definition_v0_3.md` and
     `docs/mewri_decision_log.md`
   - persistence: `docs/mewri_repository_contract_v0_4.md`
   - shared beta: `docs/mewri_v0_10_closed_shared_beta_foundation.md`

## Choose Scope

- Implement a narrow bug fix or small UI refinement directly after inspection.
- For a feature, schema/auth/storage/RLS change, deployment step, analytics
  change, or experiment, produce a short plan before edits.
- Include hypothesis, scope, non-goals, acceptance checks, privacy/security
  impact, and rollback in substantial plans.
- Keep a human approval point before production credentials, migration
  application, deployment, participant communication, or spending money.
- When receiving a Cline handoff or reviewing Cline edits, re-read source
  files and `git diff`; do not assume a free-model conclusion is correct.
- In Codex app, prefer deciding the next slice and producing a compact CLI
  prompt. In Codex CLI, prefer implementing, validating, and reviewing the
  actual diff.
- Avoid broad app requests such as "inspect everything and implement"; split
  work into one CLI-ready slice with `Goal`, `Context`, `Constraints`, and
  `Done when`.

## Protect Invariants

- Preserve `Theme -> Post -> ZINE contribution -> generated ZINE` as the main
  experience.
- Keep the local demo working until shared mode is genuinely implemented.
- Keep UI independent of storage details; route persistence through
  `packages/data`.
- Never expose a service role key or trusted operation in browser code.
- Require authenticated membership and RLS/private storage for shared data.
- Keep AI assistive to human-created content.

## Deliver

1. Implement one coherent, measurable slice.
2. Treat Codex CLI as the primary implementation/review path for auth,
   SQL/RLS/storage, secrets, migrations, deployment, and shared-data paths.
3. Add or update tests proportional to risk; security work must test rejection
   cases.
4. Run `npm.cmd run typecheck` and `npm.cmd test`; run `npm.cmd run build`
   after web/runtime changes.
5. For auth, SQL/RLS/storage, secrets, migrations, server routes, or
   shared-data changes, perform a separate review pass over the completed diff;
   address findings and rerun validation before acceptance.
6. Update the handoff or decision docs only when status or a durable decision
   changes.
7. Report what changed, verification evidence, review result when required,
   remaining risk, and the next
   beta-learning checkpoint.

## Scale Checkpoints

Read [references/delivery-checkpoints.md](references/delivery-checkpoints.md)
when prioritizing roadmap, rollout, metrics, or one-year growth work.
