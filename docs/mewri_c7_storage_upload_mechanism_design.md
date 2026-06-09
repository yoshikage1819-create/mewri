# Mewri C-7 Storage Upload Mechanism Design

Updated: 2026-06-09

Status: docs-only design. No live Supabase connection, migration, env value,
shared mode, deployment, or production resource is used by this document.

## Purpose

C-6 made the shared-beta image upload boundary fail closed: a successful upload
must confirm the expected bucket and object path before the post RPC can run.
C-7 decides how staging should safely perform that upload without weakening the
closed shared beta boundary.

The decision must preserve these invariants:

- Browser clients must not self-declare `validatedImagePath` or `imageUrl`.
- Browser clients must not gain broad direct write access to private Storage.
- Auth, group membership, active theme, MIME, size, and path ownership checks
  must happen before any durable post is created.
- The route remains unavailable by default until an explicitly approved staging
  wiring exists.

## Option 1: Authenticated User JWT Direct Storage Upload Policy

### Upload flow

1. Browser signs in and sends a post request with a real member access token.
2. Server route authenticates the token and authorizes group/theme.
3. Server uses a Supabase client scoped to the member JWT to upload into
   `post-images/<groupId>/<userId>/<generated-safe-filename>`.
4. Storage policy allows authenticated insert only when object path matches the
   caller and group membership.
5. Server calls the post RPC with the server-validated path.

### Required Supabase changes

- Add a narrowly scoped `storage.objects` insert policy for `post-images`.
- Policy must check:
  - `bucket_id = 'post-images'`
  - `auth.uid()` matches the path user id segment
  - path group id segment belongs to a group where `auth.uid()` is a member
  - path shape is exactly `<groupId>/<userUuid>/<filename>`
- Existing read policy remains group-bound.

### Required server code changes

- Wire the current Storage adapter with the request-scoped member JWT.
- Keep current MIME/size/path generation checks before upload.
- Keep upload confirmation check from C-6.

### Security benefits

- No service-role key is required.
- RLS/Storage policies remain the enforcement layer.
- The implementation is close to current C-6 contract and easy to test.

### Risks and failure modes

- This opens direct Storage insert to browser-authenticated users, even if the
  browser does not call Storage directly in normal UI.
- Storage policy path parsing is easy to get wrong.
- Supabase Storage policy functions can be less expressive than app code for
  MIME/size validation; server must still reject before upload.
- If policy is too broad, members may upload objects not tied to an authorized
  post flow.

### Staging verification

- Member A can upload only under `group_staging_a/<memberA>/...`.
- Member A cannot upload under group B or another user id.
- Member B cannot upload under group A.
- Anon cannot upload.
- Bad path shape is rejected.
- Direct table insert into `posts` remains rejected.
- Route success still returns only `{ ok: true, post }`.

### Rollback

- Revoke/drop the Storage insert policy.
- Unset any staging route gate/env values.
- Delete only staging test objects after owner review.

### Decision properties

- Service-role key required: no.
- Browser/client direct insert allowed: yes, through policy.
- Current fail-closed boundary preserved: partially. Server route remains
  fail-closed, but Storage insert capability is broadened at the client role.

## Option 2: Narrow RPC / Database-Mediated Object Registration + Server Upload

### Upload flow

1. Server route authenticates and authorizes the request.
2. Server generates the object path.
3. A narrow RPC validates user/group/theme/path intent and records a pending
   upload object or upload intent.
4. Server performs upload through an approved server mechanism.
5. Post creation RPC verifies the object exists and creates post/event
   atomically.

### Required Supabase changes

- Add a private upload-intent table or function if the existing schema cannot
  represent pending image ownership.
- Add RPC checks for auth identity, group membership, active theme, path shape,
  and object existence.
- Possibly add a cleanup path for stale pending upload intents.

### Required server code changes

- Add an upload-intent RPC adapter.
- Keep the current Storage upload adapter, but connect it only after the intent
  succeeds.
- Keep post creation RPC as the final durable write.

### Security benefits

- Keeps browser Storage insert closed.
- Makes post creation depend on a database-backed intent and object existence.
- Provides auditability for pending/failed uploads.

### Risks and failure modes

- More moving parts than direct policy.
- Still needs a safe server upload mechanism; the RPC alone does not upload
  bytes to Storage.
- Pending intent cleanup can become operational burden.
- If intent and upload are not carefully ordered, stale objects or stale intents
  can accumulate.

### Staging verification

- Intent RPC rejects anon, non-member, wrong group, inactive theme, forged path.
- Upload cannot proceed if intent fails.
- Post RPC rejects missing object or mismatched path.
- Failed upload leaves no post/event.
- Cleanup procedure can remove stale staging intents/objects.

### Rollback

- Revoke execute on the new RPC.
- Drop or disable the intent table/function with a compensating migration.
- Delete only staging test intents/objects.

### Decision properties

- Service-role key required: not by itself.
- Browser/client direct insert allowed: no.
- Current fail-closed boundary preserved: yes, but incomplete unless paired with
  a server upload mechanism.

## Option 3: Edge Function / Server-Side Upload Broker

### Upload flow

1. Browser posts image to the Next.js route or an approved Supabase Edge
   Function with the member access token.
2. The server/broker authenticates the token and performs group/theme/MIME/size
   checks before upload.
3. The broker uses a tightly isolated privileged server context to upload to
   private `post-images`.
4. The broker returns only the confirmed private object path to the route or
   directly calls the post RPC.
5. The post RPC verifies membership, active theme, path, object existence, and
   creates post/event.

### Required Supabase changes

- No broad authenticated `storage.objects` insert policy is required.
- If using Supabase Edge Function, configure the function environment in
  staging only after owner approval.
- Post RPC remains the durable write boundary and must keep object-existence
  checks.
- Optional: add a very narrow helper/RPC for broker-side verification if needed.

### Required server code changes

- Add a server-only upload broker adapter behind the existing C-6 Storage
  contract.
- Ensure the broker receives only request-scoped auth context and generated path.
- Ensure no browser UI imports broker code or privileged clients.
- Keep route fail-closed unless the broker, auth source, Storage, and RPC are
  all explicitly wired.

### Security benefits

- Browser direct Storage insert remains closed.
- MIME, size, path generation, auth, and group/theme authorization stay in
  server-controlled code.
- Privileged upload can be isolated to one small broker surface instead of
  scattered through route/UI code.
- Fits the existing C-6 upload confirmation contract.

### Risks and failure modes

- A privileged broker is security-sensitive and must be small, audited, and
  staging-gated.
- If implemented with service-role credentials, those credentials must never
  reach browser bundles, logs, docs with real values, or non-staging config.
- Broker deployment/configuration adds operational steps.
- Need staging verification that the broker cannot upload outside generated
  paths or before authorization.

### Staging verification

- Route/broker rejects anon, invalid token, non-member, wrong group, inactive
  theme, bad MIME, oversized image, and unsafe filename before upload.
- Broker uploads only to `post-images/<groupId>/<userId>/<filename>`.
- Broker returns only the confirmed private object path.
- Post RPC rejects missing or mismatched object.
- Direct authenticated client Storage insert remains refused.
- No service credential appears in client bundle, logs, responses, docs, or git.

### Rollback

- Disable/unset the broker route/function env gate.
- Revoke broker deployment/config in staging if used.
- Delete staging test objects after owner review.
- Keep existing RLS/read policies unchanged.

### Decision properties

- Service-role key required: possibly, depending on broker implementation; if
  used, it must be isolated server-only and staging-gated.
- Browser/client direct insert allowed: no.
- Current fail-closed boundary preserved: yes, if explicit broker wiring is
  required and absent by default.

## Option 4: Service-Role Server Upload Directly In The Next.js Route

### Upload flow

1. Browser sends post request to Next.js route.
2. Route authenticates and authorizes.
3. Route uses `SUPABASE_SERVICE_ROLE_KEY` to upload to private Storage.
4. Route calls post RPC or writes through a trusted gateway.

### Required Supabase changes

- No client insert policy is required.
- Server env must contain service-role credentials.

### Required server code changes

- Add service-role client construction in the route dependency factory.
- Strictly prevent any export/import path from browser code.
- Add logging guards so secrets never appear.

### Security benefits

- Browser Storage insert remains closed.
- Implementation is simple.

### Risks and failure modes

- This is the most dangerous option if not tightly isolated.
- A service-role key bypasses RLS and can write broadly.
- Any accidental client exposure is severe.
- Harder to prove least privilege compared with an isolated broker or JWT
  policy.
- Increases blast radius of route bugs.

### Staging verification

- Confirm key is server-only and absent from client bundle/logs/responses.
- Confirm route cannot upload before auth and authorization.
- Confirm route cannot upload outside generated paths.
- Confirm direct client Storage insert remains refused.

### Rollback

- Remove/unset service-role env from staging.
- Revert route wiring.
- Delete staging test objects after owner review.

### Decision properties

- Service-role key required: yes.
- Browser/client direct insert allowed: no.
- Current fail-closed boundary preserved: only if the route stays gated and
  secret handling is perfect; risk is high.

## Recommendation

Recommend Option 3: Edge Function / server-side upload broker, implemented as a
small staging-gated server-only broker behind the existing C-6 Storage upload
contract.

Reasoning:

- It does not open direct browser/client Storage insert.
- It matches the C-6 fail-closed contract: upload must return the expected
  bucket and object path before RPC proceeds.
- It keeps MIME, size, path generation, membership, and active-theme checks in
  server-controlled code.
- It isolates any privileged upload mechanism into one auditable surface.
- It can be tested with fakes before any live Supabase configuration exists.

Option 2 is the strongest complement for durable auditability, but it does not
solve byte upload by itself. If C-8 needs extra auditability, combine Option 3
with a narrow RPC/object-existence check rather than building a broad pending
intent system first.

Reject for now:

- Option 1 because it broadens authenticated client Storage insert and makes
  policy path parsing the main protection layer.
- Option 4 because direct service-role use inside the route has a larger blast
  radius and should be avoided unless the broker path proves infeasible.

## C-8 Gate

Before C-8 implementation, the owner must approve:

- broker shape: Next.js server route broker vs Supabase Edge Function
- whether any privileged credential is allowed in staging
- exact env names, without pasting real values into chat/docs
- staging-only activation gate
- staging verification checklist

C-8 should remain code-only with fake clients unless the owner explicitly
approves live staging wiring.
