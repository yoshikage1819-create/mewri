# Mewri C-8a Storage Upload Broker Owner Approval Card

Updated: 2026-06-10

Status: docs-only owner approval card. No code, Supabase connection, env value,
credential, service-role key, migration, shared mode, deployment, live staging
activation, or production resource is changed by this document.

## Decision

Approve the next design direction for shared-beta image upload: build a
server-side upload broker path, starting with fake-client code only, before any
live staging wiring.

This does not approve live credentials, deployment, migration application,
shared mode, or production use.

## Plain-Language Summary

Mewri needs a safe way for an invited member to upload a photo for a shared
beta post.

The unsafe shortcut would be to let the browser write directly into private
Storage. That is fast, but it widens what a logged-in browser is allowed to do.
If the policy is wrong, a member might upload into the wrong place.

The recommended safer path is a small server-controlled upload broker. The
browser sends the image to a trusted server path. The server checks who the user
is, whether they belong to the group, whether the theme is active, whether the
image is acceptable, and only then writes the object to private Storage.

## What Changes If This Direction Is Approved

Approval means C-8b may implement a code-only fake broker interface and tests.

Allowed next slice after approval:

- define the broker interface
- add fake/mock tests
- prove unauthorized requests stop before upload
- prove successful fake upload returns only the confirmed private object path
- keep route unavailable by default
- keep shared mode disabled
- avoid live Supabase calls

Not allowed by this approval:

- adding real staging env values
- using a service-role key
- deploying a Supabase Edge Function
- applying a migration
- enabling shared mode
- enabling a live staging route gate
- touching production
- inviting real beta users

## Why It Matters

The upload path is one of the highest-risk parts of the closed shared beta.
Photos are private group content. A mistake can cause:

- photos written to the wrong group path
- a user uploading without being a member
- a browser gaining broader Storage write access than intended
- a secret key leaking into code, logs, docs, or the client bundle
- a post being created for an image that was not truly verified

The broker direction keeps the risky write operation server-controlled and
keeps the browser from getting direct private Storage insert capability.

## What Could Go Wrong

The broker is safer than broad browser direct upload, but it is still a
security-sensitive surface.

Main risks:

- the broker might accidentally accept unauthenticated requests
- group membership or active theme checks might run too late
- file MIME or size checks might be incomplete
- object paths might be generated from unsafe client input
- a privileged key might be exposed if wiring is careless
- a staging-only gate might accidentally become production-capable
- test-only fake clients might be mistaken for real staging proof

C-8b must therefore stay code-only and fake-client-only.

## What Remains Closed Or Off By Default

Even after approving this direction:

- `MEWRI_RUNTIME_MODE=shared_beta` remains off
- the shared-beta post route remains unavailable by default
- no real Supabase upload happens
- no service-role key is used
- no migration is applied
- no Edge Function is deployed
- no production resource is touched
- no real participant data is used
- direct authenticated client Storage insert remains refused

## Evidence We Already Have

Current evidence from previous slices:

- C-3: route gate and request-scoped dependency factory fail closed by default
- C-4: authorization source contract checks member/theme before upload/RPC
- C-5: Supabase authorization source adapter fails closed with fake clients
- C-6: upload confirmation contract requires exact bucket and object path
- C-7: storage mechanism design recommends broker over broad browser insert
- staging refusal checks showed private Storage and direct client insert refusal

## Evidence We Do Not Have Yet

Still missing before any live activation:

- real broker implementation
- real staging broker deployment/configuration plan
- proof that privileged credentials never reach browser bundles or logs
- proof that the broker rejects anon, non-member, wrong group, inactive theme,
  bad MIME, oversized image, and unsafe filename in staging
- proof that post RPC still creates exactly one post/event only after a valid
  object exists
- rollback rehearsal for broker disablement

## Architecture Visualization

```text
Browser
  -> Next.js shared-beta post route
  -> auth/session check
  -> membership + active theme authorization
  -> image file MIME/size/safe filename check
  -> server-side upload broker
  -> private post-images Storage object
  -> post RPC verifies object and creates post/event
  -> response: { ok: true, post }
```

Important safety points:

- The browser does not provide `validatedImagePath` or `imageUrl`.
- The server generates the object path.
- The broker must not upload until auth and authorization pass.
- The post RPC must not create a post until the private object exists.
- The response must not include full `MewriState`.

## Owner Approval Request

Approve only this statement:

```text
I approve C-8b as a code-only fake-client implementation slice for a
server-side shared-beta image upload broker interface. I do not approve live
Supabase credentials, service-role key use, migration application, shared mode,
staging activation, deployment, production changes, or beta user communication.
```

## What The Owner Should Not Do

Do not paste or provide:

- service-role key
- database password
- JWT secret
- access token or refresh token
- magic link URL
- `.env` file
- production URL or production data
- private participant data

Do not click or approve:

- migration apply
- deploy
- shared mode enablement
- live staging route enablement
- production changes

unless a later approval card explicitly asks for that specific action.

## C-8b CLI Prompt After Approval

Use this only after owner approval of the statement above.

```text
Use $mewri-ship-beta.

Recommended model: gpt-5.5
Recommended reasoning effort: high

Goal:
Implement C-8b code-only fake-client shared-beta image upload broker interface
and tests. Do not connect to live Supabase and do not enable shared mode.

Context:
Repo: C:\dev\mewri\ph
Read docs/mewri_c7_storage_upload_mechanism_design.md,
docs/mewri_ai_development_operating_model_v2.md, and
docs/mewri_c8a_storage_upload_broker_owner_approval_card.md.
C-6 already requires upload success to confirm exact bucket/object path.
C-7 recommends a server-side upload broker to avoid broad browser direct
Storage insert.
C-8a approves only fake-client code, not live staging activation.

Constraints:
- Do not use live Supabase credentials.
- Do not request, paste, log, or add service-role keys.
- Do not add real env values.
- Do not apply migrations.
- Do not deploy.
- Do not enable MEWRI_RUNTIME_MODE=shared_beta.
- Do not touch production.
- Keep local v0.9 demo unchanged.
- Keep shared-beta route fail-closed by default.
- Keep browser request body unable to provide validatedImagePath or imageUrl.
- Do not expose broker or Storage details to UI components.

Likely files:
- packages/data/src/shared-beta-post-image-upload-broker.ts
- packages/data/src/shared-beta-post-image-upload-broker.test.ts
- packages/data/src/supabase-post-image-storage.ts
- packages/data/src/supabase-post-image-storage.test.ts
- apps/web/src/app/api/shared-beta/posts/server-dependencies.ts
- apps/web/src/app/api/shared-beta/posts/server-dependencies.test.ts
- docs/mewri_chatgpt_handoff_current.md

Tests:
- broker is not called before auth and authorization pass
- broker rejects missing auth context, unsafe object path, bad MIME, oversized image
- fake broker returns only confirmed bucket/object path
- mismatched broker confirmation fails closed
- upload/read/verification throws fail closed
- route remains 503 by default without explicit trusted broker wiring
- happy path with fakes returns { ok: true, post } only
- no full MewriState is returned
- no test uses real Supabase, env values, network, or service-role key

Validation:
- git status --short --branch
- npm.cmd run typecheck
- npm.cmd test
- npm.cmd run build
- git diff --check
- independent review over uncommitted diff because this touches auth/storage/API boundaries

Stop before:
- real staging env values
- service-role key access
- migration creation/application
- Edge Function deploy
- shared mode or route gate activation outside tests
- production
- commit/push unless explicitly asked

Report changed files, validation, review result, remaining risks, and next gate.
```

## Rollback

Since C-8a is docs-only, rollback is deleting this document and removing its
README/handoff links.

For later broker implementation rollback:

- remove/unwire broker dependency
- leave shared-beta route unavailable by default
- unset any staging-only gate if it was added later
- do not delete user data without a separate owner-approved cleanup plan
