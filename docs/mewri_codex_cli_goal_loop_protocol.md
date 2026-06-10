# Mewri Codex CLI Goal Loop Protocol

Updated: 2026-06-10

Status: active execution protocol. Docs-only. This document does not change app
code, Supabase, env values, credentials, migrations, deployment, shared mode, or
production resources.

## Purpose

This protocol makes every Codex CLI implementation run like a small Plan Mode
loop even when the owner is not reading code.

The goal is simple: before Codex CLI changes code, it must know the exact goal,
allowed files, validation commands, stop conditions, and next gate. If the slice
is safe and validators pass, the CLI may continue to the next tiny loop. If the
slice touches live credentials, Supabase, auth, Storage, migrations, deployment,
or production, it stops for owner approval.

## Roles

| Role | Responsibility |
| --- | --- |
| Codex app | Command center: choose the next slice, explain risk, write CLI prompts, keep the owner oriented |
| Codex CLI | Implement one narrow slice, run validators, review the diff, update handoff |
| Cursor | Parallel/fallback implementer for approved safe lanes only |
| ChatGPT | Fallback command center when Codex app/CLI are unavailable; no code execution or security approval |
| Owner | Approves only after receiving a plain-language knowledge card for risky work |

## Before Any CLI Coding Slice

Codex app should write these fields before the CLI starts:

```text
Goal:
Why this matters:
Current state:
Allowed files:
Forbidden files:
Non-goals:
Validation:
Independent review needed:
Stop conditions:
Handoff expected:
Commit/push rule:
```

For non-technical owner use, `Goal` should be a plain sentence, not an internal
engineering phrase.

Good:

```text
Goal:
Make the shared-beta post route ready to use a fake upload broker, while keeping
the route closed by default.
```

Bad:

```text
Goal:
Refactor route deps.
```

## Safe Loop Shape

Each CLI loop should follow this order:

```text
1. Read current docs and git status.
2. Restate the goal and risk level.
3. Implement the smallest coherent slice.
4. Run the required validators.
5. Review the diff against the stop conditions.
6. Fix findings or stop with a blocker.
7. Update handoff only if durable status changed.
8. Report changed files, validation, remaining risk, and next gate.
```

A loop is allowed to continue automatically only when all are true:

- touched files stayed inside the allowed file list
- no secrets, env values, production resources, live Supabase, migration,
  deployment, or shared mode activation were involved
- validators passed
- review found no unresolved correctness/security issue
- the next loop is the same risk tier or lower
- the owner has not asked to pause

## Risk Tiers For CLI Loops

### Green: May Loop Freely

Examples:

- docs-only runbooks and non-secret checklists
- local demo copy/layout polish
- local-only helper tests
- owner-facing explanations and diagrams

Validation can be light for docs-only work. App tests are not required unless
app files changed.

### Yellow: May Loop Once, Then Report

Examples:

- fake-client tests around existing boundaries
- code-only interface work with no live clients
- route dependency tests that keep defaults fail-closed
- non-secret server contracts that are not activated

Run typecheck/tests/build when code or app runtime changes.

### Orange: Implement One Slice, Then Stop For Review

Examples:

- auth/session ordering
- Storage/RPC adapter code using fakes
- API route boundary behavior
- Supabase adapter shape without live requests

Requires an independent review pass or a local structured review if the external
review tool is blocked. Do not chain another Orange slice without a handoff.

### Red: Stop Before Implementation

Examples:

- real Supabase credentials or `.env*`
- service-role key handling
- live staging activation
- migration application
- RLS or Storage policy changes against a real project
- deployment or production
- beta-user communication
- merge/push decisions not explicitly approved

Red work needs a minimum knowledge card and explicit owner approval before any
action.

## Minimum Knowledge Card Before Red Work

Codex app must show this before asking the owner to approve a risky step:

```text
Decision:
What changes:
Why it matters:
What could go wrong:
What is still closed/off by default:
What evidence we have:
What evidence we do not have yet:
Rollback:
What I need you to approve:
What you should not paste or do:
```

## CLI Prompt Template

Use this template when sending work to Codex CLI.

```text
Use $mewri-ship-beta.

Recommended model: gpt-5.5
Recommended reasoning effort: high

Goal:
<one narrow outcome>

Why this matters:
<plain-language reason>

Current state:
- Repo: C:\dev\mewri\ph
- Branch/status expectation: <main synced or branch name>
- Relevant completed slice: <C-number or doc>

Read first:
- AGENTS.md
- docs/README.md
- docs/mewri_chatgpt_handoff_current.md
- <one or two relevant source docs only>

Allowed files:
- <specific files or directories>

Forbidden files:
- .env*
- secrets / credentials / screenshots containing secrets
- production config
- deploy files
- unrelated package files
- .vscode/
- <risk-specific forbidden areas>

Non-goals:
- Do not connect to real Supabase.
- Do not use service-role keys.
- Do not apply migrations.
- Do not deploy.
- Do not enable shared mode.
- Do not touch production.

Implementation loop:
1. Inspect git status.
2. Restate the goal and risk tier.
3. Implement the smallest coherent slice.
4. Run validators.
5. Review the diff against stop conditions.
6. Fix actionable findings.
7. Update handoff only if durable status changed.
8. Stop and report unless the next loop is explicitly safe.

Validation:
- git status --short --branch
- npm.cmd run typecheck
- npm.cmd test
- npm.cmd run build
- git diff --check

Independent review:
- Required if auth, API route, Storage, RPC, Supabase, env, migration, or shared-data boundaries changed.
- If external review is blocked, do a structured local review and record the limitation.

Stop conditions:
- Any forbidden file would be touched.
- Any real credential, env value, live Supabase request, migration, deploy, shared mode, production, or beta-user step is needed.
- Tests fail and the fix would broaden scope.
- The route becomes available by default.
- Browser code could receive trusted secrets or Storage details.

Handoff:
Report changed files, validation results, review result, remaining risks, and next gate.

Commit/push:
Do not commit or push unless explicitly asked after reporting.
```

## Current Mewri Default

For the current shared-beta line, the default next action is not live staging
verification. The default is to keep work code-only or docs-only until the owner
explicitly approves the C-8e live staging verification card.

Current closed-by-default rules:

- local v0.9 demo remains the default experience
- shared mode remains disabled
- `POST /api/shared-beta/posts` remains fail-closed unless all explicit gates and
  trusted dependencies are present
- no service-role key is used or pasted
- no migration, deployment, production change, or beta-user communication occurs
  without a separate owner approval

## Cursor Parallel Rule

If Cursor is active at the same time, Codex app must declare the Codex CLI file
surface before Cursor edits. Cursor must stay in Green/Yellow safe lanes unless
Codex later reviews and owns the risky work.

Cursor must stop on:

- `supabase/**`
- shared-beta/auth/storage/RPC files under `packages/data/**`
- `apps/web/src/app/api/**`
- `.env*`, secrets, deploy, production, migrations, shared mode, or main push

## Completion Criteria

A CLI loop is complete only when the final report answers:

```text
Goal completed:
Files changed:
Validation run:
Validation result:
Review result:
What stayed closed/off:
Remaining risk:
Next gate:
Commit/push status:
```

If any answer is unclear, the loop is not complete.
