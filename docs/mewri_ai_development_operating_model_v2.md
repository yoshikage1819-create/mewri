# Mewri AI Development Operating Model v2

Updated: 2026-06-10

Status: active operating design draft. Docs-only. No code, Supabase, env,
credential, migration, deployment, or production resource is changed by this
plan.

## Purpose

Mewri cannot assume paid staff, a senior engineer nearby, or a hired security
specialist. This document converts the Deep Research recommendations into a
realistic operating model for a non-technical owner using Codex, Cursor,
ChatGPT, GitHub, and strict approval gates.

The goal is not to pretend AI is a full engineering team. The goal is to make
AI work inside clear responsibility boundaries so the owner can keep moving
without personally handling secrets, migrations, deployments, or low-level
implementation details.

## Reality Check

Mewri's current constraint is not only lack of money. It is lack of a trusted
human technical owner who can independently approve risky work.

Therefore, the operating model must assume:

- No paid engineer is available by default.
- No one else can safely approve auth, RLS, Storage, migration, secret, or
  deployment changes today.
- AI can implement and review, but AI output must be constrained by written
  rules, tests, and owner approval checkpoints.
- The owner should not paste secrets, env files, private participant data, or
  production information into AI tools.
- Shared beta must remain fail-closed until the required staging checks and
  owner approvals are complete.

## Replacement For Hiring A Head Of Engineering

The Deep Research report recommends a Head of AI Product & Engineering. Since
Mewri cannot hire that role now, split the role into a virtual operating system:

| Responsibility | Zero-capital replacement |
| --- | --- |
| Decide the next slice | Codex app creates one narrow CLI-ready plan |
| Implement and validate | Codex CLI implements high-risk work; Cursor implements approved lower-risk work |
| Explain system impact | Codex app writes plain-language architecture notes before owner approval |
| Review risky diffs | Codex CLI review pass plus tests; no Cursor-only approval for risky work |
| Keep memory/current state | Repo docs, handoff, memory pack, Obsidian for human reading |
| Fallback when Codex is exhausted | ChatGPT command center + Cursor safe-lane implementation |
| Final approval | Owner approves only after receiving a minimum knowledge card |

This is not as strong as a real senior engineer. It is the cheapest workable
substitute until there is budget for expert review.

## Operating Modes

### Normal Mode

Use when Codex app and Codex CLI are available.

- Codex app: command center, plan splitter, owner explanation.
- Codex CLI: implementation, validation, security-sensitive review.
- Cursor: optional parallel work on non-overlapping lower-risk slices.
- ChatGPT: research, prompt rewriting, second-opinion planning.

### Parallel Mode

Use when Cursor should increase implementation throughput while Codex continues
main work.

Rules:

- Cursor must work on a separate branch/worktree.
- Cursor must declare intended files before editing.
- Cursor must not touch files Codex is touching in the same slice.
- Codex reviews Cursor diffs before any merge to main.

### Codex Token Fallback Mode

Use when Codex CLI and Codex app are both unavailable until reset.

- Cursor becomes the main implementer, but only inside approved safe lanes.
- ChatGPT becomes the command center, but does not execute code and does not
  approve security-sensitive diffs.
- Anything touching auth, RLS, Storage, migrations, API security, env, deploy,
  staging activation, or production stops and becomes a Codex-after-reset task.

## Cursor Risk Tiers

Cursor can do more work than before, but only if the work is classified first.

### Green: Cursor May Own

Cursor may implement, test, and hand off these tasks:

- owner-facing docs, runbooks, onboarding guides, QA checklists
- local demo copy, layout, accessibility, keyboard/focus behavior
- mobile readability and spacing in browser-local screens
- pure browser-local helper functions and tests
- local-only feedback UI that does not call APIs
- ZINE preview/readability improvements with no backend path changes
- fixtures and regression tests for existing local demo behavior

Merge rule: Codex review is still preferred before main, but risk is low.

### Yellow: Cursor May Implement With Codex Review Required

Cursor may implement only when the task is clearly scoped and uses fakes/mocks:

- non-security tests around existing boundaries
- docs for shared beta workflows that contain no secrets or live values
- type-only or interface-only drafts that do not wire live clients
- fake-client tests for already designed server contracts
- UI states that display already existing API results without changing APIs

Merge rule: must wait for Codex review before main.

### Orange: Cursor May Draft, But Codex Must Own Finalization

Cursor may prepare a draft or analysis, but must not claim the work is ready:

- server route tests touching auth/order of operations
- Supabase adapter tests using fake clients
- storage upload flow diagrams or broker design docs
- SQL/RLS policy analysis without applying migrations
- migration review notes without changing live database
- security-sensitive refactor proposals

Merge rule: Codex CLI must inspect source and diff, run validators, and decide
whether to repair or reject.

### Red: Cursor Must Not Implement

Cursor stops and writes a handoff if the task touches:

- `supabase/**` migrations or policies
- real Supabase project, SQL Editor, live staging, or production
- `.env*`, secrets, service role keys, DB passwords, JWT secrets, magic links
- `apps/web/src/app/api/**` security-sensitive route behavior
- `packages/data/**` auth, RLS, Storage, RPC, runtime, repository adapter wiring
- shared mode activation
- deployment, production config, participant communication
- merge or push to `main`

## Human Approval Gates

The owner should approve only after Codex provides a minimum knowledge card.

Approval is required before:

- adding real staging env values
- using or rotating any service-role or privileged key
- applying a migration
- enabling shared mode or a staging route gate outside tests
- deploying to staging or production
- changing RLS, Storage policy, auth/session, or deletion behavior
- inviting beta users or communicating a live feature
- spending money on new infrastructure or paid plans

The owner should not approve from raw logs alone. Codex must translate the
risk into plain language first.

## Minimum Knowledge Card Template

Codex must output this before owner approval on risky work:

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

## Architecture Visualization Requirement

Before risky implementation slices, Codex should include a small diagram or
plain-language flow. Use this style:

```text
Browser
  -> Next.js server route
  -> auth/session check
  -> membership/theme authorization
  -> image MIME/size/path check
  -> server upload broker or Storage boundary
  -> post RPC
  -> response: { ok: true, post }
```

Every visualization should answer:

- Where does the user's photo go?
- Who is allowed to see it?
- Which step checks membership?
- Which step could leak data if wrong?
- Which part is still disabled by default?

## C-8 Direction Under This Model

C-7 recommended an Edge Function / server-side upload broker. Under the
zero-capital model, C-8 should not start with live credentials or deployment.

Recommended next sequence:

1. C-8a docs-only owner approval card for upload broker.
2. C-8b code-only fake broker interface and tests, no live Supabase.
3. C-8c staging-only config plan, no real values in repo.
4. C-8d owner-approved staging wiring and verification.

Cursor may help with C-8a docs and diagrams. Cursor may draft fake-client tests
only if Codex owns final review. Cursor must not implement live broker wiring,
secrets, migrations, or deployment.

## What To Avoid For Now

Do not spend money or add operational weight before shared beta proves learning
value. Specifically avoid:

- hiring plans that assume immediate 4-6 FTE
- paid team plans unless a specific bottleneck is proven
- production deployment before staging evidence is complete
- broad direct browser Storage insert policies
- Cursor-only security-sensitive implementation
- AI-generated code merged because tests pass but architecture is unclear
- storing real secrets in docs, prompts, screenshots, or chat

## Weekly Operating Loop

Use this loop until there is budget for expert review:

1. Codex app chooses one narrow slice.
2. Owner receives a plain-language reason for the slice.
3. Codex CLI implements or Cursor implements according to risk tier.
4. Validators run.
5. Risky work gets independent review or Codex reset review.
6. Handoff records what changed, what stayed closed, and the next gate.
7. Main is pushed only after explicit commit/push approval.

## Success Criteria

This operating model is working if:

- The owner rarely needs to inspect code directly.
- Every risky decision has a short knowledge card.
- Cursor progresses meaningful Green/Yellow work during fallback.
- Red work waits for Codex and never moves on Cursor alone.
- Shared beta safety boundaries remain fail-closed by default.
- The repo history clearly shows why each risky step was taken.
