# Mewri Data Model v0.4

## Purpose

Mewri MVP v0.4 does not connect to a production database yet. This document prepares the app for that future step by tightening the expected table shape, indexes, constraints, and transaction boundaries that a database-backed repository adapter must preserve.

This version builds on `docs/mewri_data_model_v0_3.md`, the method-level repository contract in `docs/mewri_repository_contract_v0_4.md`, and the reusable repository contract tests in `packages/data/src/repository-contract.test-helper.ts`.

## Non-Goals

v0.4 still does not add:

- Authentication or external identity providers
- Real image upload, object storage, image processing, or moderation
- Follows, comments, DMs, notifications, or public discovery
- Payments, printing, fulfillment, or physical ZINE ordering
- Supabase, Postgres, or any other production database dependency
- Server-side authorization or Row Level Security policies

## Architecture Boundary

- `packages/core` remains the source of product rules and domain models.
- `packages/data` owns repository interfaces, adapters, seed state, contract tests, and database-oriented schema notes.
- `apps/web` must consume service and repository APIs, not storage details.
- The current concrete persistence adapter remains browser localStorage.
- The test adapter remains `createMemoryRepository()`.

A future database adapter should implement the existing `MewriRepository` interface and pass the same repository contract tests that currently run against the in-memory adapter.

## Repository Guarantees That Shape the Database

The database design should preserve these contract-level behaviors:

- All repositories upsert by `id` without creating duplicates.
- `posts.prepend()` keeps the most recently submitted or replaced Post first in the feed.
- `posts.prepend()` replaces an existing Post with the same `id`.
- `zinePages.listByZineId()` always returns pages ordered by `page_number` ascending.
- `zinePages.replaceForZine(zineId, pages)` replaces only pages for the target ZINE.
- Parent filters such as `listByGroupId`, `listByThemeId`, and `listByZineCycleId` must not leak records from other parents.
- EventLog is append-oriented and queryable by group, user, and entity.
- `apps/web` must never require localStorage keys or browser storage objects.

These guarantees are intentionally adapter-agnostic. They should hold for memory, localStorage, and any future database adapter.

## Tables

The initial production database should keep the same entity set introduced in v0.3:

- `users`
- `groups`
- `group_members`
- `zine_cycles`
- `themes`
- `posts`
- `zines`
- `zine_pages`
- `event_logs`

String IDs may remain `text` for the first production adapter because the MVP already uses stable string IDs such as `user_demo`, `group_first`, `cycle_group_first_2026-05-20`, and `zine_cycle_group_first_2026-05-20`. A later migration can move to `uuid` where useful, but v0.4 should not force that change.

Timestamps should be stored as `timestamptz` in Postgres-compatible databases. Date-only fields such as `theme_date`, `start_date`, and `end_date` should use `date`.

## Suggested Columns

### users

Columns:

- `id text primary key`
- `display_name text not null`
- `username text not null`
- `avatar_url text null`
- `bio text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Constraints and indexes:

- `unique(username)`
- Optional check: `length(username) > 0`

Future auth note:

- Do not add external auth identity columns until the auth provider is chosen.
- When auth is introduced, add a stable provider identity mapping rather than overloading `username`.

### groups

Columns:

- `id text primary key`
- `name text not null`
- `description text not null`
- `visibility text not null`
- `created_by text not null references users(id)`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Constraints and indexes:

- `check (visibility in ('invite_only', 'private', 'public'))`
- `index groups_created_by_idx (created_by)`
- `index groups_visibility_idx (visibility)`

Product note:

- Mewri remains group-first. Production authorization should eventually be based on `group_members`, not public profile discovery.

### group_members

Columns:

- `id text primary key`
- `group_id text not null references groups(id)`
- `user_id text not null references users(id)`
- `role text not null`
- `joined_at timestamptz not null`

Constraints and indexes:

- `unique(group_id, user_id)`
- `check (role in ('owner', 'member'))`
- `index group_members_group_id_idx (group_id)`
- `index group_members_user_id_idx (user_id)`

Future auth note:

- This table should become the main authorization join table once real auth exists.
- Owners can later manage group settings, but v0.4 does not add those flows.

### zine_cycles

Columns:

- `id text primary key`
- `group_id text not null references groups(id)`
- `title text not null`
- `start_date date not null`
- `end_date date not null`
- `status text not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Constraints and indexes:

- `check (end_date >= start_date)`
- `check (status in ('scheduled', 'active', 'closed', 'generating', 'ready_for_review', 'published', 'archived'))`
- `index zine_cycles_group_start_idx (group_id, start_date)`
- `index zine_cycles_group_status_idx (group_id, status)`
- Optional early constraint: `unique(group_id, start_date)`

Product note:

- The MVP creates 3-day cycles. The schema should not hard-code `end_date = start_date + 2 days`, but product logic can keep enforcing it in `packages/core`.

### themes

Columns:

- `id text primary key`
- `group_id text not null references groups(id)`
- `zine_cycle_id text not null references zine_cycles(id)`
- `title text not null`
- `description text not null`
- `theme_date date not null`
- `source text not null`
- `status text not null`
- `created_at timestamptz not null`

Constraints and indexes:

- `check (source in ('ai', 'host', 'admin'))`
- `check (status in ('scheduled', 'active', 'closed'))`
- `unique(zine_cycle_id, theme_date)`
- `index themes_group_date_idx (group_id, theme_date)`
- `index themes_cycle_idx (zine_cycle_id)`
- `index themes_status_idx (status)`

Product note:

- Theme is daily. For the MVP, one cycle should have exactly three Themes, but that count is better protected by product/service logic and tests than by a basic relational constraint.

### posts

Columns:

- `id text primary key`
- `user_id text not null references users(id)`
- `group_id text not null references groups(id)`
- `theme_id text not null references themes(id)`
- `image_url text not null`
- `caption text not null`
- `visibility text not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Constraints and indexes:

- `check (visibility in ('group_only', 'public_link'))`
- `index posts_group_feed_idx (group_id, created_at desc, id desc)`
- `index posts_theme_feed_idx (theme_id, created_at desc, id desc)`
- `index posts_user_history_idx (user_id, created_at desc, id desc)`

Future storage note:

- v0.4 keeps `image_url` as a string.
- When real upload arrives, add object storage metadata separately. Do not make the Post table responsible for upload processing.

### zines

Columns:

- `id text primary key`
- `zine_cycle_id text not null references zine_cycles(id)`
- `group_id text not null references groups(id)`
- `title text not null`
- `intro text not null`
- `cover_post_id text null references posts(id)`
- `status text not null`
- `created_at timestamptz not null`
- `published_at timestamptz null`

Constraints and indexes:

- `unique(zine_cycle_id)`
- `check (status in ('draft', 'review', 'published', 'archived'))`
- `index zines_group_published_idx (group_id, published_at desc, id desc)`
- `index zines_status_idx (status)`

Product note:

- ZINE is a durable artifact, not just a feed view.
- The one-ZINE-per-cycle constraint is currently important to the MVP.

### zine_pages

Columns:

- `id text primary key`
- `zine_id text not null references zines(id)`
- `post_id text not null references posts(id)`
- `page_number integer not null`
- `layout_type text not null`
- `ai_caption text null`
- `editor_note text null`
- `created_at timestamptz not null`

Constraints and indexes:

- `check (page_number > 0)`
- `check (layout_type in ('cover', 'full_bleed', 'pair', 'caption'))`
- `unique(zine_id, page_number)`
- `index zine_pages_zine_order_idx (zine_id, page_number asc)`
- `index zine_pages_post_idx (post_id)`

Repository contract note:

- `listByZineId(zineId)` must always order by `page_number asc`.
- `replaceForZine(zineId, pages)` must delete or supersede only rows where `zine_id = zineId`.

### event_logs

Columns:

- `id text primary key`
- `user_id text null references users(id)`
- `group_id text null references groups(id)`
- `event_name text not null`
- `entity_type text null`
- `entity_id text null`
- `metadata jsonb null`
- `created_at timestamptz not null`

Constraints and indexes:

- `index event_logs_group_created_idx (group_id, created_at desc, id desc)`
- `index event_logs_user_created_idx (user_id, created_at desc, id desc)`
- `index event_logs_entity_idx (entity_type, entity_id)`
- Optional index: `event_logs_event_name_idx (event_name)`

Product note:

- EventLog supports MVP observability. It is not a tamper-proof audit trail until writes move server-side with auth.

## Transaction Boundaries

### Seed or Demo Reset

Current behavior:

- `reset()` restores demo user, group, membership, one active cycle, three Themes, and the seed EventLog.
- It removes Posts, ZINEs, and ZINE pages.

Future DB behavior:

- Test/demo reset should run in an isolated schema, transaction, or local test database.
- Production should not expose a destructive global reset.

Minimum transaction:

1. Delete or isolate mutable demo records.
2. Insert demo `users`, `groups`, `group_members`, `zine_cycles`, `themes`, and `event_logs`.
3. Commit only if the full seed state is valid.

### Submit Post

Current behavior:

- Create one `posts` record.
- Prepend one `event_logs` record named `post_created`.
- Feed reflects the Post immediately.

Future DB transaction:

1. Validate the user, group, and theme relationship.
2. Insert or upsert the Post by `id`.
3. Insert the EventLog row.
4. Commit both rows together.

Important constraints:

- The selected Theme must belong to the target Group.
- The user should be a GroupMember once auth exists.
- The Post should not be visible outside its group unless future product logic explicitly allows it.

### Publish ZINE

This is the most important v0.4 transaction boundary.

Current behavior:

- ZINE generation is allowed only when at least 4 Posts are available for the cycle.
- `generateZineDraft()` produces one `zines` record and ordered `zine_pages`.
- `upsertPublishedZine()` sets the matching `zine_cycles.status` to `published`.
- A `zine_published` EventLog is recorded.

Future DB transaction:

1. Lock or otherwise protect the target `zine_cycles` row.
2. Load the cycle's Themes.
3. Load Posts whose `theme_id` belongs to those Themes and whose `group_id` matches the cycle Group.
4. Enforce the minimum 4 Posts rule before writing.
5. Upsert exactly one `zines` row for `zine_cycle_id`.
6. Replace `zine_pages` for that ZINE.
7. Update `zine_cycles.status` to `published` and `updated_at` to the publish timestamp.
8. Insert one `event_logs` row named `zine_published`.
9. Commit all changes together.

All of these writes must succeed or fail as one unit:

- `zine_cycles`
- `zines`
- `zine_pages`
- `event_logs`

Suggested Postgres shape:

```sql
begin;

-- lock target cycle
select *
from zine_cycles
where id = $1
for update;

-- load themes and posts, enforce minimum in application/service logic

insert into zines (...)
values (...)
on conflict (zine_cycle_id)
do update set
  title = excluded.title,
  intro = excluded.intro,
  cover_post_id = excluded.cover_post_id,
  status = excluded.status,
  published_at = excluded.published_at;

delete from zine_pages
where zine_id = $2;

insert into zine_pages (...)
values (...);

update zine_cycles
set status = 'published',
    updated_at = $3
where id = $1;

insert into event_logs (...)
values (...);

commit;
```

Idempotency note:

- Re-running publish for the same cycle should not create multiple ZINE rows because `zines.zine_cycle_id` is unique.
- Re-running publish should replace pages for that ZINE, not append duplicate page rows.
- EventLog idempotency is still undecided. The current MVP records each publish action. A future server action may decide whether duplicate publish events are allowed.

### Replace ZINE Pages

Current behavior:

- `replaceForZine(zineId, pages)` removes only pages for that ZINE and persists the replacement pages.
- Other ZINE pages must remain untouched.

Future DB transaction:

1. Delete rows from `zine_pages where zine_id = target`.
2. Insert replacement rows.
3. Commit both steps together.

This operation should usually be nested inside Publish ZINE rather than exposed as a standalone product action.

## Query Patterns and Index Rationale

### Group Feed

Repository method:

- `posts.listByGroupId(groupId)`

Required index:

- `posts(group_id, created_at desc, id desc)`

Reason:

- Feed should show group-scoped Posts quickly and deterministically.

### Theme Posts

Repository method:

- `posts.listByThemeId(themeId)`

Required index:

- `posts(theme_id, created_at desc, id desc)`

Reason:

- Theme detail and cycle aggregation need fast theme-scoped lookup.

### Cycle Themes

Repository method:

- `themes.listByZineCycleId(zineCycleId)`

Required index:

- `themes(zine_cycle_id)`

Reason:

- ZINE generation starts from a cycle, then loads Themes, then Posts.

### Ordered ZINE Pages

Repository method:

- `zinePages.listByZineId(zineId)`

Required index:

- `zine_pages(zine_id, page_number asc)`

Reason:

- ZINE display depends on stable page order.

### Event History

Repository methods:

- `eventLogs.listByGroupId(groupId)`
- `eventLogs.listByUserId(userId)`

Required indexes:

- `event_logs(group_id, created_at desc, id desc)`
- `event_logs(user_id, created_at desc, id desc)`

Reason:

- MVP observability and future analytics should not require scanning all events.

## Production Adapter Readiness Checklist

Before adding a real database dependency:

- Keep `MewriRepository` stable unless a contract test proves it needs to change.
- Add database row-to-domain mappers at the repository boundary.
- Keep camelCase in domain models and snake_case in database rows.
- Run the repository contract tests against the new adapter.
- Add isolated test database setup before enabling database-backed tests in normal CI.
- Move trusted writes behind server actions or API routes before multi-user auth.
- Treat ZINE publish as a transaction from day one.

The implementation sequencing for these steps is detailed in `docs/mewri_mvp_v0_5_database_readiness.md`.

## Risks Before Auth and Real Storage

- Client-side users remain trusted and editable.
- localStorage is device-local and not a security boundary.
- EventLog is useful for behavior tracking but not audit-grade.
- Image URLs can point anywhere until upload and validation exist.
- Group membership is modeled but not enforced by server-side authorization.
- Date and timezone behavior must be normalized before production use.

## Product Principles Preserved

- Posting is light.
- ZINE is deep.
- Theme is daily.
- ZINE is every few days.
- AI is assistive.
- Group is the primary social boundary.
- Wider SNS expansion comes later.


