# Mewri MVP v0.4 Testing Plan

## Purpose

MVP v0.4 prepares Mewri for a future production database by protecting the current group-first MVP behavior behind a repository and service boundary. The tests keep product logic in `packages/core`, keep persistence details in `packages/data`, and make sure `apps/web` can continue to use the app without knowing whether state is backed by localStorage, memory, or a later database adapter.

## What is tested

- 3-day `ZineCycle` creation creates one active cycle with exactly three daily Themes.
- Daily Theme status is calculated as `closed`, `active`, or `scheduled` based on the current day.
- ZINE generation remains blocked until there are at least 4 Posts.
- Generated ZINE pages are created in stable chronological Post order.
- Generated ZINE metadata keeps the expected cycle, group, cover Post, and published status shape.
- EventLog creation keeps the expected audit shape, including user, group, event name, entity, metadata, and timestamp.
- The repository loads the demo seed state with one demo Group, one demo User, one cycle, three Themes, no Posts, and a seed EventLog.
- Posts can be added through the repository-backed service boundary and appear immediately in persisted state.
- ZINE records and ZINE pages can be persisted through repository methods, with pages read back in page-number order.
- Reset restores demo seed state and removes Posts, ZINEs, and ZINE pages.
- The repository interface exposed to `apps/web` does not expose localStorage implementation details such as storage keys or direct storage objects.

## What is intentionally not tested yet

- Authentication, identity providers, sessions, roles beyond the demo owner, or permission enforcement.
- Real image upload, file validation, asset storage, or CDN behavior.
- Follows, comments, DMs, notifications, public Discover, payments, or printing.
- Production database connectivity, migrations, query performance, transactions, or row-level security.
- Multi-device sync, realtime updates, offline conflict resolution, or cache invalidation.
- Browser end-to-end coverage for every UI state. v0.4 focuses on core rules and data boundaries first.

## Production database preparation

The repository interface now gives Mewri a stable application boundary:

- `packages/core` owns product rules such as Theme timing and ZINE generation.
- `packages/data` owns persistence boundaries, seed state, adapter implementations, and app-level mutations.
- `apps/web` consumes repository and service functions instead of depending on localStorage details.
- The in-memory adapter lets tests exercise repository behavior without a browser or database.

When a production database is added, a database-backed adapter can implement the same `MewriRepository` shape. The existing tests should still pass against memory and can be expanded to run as contract tests against the database adapter.

The future database table, index, constraint, and transaction notes are captured in `docs/mewri_data_model_v0_4.md`.

The recommended next-step database readiness plan is captured in `docs/mewri_mvp_v0_5_database_readiness.md`.

## Repository contract tests

The repository behavior tests are now structured as a reusable contract in `packages/data/src/repository-contract.test-helper.ts`.

The method-by-method repository guarantees are documented in `docs/mewri_repository_contract_v0_4.md`.

Current coverage runs the contract against `createMemoryRepository()`. A future database adapter should add a small adapter-specific test file that calls the same helper:

```ts
import { describeMewriRepositoryContract } from "./repository-contract.test-helper";
import { createProductionRepositoryForTest } from "./production-repository-test-adapter";

describeMewriRepositoryContract("production database", () => createProductionRepositoryForTest());
```

That keeps the important MVP guarantees adapter-agnostic:

- seed state shape
- Post persistence through the service boundary
- ZINE and ZINE page persistence
- ZINE publish behavior after the 4-Post minimum
- reset behavior for test/demo environments
- no localStorage-specific surface leaking into `apps/web`
- upsert behavior inserts or updates by id without creating duplicate rows
- parent-id filters for group members, themes, posts, cycles, zines, and event logs
- feed ordering for `posts.prepend()` while replacing duplicate Post ids
- `zinePages.replaceForZine()` replaces only the target ZINE's pages and keeps other ZINE pages intact

Before using the contract against a real database, the test adapter should create an isolated test database/schema or transaction per test run. The contract assumes each test starts from the demo seed state.

## Risks before auth and database storage

- The demo user is still trusted client-side state, so there is no real access control.
- localStorage remains the browser persistence adapter, so data is device-local and user-editable.
- EventLog entries are useful for MVP behavior checks but are not tamper-proof audit records.
- ZINE publish is not transactional across a real database yet; the future adapter must persist cycle, zine, pages, and event log consistently.
- Theme and cycle generation are date-sensitive; database storage should normalize timezone expectations before production use.
- Image URLs are still plain user-provided strings, with no upload pipeline or moderation layer.

## Commands

Run the v0.4 verification set with:

```bash
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```


