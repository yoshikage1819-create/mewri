# Mewri Repository Contract v0.4

## Purpose

This document defines what each `MewriRepository` method must guarantee. It exists so future database adapters can preserve the current MVP behavior without depending on localStorage implementation details.

The executable version of this contract lives in `packages/data/src/repository-contract.test-helper.ts`.

## Scope

This contract applies to:

- `createMemoryRepository()`
- `createBrowserLocalRepository()`
- Any future Postgres, Supabase, or other production database adapter

The contract does not add authentication, upload storage, follows, comments, notifications, public discovery, payments, or printing.

## General Rules

- Repository methods return domain models from `@mewri/core`, not raw storage rows.
- Repository consumers use camelCase fields.
- A database adapter may use snake_case internally, but it must map rows at the repository boundary.
- `upsert()` means insert if missing, replace/update by `id` if present, and never create duplicate records with the same `id`.
- `listBy...()` methods must only return records matching the requested parent id.
- Methods must not expose localStorage keys, browser storage objects, SQL clients, table names, or adapter-specific details to `apps/web`.
- Unless this document names an order guarantee, list ordering is not part of the contract.
- Mutating methods persist before returning. A following `load()` must reflect the mutation.

## Root Repository

### `load(): MewriState`

Guarantees:

- Returns the full current `MewriState`.
- If no persisted state exists, returns the demo seed state.
- The demo seed state includes:
  - one demo User
  - one demo Group
  - one GroupMember owner relation
  - one active 3-day ZineCycle
  - exactly three Themes
  - no Posts
  - no ZINEs
  - no ZINE pages
  - one `seed_created` EventLog

Does not guarantee:

- Server trust, authorization, or multi-device sync.
- That returned objects are live mutable references. Adapters may return clones.

### `save(state: MewriState): void`

Guarantees:

- Replaces the persisted state with the provided state.
- A following `load()` returns that state, modulo adapter cloning or serialization.

Does not guarantee:

- Field-level merge semantics.
- Validation beyond what the adapter explicitly implements.

Database adapter note:

- A production adapter should avoid exposing broad whole-state replacement to untrusted client code.
- If retained for tests, it should be limited to isolated test/demo environments.

### `reset(): MewriState`

Guarantees:

- Restores demo seed state.
- Removes mutable MVP content such as Posts, ZINEs, and ZINE pages.
- Returns the restored state.

Does not guarantee:

- A production-safe destructive reset.

Database adapter note:

- Production adapters should not expose global reset to users.
- Contract tests may use reset only against isolated test databases, schemas, or transactions.

## Users

### `users.list(): User[]`

Guarantees:

- Returns all Users currently known to the adapter.

Ordering:

- No order guarantee.

### `users.getById(id): User | undefined`

Guarantees:

- Returns the User with the exact `id`.
- Returns `undefined` when missing.

### `users.upsert(user): void`

Guarantees:

- Inserts a new User when `id` is missing.
- Updates/replaces the existing User when `id` exists.
- Does not create duplicate Users with the same `id`.

Does not guarantee:

- Username uniqueness by itself. Database adapters should enforce `unique(username)` at the schema level.

## Groups

### `groups.list(): Group[]`

Guarantees:

- Returns all Groups currently known to the adapter.

Ordering:

- No order guarantee.

### `groups.getById(id): Group | undefined`

Guarantees:

- Returns the Group with the exact `id`.
- Returns `undefined` when missing.

### `groups.upsert(group): void`

Guarantees:

- Inserts or updates/replaces by `id`.
- Does not create duplicate Groups with the same `id`.

## Group Members

### `groupMembers.list(): GroupMember[]`

Guarantees:

- Returns all GroupMember records.

Ordering:

- No order guarantee.

### `groupMembers.listByGroupId(groupId): GroupMember[]`

Guarantees:

- Returns only GroupMember records where `member.groupId === groupId`.
- Does not include memberships from other Groups.

Ordering:

- No order guarantee.

### `groupMembers.listByUserId(userId): GroupMember[]`

Guarantees:

- Returns only GroupMember records where `member.userId === userId`.
- Does not include memberships for other Users.

Ordering:

- No order guarantee.

### `groupMembers.upsert(member): void`

Guarantees:

- Inserts or updates/replaces by `id`.
- Does not create duplicate GroupMember records with the same `id`.

Database adapter note:

- Production schema should also enforce `unique(group_id, user_id)`.

## Themes

### `themes.list(): Theme[]`

Guarantees:

- Returns all Themes.

Ordering:

- No order guarantee.

### `themes.listByGroupId(groupId): Theme[]`

Guarantees:

- Returns only Themes where `theme.groupId === groupId`.

Ordering:

- No order guarantee.

### `themes.listByZineCycleId(zineCycleId): Theme[]`

Guarantees:

- Returns only Themes where `theme.zineCycleId === zineCycleId`.
- Used by ZINE generation to find the cycle's daily Themes.

Ordering:

- No order guarantee in the repository contract.
- Callers that need chronological order should sort by `themeDate`.

### `themes.getById(id): Theme | undefined`

Guarantees:

- Returns the Theme with the exact `id`.
- Returns `undefined` when missing.

### `themes.upsert(theme): void`

Guarantees:

- Inserts or updates/replaces by `id`.
- Does not create duplicate Themes with the same `id`.

Database adapter note:

- Production schema should enforce `unique(zine_cycle_id, theme_date)`.

## Posts

### `posts.list(): Post[]`

Guarantees:

- Returns all Posts known to the adapter.

Ordering:

- For the current MVP adapters, this follows feed insertion order.
- Future database adapters should prefer `created_at desc, id desc` for deterministic feed-like reads.

### `posts.listByGroupId(groupId): Post[]`

Guarantees:

- Returns only Posts where `post.groupId === groupId`.
- Does not leak Posts from other Groups.

Ordering:

- Should support group feed behavior.
- Database adapters should return newest first using `created_at desc, id desc`.

### `posts.listByThemeId(themeId): Post[]`

Guarantees:

- Returns only Posts where `post.themeId === themeId`.
- Does not include Posts from other Themes.

Ordering:

- Database adapters should return newest first using `created_at desc, id desc`.

### `posts.getById(id): Post | undefined`

Guarantees:

- Returns the Post with the exact `id`.
- Returns `undefined` when missing.

### `posts.prepend(post): void`

Guarantees:

- Persists the Post immediately.
- Places that Post first in the feed order used by `posts.list()`.
- If a Post with the same `id` already exists, replaces it and moves it to the first position.
- Does not create duplicate Posts with the same `id`.

MVP behavior protected:

- A newly created Post appears in the Feed immediately.

Database adapter note:

- A database adapter cannot literally "prepend" rows. It should implement equivalent feed behavior with `created_at desc, id desc`, or with an explicit ordering column if needed.
- If an existing Post is replaced through this method, the adapter should preserve the immediate feed-first behavior expected by the contract.

### `posts.upsert(post): void`

Guarantees:

- Inserts or updates/replaces by `id`.
- Does not create duplicate Posts with the same `id`.

Ordering:

- Unlike `prepend()`, this method does not guarantee feed-first positioning.

## Zine Cycles

### `zineCycles.list(): ZineCycle[]`

Guarantees:

- Returns all ZineCycles.

Ordering:

- No order guarantee.

### `zineCycles.listByGroupId(groupId): ZineCycle[]`

Guarantees:

- Returns only ZineCycles where `cycle.groupId === groupId`.

Ordering:

- No order guarantee.
- Callers that need chronological order should sort by `startDate`.

### `zineCycles.getById(id): ZineCycle | undefined`

Guarantees:

- Returns the ZineCycle with the exact `id`.
- Returns `undefined` when missing.

### `zineCycles.upsert(cycle): void`

Guarantees:

- Inserts or updates/replaces by `id`.
- Does not create duplicate ZineCycles with the same `id`.

## ZINEs

### `zines.list(): Zine[]`

Guarantees:

- Returns all ZINEs.

Ordering:

- No order guarantee.

### `zines.listByGroupId(groupId): Zine[]`

Guarantees:

- Returns only ZINEs where `zine.groupId === groupId`.

Ordering:

- Database adapters should prefer `published_at desc, id desc` for published history views.

### `zines.getById(id): Zine | undefined`

Guarantees:

- Returns the ZINE with the exact `id`.
- Returns `undefined` when missing.

### `zines.getByZineCycleId(zineCycleId): Zine | undefined`

Guarantees:

- Returns the ZINE for the exact `zineCycleId`.
- Returns `undefined` when missing.
- At most one ZINE should exist per ZineCycle.

Database adapter note:

- Production schema should enforce `unique(zine_cycle_id)`.

### `zines.upsert(zine): void`

Guarantees:

- Inserts or updates/replaces by `id`.
- Does not create duplicate ZINEs with the same `id`.

Does not guarantee:

- By itself, this method does not update ZineCycle status or EventLog.
- Publishing should go through a service-level operation such as `publishZineForCycle()`.

## ZINE Pages

### `zinePages.list(): ZinePage[]`

Guarantees:

- Returns all ZINE pages.

Ordering:

- No global order guarantee.

### `zinePages.listByZineId(zineId): ZinePage[]`

Guarantees:

- Returns only ZINE pages where `page.zineId === zineId`.
- Always returns pages ordered by `pageNumber` ascending.
- Does not include pages from other ZINEs.

MVP behavior protected:

- Generated ZINE pages display in stable page order.

Database adapter note:

- Use `order by page_number asc`.
- Schema should enforce `unique(zine_id, page_number)`.

### `zinePages.getById(id): ZinePage | undefined`

Guarantees:

- Returns the ZINE page with the exact `id`.
- Returns `undefined` when missing.

### `zinePages.replaceForZine(zineId, pages): void`

Guarantees:

- Replaces the complete page set for the target `zineId`.
- Removes or supersedes old pages for that same ZINE.
- Leaves pages for other ZINEs unchanged.
- A following `zinePages.listByZineId(zineId)` returns the replacement pages in `pageNumber` order.

Database adapter note:

- Implement as a transaction:
  1. Delete or supersede pages where `zine_id = zineId`.
  2. Insert the replacement pages.
  3. Commit both steps together.

### `zinePages.upsert(page): void`

Guarantees:

- Inserts or updates/replaces by `id`.
- Does not create duplicate ZINE pages with the same `id`.

Does not guarantee:

- Replacement of the full page set.
- Use `replaceForZine()` when regenerating a ZINE.

## Event Logs

### `eventLogs.list(): EventLog[]`

Guarantees:

- Returns all EventLog records.

Ordering:

- Current MVP adapters store prepended events first.
- Database adapters should return newest first using `created_at desc, id desc`.

### `eventLogs.listByGroupId(groupId): EventLog[]`

Guarantees:

- Returns only EventLog records where `event.groupId === groupId`.

Ordering:

- Should return newest first for observability views.

### `eventLogs.listByUserId(userId): EventLog[]`

Guarantees:

- Returns only EventLog records where `event.userId === userId`.

Ordering:

- Should return newest first for user history/debug views.

### `eventLogs.prepend(event): void`

Guarantees:

- Persists the EventLog immediately.
- Places the EventLog first in the event order used by `eventLogs.list()`.

Does not guarantee:

- Deduplication by `id`.
- Tamper-proof audit behavior.
- Authorization.

Database adapter note:

- EventLog should be append-oriented in production.
- If idempotency is needed later, add a separate event idempotency key rather than weakening the current append behavior.

## Service-Level Contracts

Some MVP behaviors are intentionally broader than a single repository method.

### `submitPost(repository, input)`

Guarantees:

- Creates one Post.
- Persists it through the repository boundary.
- Records one `post_created` EventLog.
- The resulting state includes the new Post immediately.

Future database adapter note:

- Post insert and EventLog insert should commit together.

### `publishZineForCycle(repository, input)`

Guarantees:

- Does nothing if the cycle has fewer than 4 Posts.
- Generates one ZINE draft from cycle Posts and Themes.
- Persists one ZINE.
- Replaces ZINE pages for that ZINE.
- Sets the ZineCycle status to `published`.
- Records one `zine_published` EventLog.

Future database adapter note:

- The following writes must be atomic:
  - `zine_cycles`
  - `zines`
  - `zine_pages`
  - `event_logs`

## Adapter Implementation Checklist

Before a future adapter is considered compatible:

- It maps storage rows to `@mewri/core` domain models.
- It passes `describeMewriRepositoryContract()`.
- It does not expose adapter-specific handles to `apps/web`.
- It preserves required ordering for Posts, ZINE pages, and EventLogs.
- It prevents duplicate records for `upsert()` by `id`.
- It enforces parent filters without cross-group or cross-theme leakage.
- It treats ZINE publish as an atomic service-level operation.

The recommended readiness sequence before implementing that adapter is documented in `docs/mewri_mvp_v0_5_database_readiness.md`.


