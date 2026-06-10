# Mewri C-8e Live Staging Upload Broker Verification Approval Card

Updated: 2026-06-10

Status: docs-only owner approval and non-secret verification runbook. This
document does not add real env values, credentials, service-role keys,
Supabase requests, migrations, shared mode, deployment, beta-user
communication, or production access.

## Decision

Prepare for a future owner-approved live staging verification of the
server-side shared-beta image upload broker.

This document is not approval to run the live test. It defines what the owner
must understand, what must stay secret, what evidence must be captured, and
where the process must stop.

For the non-technical, screen-by-screen pre-flight checklist, read
`docs/mewri_c8e_non_technical_live_check_guide.md` before any live staging
step.

## Minimum Knowledge Card

### What changes

C-8e would be the first slice that may use real staging-only configuration to
prove that a real authenticated member can upload a private image through the
server-controlled broker and create one post/event through the existing RPC.

### Why it matters

Until this is verified in staging, Mewri has only fake-client proof. Fake tests
prove the code shape is safe, but they do not prove real Supabase Auth,
Storage, RLS, RPC, and private object visibility work together.

### What could go wrong

- A secret key could be pasted into chat, docs, git, screenshots, or browser code.
- The test could accidentally use production instead of staging.
- The route could become available with incomplete config.
- The broker could upload before membership/theme authorization.
- A private image could be visible to the wrong group.
- A post/event could be created when the image object is missing or mismatched.

### What is still closed/off by default

Before a separate owner approval:

- shared mode remains disabled
- production remains untouched
- no migration is applied
- no deploy is performed
- no beta user is contacted
- no real credential is requested in this document
- no real upload test is run

### What evidence we have

- C-3 through C-8d tests prove fail-closed route wiring with fakes.
- Staging refusal checks previously proved private bucket and direct insert refusal.
- C-8d tests prove route and broker gates are required before the route becomes available.

### What evidence we do not have yet

- A real staging route/broker upload proof.
- A real staging post/event creation proof through the live RPC.
- A real proof that no secret appears in client bundle/logs/responses.
- A real proof that member A and member B cannot cross group boundaries during broker upload.

### Rollback

If live verification later fails, immediately disable the route/broker gates,
leave shared mode off, delete only staging test data after review, and rotate
any staging credential if a leak is suspected.

### What I need you to approve later

A later C-8e execution approval must explicitly say whether Codex may guide a
manual staging-only test that uses real staging configuration outside git.

### What you should not paste or do

Do not paste service-role keys, DB passwords, JWT secrets, access tokens,
refresh tokens, magic links, `.env` files, production URLs, production data, or
private participant data into Codex, Cursor, ChatGPT, docs, screenshots, or git.

## Non-Secret Architecture

```text
Browser test request
  -> local/staging Next.js route with staging-only gates
  -> auth session resolves member id
  -> authorization source checks group + active theme
  -> image validation checks MIME/size/path
  -> server-only broker writes private post-images object
  -> post RPC verifies object and writes post/event
  -> response returns { ok: true, post }
```

Sensitive parts are the staging-only secret and any real access token. They are
never written into this document.

## Pre-Flight Checklist Before Any Future Live Test

Stop unless every item is true:

- Project shown in Supabase is `mewri-staging`, not production.
- Git status has no accidental `.env`, secret, generated file, or `.vscode/`
  staged.
- `origin/main` contains C-8d or later.
- `post-images` bucket exists and is private.
- Direct authenticated `posts.insert` remains refused.
- Direct authenticated `storage.objects.insert` remains refused.
- Shared mode is still not enabled in production.
- No real secret is visible in docs, git diff, screenshots, or chat.
- The owner is ready to stop if any screen asks for production or unknown credentials.

## Future Live Verification Matrix

Record only safe facts: actor label, expected result, status code, safe error
code, pass/fail. Do not record tokens or secret values.

| Actor | Test | Expected |
| --- | --- | --- |
| anon | submit post | rejected before broker upload |
| invalid token | submit post | rejected before broker upload |
| member A | valid image, group A active theme | one object, one post, one event |
| member A | group B theme | rejected before broker upload |
| member B | group A theme | rejected before broker upload |
| member A | inactive theme | rejected before broker upload |
| member A | forged `validatedImagePath` | rejected before broker upload |
| member A | forged `imageUrl` | rejected before broker upload |
| member A | unsupported MIME | rejected before broker upload |
| member A | oversized image | rejected before broker upload |
| authenticated client | direct `posts.insert` | refused |
| authenticated client | direct `storage.objects.insert` | refused |
| member A | read group A object metadata | allowed |
| member A | read group B object metadata | denied or empty |
| anon | read any private object metadata | denied or empty |

## Evidence Capture Template

Use this template after a future approved live test:

```text
Date/time:
Confirmed staging project:
Production untouched:
Shared mode status:
Config names used, values omitted:
Actors tested:
Positive test result:
Negative test results:
Direct insert refusal result:
Storage visibility result:
Secret exposure check:
Unexpected behavior:
Rollback needed:
Next gate:
```

## Owner Approval Text For Future C-8e Execution

Only use this later, when ready to run a live staging verification.

```text
I confirm this is the mewri-staging project, not production.
I approve a guided C-8e live staging verification using staging-only
configuration outside git.
I will not paste service-role keys, access tokens, refresh tokens, magic links,
.env files, production URLs, production data, or private participant data into
chat, docs, screenshots, or git.
I do not approve production changes, migration application, deployment, shared
mode activation in production, beta-user communication, or spending money.
Stop before any unclear credential, production screen, deploy, migration, or
secret exposure risk.
```

## C-8e Execution Prompt After Owner Approval

Do not run this until the owner approves the text above.

```text
Use $mewri-ship-beta.

Recommended model: gpt-5.5
Recommended reasoning effort: high

Goal:
Guide an owner-approved live staging verification of the shared-beta upload
broker without exposing secrets, touching production, applying migrations,
deploying, or enabling production shared mode.

Context:
Repo: C:\dev\mewri\ph
Read docs/mewri_c8c_staging_upload_broker_config_verification_plan.md and
docs/mewri_c8e_live_staging_upload_broker_verification_approval.md.
C-8d code-only broker gates are already implemented and pushed.
This is staging verification only.

Constraints:
- Confirm project is mewri-staging before any live step.
- Do not ask the owner to paste secrets into chat.
- Do not write real env values to git-tracked files.
- Do not commit or push secrets.
- Do not apply migrations.
- Do not deploy.
- Do not touch production.
- Do not contact beta users.
- Stop before any unclear credential or production-looking screen.

Procedure:
1. Check git status and confirm no secrets/env files are staged.
2. Confirm staging project and private post-images bucket.
3. Confirm direct posts.insert and storage.objects.insert remain refused.
4. Use only owner-approved local/session staging config outside git.
5. Run the smallest positive member-A upload/post test.
6. Run negative checks for anon, invalid token, wrong group, inactive theme,
   forged path/imageUrl, unsupported MIME, oversized file.
7. Confirm Storage visibility boundaries.
8. Confirm no secret appears in client bundle, logs, responses, docs, or git diff.
9. Record safe evidence only in handoff/docs; omit all secret values.
10. Leave production untouched and shared mode disabled unless separately approved.

Stop and report if any step requires a secret pasted into chat, production,
migration, deploy, unknown paid service, or beta-user communication.
```

## Current Recommendation

Do not run live C-8e yet in this conversation unless the owner explicitly
approves the C-8e execution text above. The safe next action is to review and
commit this approval card, then decide whether live staging verification is
worth the risk now.
