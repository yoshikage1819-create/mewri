# Mewri MVP v0.5 Database Readiness

## Purpose

MVP v0.5 should prepare Mewri to add a production database adapter without changing the current product surface. This is a readiness step, not a database integration step.

The goal is to make the next implementation phase boring in the best way: clear adapter boundaries, clear test expectations, clear transaction boundaries, and no accidental expansion into auth, upload, public social features, payments, or printing.

## Inputs From v0.4

Use these documents as the source of truth before implementing any database adapter:

- `docs/mewri_repository_contract_v0_4.md`
- `docs/mewri_data_model_v0_4.md`
- `docs/mewri_mvp_v0_4_testing_plan.md`
- `packages/data/src/repository.ts`
- `packages/data/src/repository-contract.test-helper.ts`

v0.5 should not weaken any v0.4 contract guarantees.

## Non-Goals

Do not add these in v0.5:

- Authentication
- Real image upload
- Follows, comments, DMs, notifications, or public discovery
- Payments, printing, fulfillment, or physical ZINE ordering
- Feed ranking or recommendations
- AI provider integration
- Production user permissions
- Row Level Security policies

These are future product and infrastructure steps. v0.5 is only about making storage replaceable and safe to evolve.

## Recommended Implementation Order

### 1. Keep the current adapters as the baseline

Current adapters:

- `createMemoryRepository()` for tests
- `createBrowserLocalRepository()` for the browser MVP

These should keep passing all current tests. They are the known-good reference behavior.

### 2. Add database row mapping types before adding a database dependency

Create a small internal mapping layer in `packages/data` before connecting to a real DB.

Recommended files:

- `packages/data/src/db-row-types.ts`
- `packages/data/src/db-mappers.ts`
- `packages/data/src/db-mappers.test.ts`

Purpose:

- Keep database snake_case rows separate from domain camelCase models.
- Verify every table maps cleanly to `@mewri/core` types.
- Catch timestamp/date/string shape problems before networked database code enters the app.

This can be done with plain TypeScript objects and tests. No Supabase or Postgres dependency is needed yet.

Current status:

- Added `packages/data/src/db-row-types.ts`.
- Added `packages/data/src/db-mappers.ts`.
- Added `packages/data/src/db-mappers.test.ts`.
- Mapper tests cover seed-state roundtrip, snake_case row shape, nullable database fields, optional domain fields, ZINE fields, ZINE page fields, and EventLog metadata.
- Added `docs/mewri_database_migration_sketch_v0_5.md` as a Postgres/Supabase-oriented SQL draft for the future production schema, still without adding or connecting to a database.

### 3. Add a database adapter skeleton behind a feature boundary

Only after mapping tests exist, add a placeholder adapter shape.

Recommended file:

- `packages/data/src/database-repository.ts`

At first, this can export only types or a factory that throws a clear "not configured" error. The point is to define where the adapter will live, not to connect it yet.

Do not import this adapter from `apps/web` until it can pass the contract tests.

Current v0.5 status:

- `packages/data/src/database-repository.ts` now exists as an explicit placeholder boundary for a future database-backed `MewriRepository`.
- `packages/data/src/server-repository-factory.ts` now exists as the server-side repository selection seam.

The factory currently supports:

- `mode: "memory_demo"` for the current local/demo-safe server path
- `mode: "database"` as an explicit future mode that throws until a real adapter exists

Why this still adds no database dependency:

- No Postgres/Supabase client is installed
- No connection string is used
- No network/database connection is attempted
- Database mode fails fast instead of silently falling back

### 4. Add contract-test wiring for database-shaped adapters

Create an adapter-specific test file that exercises the repository contract through a database-shaped boundary.

Recommended shape:

```ts
import { describeMewriRepositoryContract } from "./repository-contract.test-helper";
import { createDatabaseRepositoryForTest } from "./database-repository-test-adapter";

describeMewriRepositoryContract("database", () => createDatabaseRepositoryForTest());
```

Requirements:

- Each test starts from the demo seed state.
- Tests do not share mutable state.
- Normal `npm.cmd test` should remain fast and reliable without external services.

Current files:

- `packages/data/src/database-repository.contract.test.ts`
- `packages/data/src/database-repository-test-adapter.ts`
- `packages/data/src/database-repository.ts` test-harness mode

The active harness currently does this:

- runs `describeMewriRepositoryContract()` against an isolated in-memory, database-shaped repository
- starts each repository instance from the demo seed state
- stores snake_case DB rows internally
- maps rows back to domain models through the existing mapper layer

Future external database contract tests should later replace or extend this harness with a real isolated database-backed test adapter that:

- creates or connects to an isolated test database
- starts each test from the demo seed state
- does not share mutable state across tests
- still returns the existing `MewriRepository` interface rather than raw database rows
- maps through the existing row/domain mapper layer instead of leaking raw DB rows

Current v0.5 test-only adapter status:

- `createDatabaseRepository({ purpose: "contract_test" | "test_harness" })` now returns an isolated in-memory, database-shaped harness.
- The harness stores snake_case DB rows internally and maps back to domain models on load/save.
- `packages/data/src/database-repository.contract.test.ts` now runs the repository contract suite against this harness.

Why this is still not production storage:

- No SQL engine exists
- No network connection exists
- No external service exists
- No transaction enforcement exists beyond current in-memory semantics
- Server runtime `database` mode still throws until a real adapter is implemented

### 5. Move trusted writes server-side before real multi-user storage

Before a production database stores real user data, the write paths should move out of direct browser control.

Candidate write paths:

- `submitPost()`
- `publishZineForCycle()`
- future group setup / cycle setup actions

Preferred Next.js shape:

- Server action or API route calls a repository/service function.
- Browser UI submits intent.
- Server validates current user and group membership once auth exists.
- Repository persists only after validation.

Do not add auth in v0.5, but design this seam so auth can be inserted later without rewriting product logic.

Current v0.5 boundary:

- `packages/data/src/mewri-app-service.ts`

This file now provides a small application-service boundary around the current repository:

- `commands.submitPost({ context, input })`
- `commands.publishZineForCycle({ context, input })`
- `load()`
- `demo.reset()`
- `demo.replaceState(state)`

The browser MVP can call this boundary now, and a future server action or API route can call the same boundary later with a different repository implementation behind it.

Separation of responsibilities:

- `demo.*` is for local MVP-only controls such as reset and direct state replacement for demo workflows.
- `commands.*` is the production-intended write seam for intent-based operations.
- `context.currentUserId` is present as a future auth hook, but it is not enforced yet.

Future server-side shape:

- Browser submits intent to a server action or API route.
- Server action or API route builds `context` from the authenticated user.
- `commands.submitPost()` can later validate theme ownership, current-user identity, and group membership before writing.
- `commands.publishZineForCycle()` can later validate publish permissions and run a transactional repository implementation.

Current request-to-command seam:

- `packages/data/src/mewri-command-caller.ts`

This pure caller module is the intended bridge for a future Next.js server action or API route:

1. Receive request input in the framework layer.
2. Derive `authenticatedUserId` and request source.
3. Call `createMewriCommandCaller(appService)`.
4. Delegate to `commands.submitPost()` or `commands.publishZineForCycle()`.

This caller layer does not import Next.js APIs, does not implement auth, and does not validate membership yet. Its job is only to translate request-like input into `MewriCommandContext` and preserve the command boundary.

Future implementation path for real database runtime:

1. Implement `createDatabaseRepository()` in `packages/data/src/database-repository.ts`.
2. Keep the adapter behind `createServerRepository({ mode: "database" })`.
3. Preserve the same `MewriAppService` and `createMewriCommandCaller()` APIs.
4. Ensure database writes for submit and publish respect the documented transaction boundaries.
5. Add a real isolated database-backed contract-test adapter once an external database is introduced.

The repository contract already runs against the active test-only harness. What remains is a real database-backed implementation behind server runtime `database` mode and, later, optional external database contract tests.

## Adapter Compatibility Checklist

A future database adapter is not ready until it satisfies all of this:

- Implements the full `MewriRepository` interface.
- Returns `@mewri/core` domain models, not database rows.
- Keeps localStorage details out of `apps/web`.
- Passes `describeMewriRepositoryContract()`.
- Preserves `posts.prepend()` feed-immediate behavior.
- Preserves `zinePages.listByZineId()` page-number ordering.
- Preserves `zinePages.replaceForZine()` target-only replacement.
- Uses unique IDs to prevent duplicate upsert rows.
- Enforces parent filters without leaking other groups, themes, users, cycles, or zines.
- Treats ZINE publish as one atomic write boundary.
- Has an isolated test setup that can reset to seed state safely.

## Required Transaction Boundaries

### Submit Post

Writes:

- `posts`
- `event_logs`

Must commit together.

Failure behavior:

- If the Post cannot be written, no `post_created` EventLog should be written.
- If the EventLog cannot be written, the Post should not be committed for production storage.

Validation before write:

- Theme exists.
- Theme belongs to the target Group.
- User exists.
- Once auth exists, User is a GroupMember.

### Publish ZINE

Writes:

- `zine_cycles`
- `zines`
- `zine_pages`
- `event_logs`

Must commit together.

Required behavior:

- Do not publish with fewer than 4 cycle Posts.
- Do not create more than one ZINE for the same ZineCycle.
- Replace pages for the target ZINE instead of appending duplicates.
- Keep page order stable through `page_number`.
- Record `zine_published` only if the ZINE publish actually commits.

Failure behavior:

- If page replacement fails, do not leave the ZineCycle marked `published`.
- If EventLog insert fails, do not leave a partially published ZINE.
- If concurrent publish attempts occur, one should win cleanly and the final state should still satisfy the one-ZINE-per-cycle rule.

Recommended database mechanism:

- Transaction
- Lock target `zine_cycles` row or equivalent
- Unique constraint on `zines.zine_cycle_id`
- Unique constraint on `zine_pages(zine_id, page_number)`

## Auth Before Database: What Remains Unsafe

It is technically possible to add a database before auth, but it must be treated as demo-only unless writes are server-controlled.

Unsafe before auth:

- User identity can be spoofed by the client.
- Group membership cannot be trusted.
- Posts can be attributed to the wrong user.
- EventLog is not audit-grade.
- A browser client could attempt writes outside the intended group.

Acceptable before auth:

- Local development database.
- Demo-only hosted prototype with seeded data.
- Contract-test database.
- Internal review build where data is disposable.

Not acceptable before auth:

- Real user data.
- Public write access.
- Public group discovery.
- Permanent audit claims.

## Database Choice Notes

v0.5 should not choose a vendor unless implementation is starting immediately.

### Supabase later

Pros:

- Postgres base
- Auth and storage can be added later
- RLS can eventually align with `group_members`

Risks:

- Adding Supabase too early can blur the current no-auth boundary.
- Client-side Supabase writes would be unsafe before RLS/auth are designed.

### Plain Postgres later

Pros:

- Clean service-side repository implementation
- Strong transaction semantics
- Easy to keep browser away from direct writes

Risks:

- Requires choosing hosting, migration workflow, and connection management.
- Auth and object storage remain separate decisions.

## Suggested v0.5 Work Items

Recommended next implementation tasks:

1. Add DB row type definitions and pure row/domain mappers.
2. Add mapper tests for all current entities.
3. Add a migration sketch document or SQL draft based on `mewri_data_model_v0_4.md`.
4. Add a database-shaped contract-test harness.
5. Decide whether the first real adapter should be Supabase or server-side Postgres.

Do not start with a live database connection. Start with mappers and test seams.

The migration sketch now lives in `docs/mewri_database_migration_sketch_v0_5.md`. It documents draft SQL, indexes, constraints, deferred auth/storage work, and the ZINE publish transaction boundary for a future adapter.

The active database-shaped contract suite now lives in `packages/data/src/database-repository.contract.test.ts`. It runs against the in-memory test harness in `packages/data/src/database-repository.ts`. Real server runtime `database` mode still throws, and a future external database contract suite can be added later when an isolated database exists.

## Acceptance Criteria for v0.5 Readiness

Readiness is met when:

- No MVP behavior changes.
- No new social/product features are added.
- No production database dependency is required for normal local development.
- `npm.cmd test` still runs without external services.
- Database row/domain mapping is covered by tests.
- Repository contract can be reused by a future DB adapter.
- ZINE publish transaction requirements are documented and reflected in the adapter design.

## Recommended First PR for v0.5

The first concrete v0.5 PR should be:

- Add `db-row-types.ts`
- Add `db-mappers.ts`
- Add `db-mappers.test.ts`
- Keep all mapping logic pure
- Do not connect to a database
- Do not touch `apps/web`

This gives the project a real bridge from current domain models to future tables while keeping the system calm and testable.

Status: complete for the pure mapper layer, migration sketch, database-shaped contract-test harness, split app-service boundary, server-action-ready command caller seam, and explicit database repository skeleton/factory shape. The next implementation step is a real isolated database adapter for server runtime `database` mode plus authenticated server callers that add validation before using a transactional repository, still without exposing database details to `apps/web`.


