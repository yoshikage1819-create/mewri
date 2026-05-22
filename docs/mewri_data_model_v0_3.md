# Mewri Data Model v0.3

## Purpose

Mewri MVP v0.3 keeps the current local MVP behavior, but makes the persistence boundary explicit enough to replace the browser localStorage adapter later with Postgres, Supabase, or another production database.

This step does not add authentication, image upload, follows, comments, notifications, public discovery, payments, printing, or production storage.

## Architecture Boundary

- `packages/core` owns domain models and pure product logic.
- `packages/data` owns repository interfaces, seed data, local persistence adapters, and database-oriented schema descriptions.
- `apps/web` consumes the repository boundary and should not know how localStorage is organized.

The current concrete adapter is `createBrowserLocalRepository()`. It stores one serialized `MewriState` snapshot in browser localStorage for MVP speed, while exposing entity-specific repository methods that match the future database shape.

## Entities

### User

Represents a person in the product. In v0.3 the demo user is seeded locally; there is no auth identity provider yet.

Fields:
- `id`
- `displayName`
- `username`
- `avatarUrl`
- `bio`
- `createdAt`
- `updatedAt`

Relationships:
- Has many `GroupMember`
- Has many `Post`
- Has many `EventLog`

Suggested table: `users`

Indexes to consider:
- Unique `username`

### Group

The core social container. Mewri is group-first; feed and ZINE activity belong to a group.

Fields:
- `id`
- `name`
- `description`
- `visibility`
- `createdBy`
- `createdAt`
- `updatedAt`

Relationships:
- Created by one `User`
- Has many `GroupMember`
- Has many `Theme`
- Has many `Post`
- Has many `ZineCycle`
- Has many `Zine`
- Has many `EventLog`

Suggested table: `groups`

Indexes to consider:
- `created_by`
- `visibility`

### GroupMember

Joins users to groups and stores their group role.

Fields:
- `id`
- `groupId`
- `userId`
- `role`
- `joinedAt`

Relationships:
- Belongs to one `Group`
- Belongs to one `User`

Suggested table: `group_members`

Indexes to consider:
- Unique `(group_id, user_id)`
- `user_id`

### ZineCycle

Represents the multi-day publishing window. The current MVP uses a 3-day cycle.

Fields:
- `id`
- `groupId`
- `title`
- `startDate`
- `endDate`
- `status`
- `createdAt`
- `updatedAt`

Relationships:
- Belongs to one `Group`
- Has many `Theme`
- Has zero or one published `Zine`

Suggested table: `zine_cycles`

Indexes to consider:
- `(group_id, start_date)`
- `(group_id, status)`

### Theme

The daily prompt for lightweight posting. Three Themes belong to the current 3-day ZineCycle.

Fields:
- `id`
- `groupId`
- `zineCycleId`
- `title`
- `description`
- `themeDate`
- `source`
- `status`
- `createdAt`

Relationships:
- Belongs to one `Group`
- Belongs to one `ZineCycle`
- Has many `Post`

Suggested table: `themes`

Indexes to consider:
- `(group_id, theme_date)`
- `zine_cycle_id`
- `status`

### Post

A lightweight photo submission to a Theme. In v0.3 `imageUrl` remains a string; no upload pipeline exists yet.

Fields:
- `id`
- `userId`
- `groupId`
- `themeId`
- `imageUrl`
- `caption`
- `visibility`
- `createdAt`
- `updatedAt`

Relationships:
- Belongs to one `User`
- Belongs to one `Group`
- Belongs to one `Theme`
- Can appear in many `ZinePage` rows over time, though the current MVP uses one generated ZINE per cycle

Suggested table: `posts`

Indexes to consider:
- `(group_id, created_at desc)` for group feed
- `(theme_id, created_at desc)` for Theme detail
- `(user_id, created_at desc)` for profile/history later

### Zine

The finished object generated from posts in a ZineCycle. ZINE is intentionally treated as a distinct artifact, not just another feed view.

Fields:
- `id`
- `zineCycleId`
- `groupId`
- `title`
- `intro`
- `coverPostId`
- `status`
- `createdAt`
- `publishedAt`

Relationships:
- Belongs to one `ZineCycle`
- Belongs to one `Group`
- Optionally references one cover `Post`
- Has many `ZinePage`

Suggested table: `zines`

Indexes to consider:
- Unique `zine_cycle_id`
- `(group_id, published_at desc)`
- `status`

### ZinePage

Stores page-level composition for a generated ZINE.

Fields:
- `id`
- `zineId`
- `postId`
- `pageNumber`
- `layoutType`
- `aiCaption`
- `editorNote`
- `createdAt`

Relationships:
- Belongs to one `Zine`
- References one `Post`

Suggested table: `zine_pages`

Indexes to consider:
- Unique `(zine_id, page_number)`
- `post_id`

### EventLog

Append-oriented product event log for MVP observability and later analytics.

Fields:
- `id`
- `userId`
- `groupId`
- `eventName`
- `entityType`
- `entityId`
- `metadata`
- `createdAt`

Relationships:
- Optionally belongs to one `User`
- Optionally belongs to one `Group`
- May point at an entity by `entityType` and `entityId`

Suggested table: `event_logs`

Indexes to consider:
- `(group_id, created_at desc)`
- `(user_id, created_at desc)`
- `(entity_type, entity_id)`

## Suggested Database Tables

Initial production tables should mirror the existing core model names:

- `users`
- `groups`
- `group_members`
- `zine_cycles`
- `themes`
- `posts`
- `zines`
- `zine_pages`
- `event_logs`

The table and index outline is also captured in `packages/data/src/schema.ts` as `mewriDataSchemaV03`.

## Postgres or Supabase Migration Notes

Recommended approach:

1. Keep `packages/core` unchanged and treat it as the source of domain types and pure rules.
2. Add a new adapter in `packages/data`, for example `createPostgresRepository()` or `createSupabaseRepository()`.
3. Map database rows to the existing camelCase domain models at the repository boundary.
4. Keep ZINE generation in `packages/core`; the database adapter should only load and persist the required entities.
5. Move writes that need server trust, such as post creation and ZINE publishing, behind Next.js server actions or API routes before connecting to a real database.
6. Add database-level constraints for ownership and referential integrity before adding multi-user auth.

Supabase-specific considerations:
- Use Row Level Security after auth is introduced.
- Keep `group_members` as the main authorization join table.
- Store uploaded image files later in object storage and persist only the resulting URL or storage key on `posts`.
- Keep `event_logs.metadata` as `jsonb`.

Postgres-specific considerations:
- Use `timestamptz` for timestamps.
- Consider `uuid` primary keys later, but do not force that migration while the MVP uses stable string IDs.
- Add transactions for ZINE publishing so `zines`, `zine_pages`, `zine_cycles`, and `event_logs` update atomically.

## Intentionally Not Implemented in v0.3

- Authentication or external identity
- Real image upload, image processing, camera capture, or object storage
- Follows, comments, DMs, notifications, or public Discover
- Payments, printing, fulfillment, or physical ZINE ordering
- Production database connection
- Server-side authorization
- Feed ranking or recommendation systems
- AI model integration beyond assistive generated ZINE captions already represented by the local MVP

## Product Principles Preserved

- Posting is light.
- ZINE is deep.
- Theme is daily.
- ZINE is every few days.
- AI is assistive.
- Group is the primary social boundary.
- Wider SNS expansion comes later.


