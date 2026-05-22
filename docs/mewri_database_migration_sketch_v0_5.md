# Mewri Database Migration Sketch v0.5

## Purpose

This document translates the v0.4 Mewri data model into a practical Postgres/Supabase-oriented migration sketch for a future production database adapter.

This is a SQL draft, not an integration. It does not add Supabase, Postgres, Prisma, Drizzle, or any other database dependency. It does not connect to a real database or change app behavior.

## Scope

The migration sketch covers the current MVP entity set:

- `users`
- `groups`
- `group_members`
- `zine_cycles`
- `themes`
- `posts`
- `zines`
- `zine_pages`
- `event_logs`

This sketch intentionally does not add authentication, image upload, follows, comments, notifications, public discovery, payments, or printing.

## Draft SQL

This draft keeps MVP string IDs as `text` because the current app already uses stable IDs such as `user_demo`, `group_first`, and `cycle_group_first_2026-05-20`. A later migration can move selected IDs to `uuid` after auth and production identity are designed.

```sql
create table users (
  id text primary key,
  display_name text not null check (length(trim(display_name)) > 0),
  username text not null check (length(trim(username)) > 0),
  avatar_url text,
  bio text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint users_username_key unique (username),
  constraint users_updated_after_created_check check (updated_at >= created_at)
);

create table groups (
  id text primary key,
  name text not null check (length(trim(name)) > 0),
  description text not null,
  visibility text not null,
  created_by text not null references users(id),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint groups_visibility_check check (visibility in ('invite_only', 'private', 'public')),
  constraint groups_updated_after_created_check check (updated_at >= created_at)
);

create index groups_created_by_idx on groups (created_by);
create index groups_visibility_idx on groups (visibility);

create table group_members (
  id text primary key,
  group_id text not null references groups(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  role text not null,
  joined_at timestamptz not null,
  constraint group_members_group_user_key unique (group_id, user_id),
  constraint group_members_role_check check (role in ('owner', 'member'))
);

create index group_members_group_id_idx on group_members (group_id);
create index group_members_user_id_idx on group_members (user_id);

create table zine_cycles (
  id text primary key,
  group_id text not null references groups(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  start_date date not null,
  end_date date not null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint zine_cycles_date_order_check check (end_date >= start_date),
  constraint zine_cycles_status_check check (
    status in ('scheduled', 'active', 'closed', 'generating', 'ready_for_review', 'published', 'archived')
  ),
  constraint zine_cycles_group_start_key unique (group_id, start_date),
  constraint zine_cycles_updated_after_created_check check (updated_at >= created_at)
);

create index zine_cycles_group_start_idx on zine_cycles (group_id, start_date);
create index zine_cycles_group_status_idx on zine_cycles (group_id, status);

create table themes (
  id text primary key,
  group_id text not null references groups(id) on delete cascade,
  zine_cycle_id text not null references zine_cycles(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text not null,
  theme_date date not null,
  source text not null,
  status text not null,
  created_at timestamptz not null,
  constraint themes_source_check check (source in ('ai', 'host', 'admin')),
  constraint themes_status_check check (status in ('scheduled', 'active', 'closed')),
  constraint themes_cycle_date_key unique (zine_cycle_id, theme_date)
);

create index themes_group_date_idx on themes (group_id, theme_date);
create index themes_cycle_idx on themes (zine_cycle_id);
create index themes_status_idx on themes (status);

create table posts (
  id text primary key,
  user_id text not null references users(id),
  group_id text not null references groups(id) on delete cascade,
  theme_id text not null references themes(id) on delete cascade,
  image_url text not null check (length(trim(image_url)) > 0),
  caption text not null,
  visibility text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint posts_visibility_check check (visibility in ('group_only', 'public_link')),
  constraint posts_updated_after_created_check check (updated_at >= created_at)
);

create index posts_group_feed_idx on posts (group_id, created_at desc, id desc);
create index posts_theme_feed_idx on posts (theme_id, created_at desc, id desc);
create index posts_user_history_idx on posts (user_id, created_at desc, id desc);

create table zines (
  id text primary key,
  zine_cycle_id text not null references zine_cycles(id) on delete cascade,
  group_id text not null references groups(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  intro text not null,
  cover_post_id text references posts(id),
  status text not null,
  created_at timestamptz not null,
  published_at timestamptz,
  constraint zines_cycle_key unique (zine_cycle_id),
  constraint zines_status_check check (status in ('draft', 'review', 'published', 'archived')),
  constraint zines_published_status_check check (
    (status = 'published' and published_at is not null)
    or (status <> 'published')
  )
);

create index zines_group_published_idx on zines (group_id, published_at desc, id desc);
create index zines_status_idx on zines (status);

create table zine_pages (
  id text primary key,
  zine_id text not null references zines(id) on delete cascade,
  post_id text not null references posts(id),
  page_number integer not null,
  layout_type text not null,
  ai_caption text,
  editor_note text,
  created_at timestamptz not null,
  constraint zine_pages_page_number_check check (page_number > 0),
  constraint zine_pages_layout_type_check check (layout_type in ('cover', 'full_bleed', 'pair', 'caption')),
  constraint zine_pages_zine_page_key unique (zine_id, page_number)
);

create index zine_pages_zine_order_idx on zine_pages (zine_id, page_number asc);
create index zine_pages_post_idx on zine_pages (post_id);

create table event_logs (
  id text primary key,
  user_id text references users(id),
  group_id text references groups(id) on delete set null,
  event_name text not null check (length(trim(event_name)) > 0),
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null
);

create index event_logs_group_created_idx on event_logs (group_id, created_at desc, id desc);
create index event_logs_user_created_idx on event_logs (user_id, created_at desc, id desc);
create index event_logs_entity_idx on event_logs (entity_type, entity_id);
create index event_logs_event_name_idx on event_logs (event_name);
```

## Constraint Notes

- `text` primary keys match the current MVP domain IDs and mapper types.
- `timestamptz` is used for instant-like fields: `created_at`, `updated_at`, `joined_at`, and `published_at`.
- `date` is used for date-only product concepts: `theme_date`, `start_date`, and `end_date`.
- Enum-like values are protected with `check` constraints rather than database enum types so future value additions can be migrated with ordinary constraint changes.
- `event_logs.metadata` is `jsonb` to support small structured context without adding new columns for every event shape.
- `zines.zine_cycle_id` is unique because the MVP allows one durable ZINE per cycle.
- `zine_pages(zine_id, page_number)` is unique because display order must be stable and unambiguous.

## ZINE Publish Transaction Requirements

Publishing a ZINE is the most important write boundary for the future database adapter. The following tables must be written atomically:

- `zine_cycles`
- `zines`
- `zine_pages`
- `event_logs`

Required behavior:

- Lock or otherwise protect the target `zine_cycles` row.
- Load the cycle's Themes and Posts in the same consistency boundary.
- Enforce the minimum 4 Posts rule before writing.
- Upsert exactly one `zines` row for the `zine_cycle_id`.
- Replace pages only for the target ZINE.
- Update `zine_cycles.status` to `published`.
- Insert a `zine_published` EventLog only if the publish commits.
- Commit all writes together or roll all of them back.

Draft transaction shape:

```sql
begin;

select *
from zine_cycles
where id = $1
for update;

-- Application/service code should validate:
-- - the cycle exists
-- - the cycle belongs to the requested group
-- - the cycle has at least 4 eligible Posts through its Themes
-- - generated pages have stable positive page_number values

with upserted_zine as (
  insert into zines (
    id,
    zine_cycle_id,
    group_id,
    title,
    intro,
    cover_post_id,
    status,
    created_at,
    published_at
  )
  values ($2, $1, $3, $4, $5, $6, 'published', $7, $7)
  on conflict (zine_cycle_id)
  do update set
    group_id = excluded.group_id,
    title = excluded.title,
    intro = excluded.intro,
    cover_post_id = excluded.cover_post_id,
    status = excluded.status,
    published_at = excluded.published_at
  returning id
),
deleted_pages as (
  delete from zine_pages
  where zine_id = (select id from upserted_zine)
)
insert into zine_pages (
  id,
  zine_id,
  post_id,
  page_number,
  layout_type,
  ai_caption,
  editor_note,
  created_at
)
select
  $8,
  id,
  $9,
  1,
  'cover',
  $10,
  $11,
  $7
from upserted_zine;

update zine_cycles
set status = 'published',
    updated_at = $7
where id = $1;

insert into event_logs (
  id,
  user_id,
  group_id,
  event_name,
  entity_type,
  entity_id,
  metadata,
  created_at
)
values (
  $12,
  $13,
  $3,
  'zine_published',
  'zine',
  (select id from zines where zine_cycle_id = $1),
  $14::jsonb,
  $7
);

commit;
```

Failure rules:

- If page replacement fails, the cycle must not remain marked `published`.
- If EventLog insert fails, the ZINE publish must not be visible as committed.
- If concurrent publish attempts happen, the final state must still have one ZINE per cycle and one ordered page set for that ZINE.

## Intentionally Deferred Until Auth

These are intentionally excluded from the migration sketch until authentication and server-side trust boundaries are designed:

- RLS policies
- Real user identity mapping to an auth provider
- Permission checks based on the authenticated user
- Public discovery
- Image storage, upload validation, and object metadata

`group_members` is still included now because it is part of the domain model and will later become the main authorization join table. Until auth exists, it is only modeled data, not a security boundary.

## Relationship to Repository and Mapper Work

### MewriRepository contract

The schema supports the current `MewriRepository` guarantees from `docs/mewri_repository_contract_v0_4.md`:

- Primary keys prevent duplicate records by `id`.
- `unique(group_id, user_id)` protects one membership per user per group.
- `unique(zine_cycle_id)` protects one ZINE per cycle.
- `unique(zine_id, page_number)` protects stable page ordering.
- Parent-key indexes support `listByGroupId`, `listByThemeId`, `listByZineCycleId`, and `listByZineId`.
- Feed and event indexes support newest-first reads using `created_at desc, id desc`.

### `db-row-types.ts`

The draft SQL uses the same snake_case row shape represented by `packages/data/src/db-row-types.ts`. A future adapter should keep those row types aligned with migration output and should treat database rows as internal adapter details.

### `db-mappers.ts`

`packages/data/src/db-mappers.ts` is the boundary between snake_case database rows and camelCase `@mewri/core` domain models. The SQL column names in this sketch are intentionally shaped so those mappers do not need database-client-specific logic.

### Future database adapter contract tests

A production adapter should not be considered ready until it passes the existing repository contract tests against an isolated test database or schema. The test setup should verify:

- Upserts do not create duplicate IDs.
- Parent-scoped reads do not leak records across groups, themes, cycles, zines, or users.
- `posts.prepend()` preserves feed-immediate behavior through deterministic ordering.
- `zinePages.listByZineId()` returns `page_number asc`.
- `zinePages.replaceForZine()` replaces only the target ZINE's pages.
- ZINE publish writes `zine_cycles`, `zines`, `zine_pages`, and `event_logs` atomically.

## Remaining Design Decisions

- Whether the first real adapter uses Supabase directly or a server-side Postgres client.
- Whether IDs remain `text` permanently or migrate to `uuid` after auth.
- Whether duplicate `zine_published` events should be allowed for repeated publish attempts.
- Whether cross-table group consistency should be enforced with composite foreign keys or kept in service validation.
- How test database setup should isolate contract test state in CI.


