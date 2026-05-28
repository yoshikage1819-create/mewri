# Mewri v0.10 Supabase Staging Refusal Verification Plan

更新日: 2026-05-28

状態: 2026-05-28 に `mewri-staging` で refusal verification 完了。shared mode はまだ有効化しない。

## 目的

closed shared beta foundation migration を staging に適用する前に、何を検証すべきかを固定する。中心は「未完成の server write / upload 経路がない状態では、匿名・非メンバー・認証済みメンバーを含めて投稿作成と画像 upload が拒否されること」である。

この計画は production resources には使わない。live / production project、production credentials、production Vercel env には触れない。

## 適用前の人間承認

次の承認がそろうまで、migration を適用しない。

- Owner が Supabase staging project 名、project ref、Region、課金/保存条件を確認する。
- Owner が staging project であり production ではないことを Supabase dashboard 上で確認する。
- Owner が migration 対象 SQL を `supabase/migrations/202605260001_closed_shared_beta_foundation.sql` として確認する。
- Owner がテスト用 email / user を production user と混ぜないことを確認する。
- Owner が service role key をブラウザ、`.env.local` の `NEXT_PUBLIC_`、docs、チャットに貼らないことを確認する。
- Owner がこの検証では `MEWRI_RUNTIME_MODE=shared_beta` を Vercel や local app に設定しないことを確認する。

承認後に初めて実行する次の command:

```powershell
supabase link --project-ref <staging-project-ref>
```

`supabase link` が成功し、接続先が staging project であることを dashboard と CLI 出力で確認してから、別承認で migration 適用 command に進む。

## Staging Setup Assumptions

- Supabase project は新規または破棄可能な staging 専用 project。
- Auth は staging 用 email magic link または OTP を使う。
- Public anon key は RLS 検証用にのみ使う。service role key は seed と rollback 用にだけ使い、ブラウザに渡さない。
- Migration 適用後も app runtime は browser-local demo のまま。`MEWRI_RUNTIME_MODE=shared_beta` は設定しない。
- Storage bucket は migration が作る private `post-images` のみを使う。
- 実 Storage upload route、DB adapter、shared mode UI はまだ存在しない。

## Test Identities And Seed Shape

staging seed は service role または SQL Editor で投入する。RLS 検証用 client は anon key / authenticated user token で実行する。

Test users:

| Label | Role | Email example | Group membership |
| --- | --- | --- | --- |
| `member_a` | authenticated member | `mewri-staging-member-a@example.test` | `group_alpha` owner/member |
| `member_b` | authenticated member | `mewri-staging-member-b@example.test` | `group_alpha` member |
| `non_member` | authenticated non-member | `mewri-staging-non-member@example.test` | no group membership |
| `member_other` | authenticated other-group member | `mewri-staging-other@example.test` | `group_beta` member |
| `anon` | unauthenticated | none | none |

Seed records:

```text
profiles:
  member_a, member_b, non_member, member_other

groups:
  group_alpha created_by member_a
  group_beta created_by member_other

group_members:
  group_alpha/member_a
  group_alpha/member_b
  group_beta/member_other

zine_cycles:
  cycle_alpha_active in group_alpha
  cycle_beta_active in group_beta

themes:
  theme_alpha_active in group_alpha / cycle_alpha_active / status active
  theme_alpha_closed in group_alpha / cycle_alpha_active / status closed
  theme_beta_active in group_beta / cycle_beta_active / status active

posts:
  post_alpha_member_a in group_alpha / theme_alpha_active / user member_a
  post_beta_member_other in group_beta / theme_beta_active / user member_other

zines:
  zine_alpha in group_alpha / cycle_alpha_active
  zine_beta in group_beta / cycle_beta_active

zine_pages:
  page_alpha references zine_alpha and post_alpha_member_a with group_id group_alpha
  page_beta references zine_beta and post_beta_member_other with group_id group_beta

event_logs:
  event_alpha in group_alpha
  event_beta in group_beta
```

Storage seed objects, inserted by service role only:

```text
bucket: post-images
object names:
  group_alpha/<member_a_uuid>/alpha.webp
  group_beta/<member_other_uuid>/beta.webp
```

Note: Supabase `storage.objects.name` usually excludes the bucket id. App-level private image references may include `post-images/...`, but Storage RLS checks the first folder of `name`, so seed object names for storage policy verification should start with `group_alpha` / `group_beta`.

## Pre-Migration SQL Review Checks

Before applying migration, inspect the SQL file and confirm:

| Check | Expected |
| --- | --- |
| `profiles.id` | `uuid` and references `auth.users(id)` |
| user reference columns | `uuid` where tied to auth identity |
| domain-owned IDs | `text` for groups, members, cycles, themes, posts, zines, pages, events |
| cross-group integrity | composite FKs protect theme/cycle/post/ZINE/page group consistency |
| `private` schema | `usage` granted to `authenticated`, not `anon` |
| private helper execute | only helpers needed by read/storage policies granted to `authenticated` |
| table RLS | enabled on all public shared beta tables |
| anon table grants | no read/write grants |
| authenticated table grants | select only on readable shared tables |
| `posts` policies | no client insert policy |
| `storage.objects` policies | select only; no insert/update policy |
| bucket | private `post-images`, 10 MB limit, JPEG/PNG/WebP MIME list |

## Post-Migration Structural Checks

Run these against staging after migration and before seed data:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles', 'groups', 'group_members', 'zine_cycles', 'themes',
    'posts', 'zines', 'zine_pages', 'event_logs', 'beta_invites'
  )
order by tablename;
```

Expected: every listed table has `rowsecurity = true`.

```sql
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('posts', 'groups', 'themes', 'zines', 'zine_pages', 'event_logs', 'beta_invites')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;
```

Expected:

- No `anon` grants.
- `authenticated` has `SELECT` on readable content tables.
- No `INSERT`, `UPDATE`, or `DELETE` for `authenticated`.
- No grants for `beta_invites` to `anon` or `authenticated`.

```sql
select nspname, has_schema_privilege('anon', nspname, 'USAGE') as anon_usage,
       has_schema_privilege('authenticated', nspname, 'USAGE') as authenticated_usage
from pg_namespace
where nspname = 'private';
```

Expected: `anon_usage = false`, `authenticated_usage = true`.

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'post-images';
```

Expected: one row, `public = false`, `file_size_limit = 10485760`, MIME types include only `image/jpeg`, `image/png`, `image/webp`.

## Refusal And Read Boundary Matrix

Run client checks with Supabase client sessions matching each identity. For REST checks, prefer the generated PostgREST endpoint with anon key plus the user JWT where applicable. For Storage checks, use Supabase Storage client with the same session.

| Actor | Operation | Expected |
| --- | --- | --- |
| `anon` | select `groups` | denied or empty result; no group data |
| `anon` | select `posts` | denied or empty result; no post data |
| `anon` | insert `posts` | denied |
| `anon` | upload to `post-images/group_alpha/<member_a_uuid>/anon.webp` | denied |
| `anon` | download `post-images/group_alpha/<member_a_uuid>/alpha.webp` | denied |
| `non_member` | select `group_alpha` rows | empty result |
| `non_member` | select `post_alpha_member_a` | empty result |
| `non_member` | insert `posts` into `group_alpha` | denied |
| `non_member` | upload to any `post-images` path | denied |
| `non_member` | download `group_alpha/<member_a_uuid>/alpha.webp` | denied |
| `member_a` | select `group_alpha`, members, cycle, active/closed themes, posts, zine, pages, events | allowed, returns only `group_alpha` rows |
| `member_a` | select `group_beta` content | empty result |
| `member_a` | insert `posts` into `group_alpha` active theme | denied because server write route is not implemented and no insert policy exists |
| `member_a` | insert `posts` as `member_b` | denied |
| `member_a` | insert `posts` into `theme_alpha_closed` | denied |
| `member_a` | insert `posts` into `theme_beta_active` | denied |
| `member_a` | upload to `post-images/group_alpha/<member_a_uuid>/new.webp` | denied because no storage insert policy exists |
| `member_a` | download `group_alpha/<member_a_uuid>/alpha.webp` | allowed |
| `member_a` | download `group_beta/<member_other_uuid>/beta.webp` | denied |
| `member_other` | select `group_beta` rows | allowed |
| `member_other` | select `group_alpha` rows | empty result |
| `member_other` | download `group_alpha/<member_a_uuid>/alpha.webp` | denied |

The most important acceptance point is that `member_a` can read their group but still cannot insert a post or upload an image. That proves the foundation migration does not accidentally enable shared posting before the server route, upload verifier, and adapter exist.

## Concrete Client Checks

Use the project URL and anon key from the staging project only. Do not store service role key in browser code or command history.

For each authenticated user:

1. Sign in through Supabase staging Auth and capture the user UUID.
2. Confirm the UUID matches the seeded `profiles.id`.
3. Use the authenticated session to run read queries:

```ts
await supabase.from("groups").select("*").order("id");
await supabase.from("themes").select("*").order("id");
await supabase.from("posts").select("*").order("id");
await supabase.from("zines").select("*").order("id");
await supabase.from("zine_pages").select("*").order("id");
await supabase.from("event_logs").select("*").order("id");
```

Expected:

- `member_a` and `member_b` see only `group_alpha` content.
- `member_other` sees only `group_beta` content.
- `non_member` sees no group content.
- `anon` sees no group content.

Then attempt refused writes:

```ts
await supabase.from("posts").insert({
  id: "post_should_be_denied",
  user_id: "<actor_uuid>",
  group_id: "group_alpha",
  theme_id: "theme_alpha_active",
  image_url: "post-images/group_alpha/<actor_uuid>/denied.webp",
  caption: "should be denied",
  visibility: "group_only"
});
```

Expected for every actor, including `member_a`: error from permission/RLS/grant refusal; no row appears in `posts`.

Attempt refused storage upload:

```ts
await supabase.storage
  .from("post-images")
  .upload("group_alpha/<actor_uuid>/denied.webp", file);
```

Expected for every actor, including `member_a`: upload denied; no object appears.

Attempt allowed member storage read for seeded object:

```ts
await supabase.storage
  .from("post-images")
  .download("group_alpha/<member_a_uuid>/alpha.webp");
```

Expected:

- `member_a` and `member_b`: allowed for `group_alpha`.
- `member_other`, `non_member`, `anon`: denied.

For the current staging verification, do not use SQL Editor role switching as
proof of Storage RLS behavior. Use the local-only authenticated browser check
documented in `docs/mewri_storage_rls_local_read_check_instructions.md`. That
check uses only the staging Project URL and public anon key, then verifies
Storage object metadata visibility with `list` as real member-a / member-b
sessions. It does not use `download`, upload, delete, or service_role.

## Completed Staging Verification Results

Date: 2026-05-28

Project: `mewri-staging`

Safety constraints observed:

- Production resources were not touched.
- `service_role` key was not used for the local read-boundary check.
- `MEWRI_RUNTIME_MODE=shared_beta` remains disabled.
- No upload/delete/modify operation was performed by the local checker.

Passed checks:

| Check | Result |
| --- | --- |
| Migration applied to staging | Passed |
| Shared beta tables exist | Passed |
| `post-images` bucket exists | Passed |
| `post-images.public` | `false` |
| `posts` policies | `SELECT` only |
| Authenticated direct `posts INSERT` | Denied |
| `storage.objects` policies | `SELECT` only |
| Authenticated direct `storage.objects INSERT` | Denied |
| `anon` public table privileges | None |
| `private` schema `USAGE` for `authenticated` | `true` |
| `private` schema `USAGE` for `anon` | `false` |
| helper function `EXECUTE` grants | Matched expectation |
| member-a table reads | Only `group_staging_a` visible |
| member-b table reads | Only `group_staging_b` visible |
| anon Storage metadata read for A object | Not visible |
| anon Storage metadata read for B object | Not visible |
| member-a Storage metadata read for A object | Visible |
| member-a Storage metadata read for B object | Not visible |
| member-b Storage metadata read for B object | Visible |
| member-b Storage metadata read for A object | Not visible |

Conclusion: the foundation migration passed the staging refusal and read-boundary checks required before implementing the real server auth, upload verification, and Supabase adapter gate. Passing this does not enable closed beta by itself.

## Cross-Group Integrity Checks

Run with service role in staging only, because these are schema integrity checks, not client authorization checks.

```sql
insert into public.posts (
  id, user_id, group_id, theme_id, image_url, caption, visibility
) values (
  'post_cross_group_should_fail',
  '<member_a_uuid>',
  'group_alpha',
  'theme_beta_active',
  'post-images/group_alpha/<member_a_uuid>/cross.webp',
  'should fail',
  'group_only'
);
```

Expected: foreign key violation on `posts_theme_group_fk`.

```sql
insert into public.zine_pages (
  id, group_id, zine_id, post_id, page_number, layout_type
) values (
  'page_cross_group_should_fail',
  'group_alpha',
  'zine_alpha',
  'post_beta_member_other',
  99,
  'caption'
);
```

Expected: foreign key violation on `zine_pages_post_group_fk`.

## Evidence To Capture

Capture evidence in a dated folder or ticket, not in this repo if it contains secrets.

- Supabase project name/ref showing staging, not production.
- Migration application output and timestamp.
- Screenshot or SQL output proving RLS enabled on all listed tables.
- SQL output proving `anon` has no table grants and `authenticated` lacks write grants.
- SQL output proving `private` schema `USAGE` is only available to `authenticated`.
- Bucket settings for `post-images`: private, 10 MB, allowed MIME types.
- For each actor, query result summary: row counts per table.
- For each actor, post insert refusal error message.
- For each actor, storage upload refusal error message.
- For member/non-member storage download checks, allowed/denied result.
- Cross-group FK violation outputs.
- Confirmation that `MEWRI_RUNTIME_MODE=shared_beta` was not enabled in Vercel or local runtime.

Do not capture service role key, access tokens, refresh tokens, magic links, OTP codes, or participant emails outside the staging evidence system.

## Rollback Plan

Before applying the migration:

- Confirm staging project is disposable.
- Export or note any needed seed data if the project is not disposable.
- Prefer resetting or deleting the staging project over hand-editing policies after a failed security migration.

If migration or checks fail:

1. Stop. Do not enable shared mode.
2. Do not connect the app to this staging project.
3. Record the failing check, actual result, actor, and SQL/policy involved.
4. If no real data exists, delete/recreate the staging project or reset the database.
5. Fix the migration draft in repo, rerun local `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, and perform a focused security review before another staging attempt.

If any check unexpectedly allows anon/non-member reads, member client post insert, or member client upload, treat it as a release blocker.

## Pass Criteria

The staging migration refusal verification passes only when:

- Anon reads return no shared group content.
- Authenticated non-member reads return no shared group content.
- Authenticated group members can read only their own group content.
- Authenticated group members cannot insert `posts`.
- Authenticated group members cannot upload to `post-images`.
- Member image reads work only for objects whose first storage path segment is a group they belong to.
- Cross-group FK checks reject mismatched theme/post/ZINE references.
- `post-images` remains private and fixed.
- `MEWRI_RUNTIME_MODE=shared_beta` remains disabled.

Passing this plan does not mean closed beta is ready. It only means the migration is safe enough to proceed to the next implementation gate: real server auth, verified upload path resolution, and Supabase adapter integration.
