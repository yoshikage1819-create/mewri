# Mewri C-8c Staging Upload Broker Config And Verification Plan

Updated: 2026-06-10

Status: docs-only staging configuration and verification plan. No live Supabase
connection, env value, credential, service-role key, migration, shared mode,
deployment, staging activation, beta-user communication, or production resource
is changed by this document.

## Purpose

C-8b created a fake-client upload broker contract. C-8c defines how a future
staging-only broker wiring should be configured and verified without putting
real values in the repository or enabling shared beta by accident.

This document is a plan, not permission to activate staging.

## Decision Scope

C-8c prepares the next owner approval point for C-8d.

C-8c allows:

- document the staging-only config shape
- document where real values must live outside git
- document validation and rollback steps
- document manual evidence to collect before route activation
- document what Cursor may and may not do

C-8c does not allow:

- real env values in files, docs, chat, screenshots, or git
- service-role key access or rotation
- Supabase Edge Function deploy
- migration creation or application
- shared mode activation
- live staging route activation
- production access
- beta-user communication

## Recommended Broker Shape

Use a server-side upload broker behind the existing Next.js shared-beta post
route. For staging, the broker may eventually be implemented as one of these,
subject to owner approval:

1. Next.js server-only broker using a staging-only privileged server client.
2. Supabase Edge Function broker with staging-only secrets.

Preferred first staging path: Next.js server-only broker adapter, because it can
reuse the current route dependency factory and avoids adding deploy surface for
an Edge Function before the route is proven.

Still do not store or paste the privileged credential in this repo.

## Plain-Language Architecture

```text
Browser
  -> POST /api/shared-beta/posts
  -> server reads bearer token or session cookie
  -> server confirms authenticated user id
  -> server checks group membership and active theme
  -> server checks image file type, size, and generated path
  -> staging-only upload broker writes private Storage object
  -> post RPC verifies object and creates post/event
  -> browser receives { ok: true, post }
```

The browser never chooses the final private image path. The server chooses it.
The broker must not upload before auth and membership checks pass.

## Configuration Shape

These names are placeholders for planning. Do not add real values in git.

Required staging-only server config for future C-8d:

```text
MEWRI_ENABLE_STAGING_SHARED_BETA_POST_ROUTE=true
MEWRI_ENABLE_STAGING_SHARED_BETA_UPLOAD_BROKER=true
SUPABASE_URL=<staging project URL only>
SUPABASE_ANON_KEY=<staging publishable/anon key only>
SUPABASE_POST_IMAGE_BUCKET=post-images
SUPABASE_UPLOAD_BROKER_MODE=server
```

Privileged credential handling for future C-8d:

```text
SUPABASE_SERVICE_ROLE_KEY=<staging-only secret, never in repo, never in browser>
```

This key, if approved later, must live only in an approved server-side secret
store. It must never be prefixed with `NEXT_PUBLIC_`.

Forbidden config:

```text
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_DATABASE_URL
NEXT_PUBLIC_JWT_SECRET
Any production key or URL
Any copied magic link or access token
Any real participant private data
```

## Config Storage Rules

Real values may only be entered after a later owner approval card.

Allowed locations after approval:

- local terminal session environment for one manual staging test
- approved staging hosting environment secret store
- approved Supabase project secret store if an Edge Function is later chosen

Forbidden locations:

- git-tracked files
- `.env` committed to the repository
- docs
- screenshots
- ChatGPT/Cursor/Codex chat messages
- browser code
- `NEXT_PUBLIC_` variables
- shared notes that include real secrets

## Required Pre-Activation Checks

Before any live staging route/broker activation, confirm:

- the project is `mewri-staging`, not production
- `post-images` bucket exists and is private
- direct authenticated `storage.objects` insert remains refused
- direct authenticated `posts` insert remains refused
- post RPC exists and rejects bad inputs
- shared mode remains disabled unless explicitly approved later
- no production URL/key is being used
- no service-role key has been pasted into chat or docs

## C-8d Implementation Boundary

C-8d should be the first slice allowed to prepare real staging broker wiring,
but only after owner approval.

C-8d may include code for:

- server-only broker adapter construction
- fail-closed env parsing for broker mode
- tests proving incomplete broker config returns 503
- tests proving service-role-like values are never accepted in public key slots
- tests proving broker construction is server-only and not exported to UI

C-8d must still stop before:

- entering real env values
- deploying
- applying migrations
- enabling shared mode in a live environment
- running live end-to-end upload
- production

A separate C-8e or manual staging verification slice should perform live tests
after approval.

## Staging Verification Matrix

Future live staging verification should capture each result as pass/fail.

| Actor | Action | Expected result |
| --- | --- | --- |
| anon | submit post | rejected before broker upload |
| invalid token | submit post | rejected before broker upload |
| member A | submit valid post to group A active theme | creates one private object, one post, one event |
| member A | submit to group B | rejected before broker upload |
| member B | submit to group A | rejected before broker upload |
| member A | inactive theme | rejected before broker upload |
| member A | forged `validatedImagePath` | rejected before broker upload |
| member A | forged `imageUrl` | rejected before broker upload |
| member A | unsupported MIME | rejected before broker upload |
| member A | oversized file | rejected before broker upload |
| authenticated client | direct `posts.insert` | refused |
| authenticated client | direct `storage.objects.insert` | refused |
| member A | read group A object metadata | allowed |
| member A | read group B object metadata | denied or empty |
| anon | read any private object metadata | denied or empty |

## Evidence To Capture

For future live staging verification, capture:

- date/time of test
- confirmation that project is staging
- config names used, without values
- request actor: anon, member A, member B, invalid token
- HTTP status and safe error code
- whether broker upload was attempted
- whether Storage object exists
- whether post row exists
- whether event row exists
- whether direct client insert remains refused
- confirmation that no secret appears in client bundle, logs, responses, docs,
  or git diff

Do not capture real secrets, tokens, magic links, or private user data.

## Rollback Plan

If staging broker activation later fails:

1. Remove/unset `MEWRI_ENABLE_STAGING_SHARED_BETA_UPLOAD_BROKER`.
2. Remove/unset `MEWRI_ENABLE_STAGING_SHARED_BETA_POST_ROUTE` if needed.
3. Leave shared mode disabled.
4. Revert the broker wiring commit if necessary.
5. Delete only staging test objects/rows after owner review.
6. Rotate the staging privileged credential if there is any suspicion of leak.
7. Do not touch production.

## Cursor Role

Cursor may help only with:

- docs-only diagrams and runbooks
- non-secret validation checklist formatting
- fake-client tests if explicitly scoped and later reviewed by Codex

Cursor must stop on:

- real env values
- service-role key handling
- Supabase dashboard/SQL Editor changes
- Edge Function deploy
- migrations
- shared mode activation
- production
- main merge or push

## Owner Approval Needed Before C-8d

Before C-8d, the owner should approve this statement:

```text
I approve C-8d to prepare server-only staging upload broker wiring and tests.
I do not approve adding real env values, using or pasting service-role keys,
deploying, applying migrations, enabling shared mode, running live staging
upload, touching production, or communicating with beta users.
```

## C-8d CLI Prompt After Approval

```text
Use $mewri-ship-beta.

Recommended model: gpt-5.5
Recommended reasoning effort: high

Goal:
Implement C-8d code-only server-only staging upload broker wiring and fail-closed
configuration tests. Do not add real env values and do not make live Supabase
requests.

Context:
Repo: C:\dev\mewri\ph
Read docs/mewri_c7_storage_upload_mechanism_design.md,
docs/mewri_c8a_storage_upload_broker_owner_approval_card.md,
docs/mewri_c8c_staging_upload_broker_config_verification_plan.md, and
docs/mewri_ai_development_operating_model_v2.md.
C-8b added a fake-client upload broker contract. C-8c allows only code-only
server-side wiring and tests, not live activation.

Constraints:
- Do not use, request, paste, log, or add real credentials.
- Do not add `.env` values.
- Do not use SUPABASE_SERVICE_ROLE_KEY in a live request.
- Do not deploy Edge Functions or app hosting.
- Do not apply migrations.
- Do not enable MEWRI_RUNTIME_MODE=shared_beta.
- Do not activate a live staging route.
- Do not touch production.
- Keep local v0.9 unchanged.
- Keep shared-beta route 503 by default.
- Keep broker code server-only and not exported through browser-used package roots.

Likely files:
- apps/web/src/app/api/shared-beta/posts/server-dependencies.ts
- apps/web/src/app/api/shared-beta/posts/server-dependencies.test.ts
- packages/data/src/shared-beta-post-image-upload-broker.ts
- packages/data/src/shared-beta-post-image-upload-broker.test.ts
- docs/mewri_chatgpt_handoff_current.md

Tests:
- no staging post route gate returns 503
- staging route gate without broker gate returns 503
- broker gate without complete server-only config returns 503
- public anon key slot rejects service-role-like values
- broker/client construction is not attempted before auth and authorization
- broker dependency is not exported through `packages/data/src/index.ts`
- happy path still uses fakes only and returns `{ ok: true, post }`

Validation:
- git status --short --branch
- npm.cmd run typecheck
- npm.cmd test
- npm.cmd run build
- git diff --check
- local review pass over auth/storage/API boundary diff

Stop before:
- real env values
- live Supabase requests
- service-role key access
- migration/deploy/shared mode/live staging activation
- production
- commit/push unless explicitly asked

Report changed files, validation, review result, remaining risks, and next gate.
```
