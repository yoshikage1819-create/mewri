# Mewri

Mewri is a group-first photo product where daily themes become a collaborative
digital ZINE.

## Current Status

- Working product: browser-local v0.9 demo using `localStorage`.
- In progress: v0.10 closed shared beta foundation for invited small groups.
- Not live: Supabase shared mode, authenticated uploads, and shared database.

Start with [`docs/README.md`](docs/README.md) for the current source-of-truth
documents and implementation status.

## Project Shape

```text
apps/web          Next.js web app
packages/core     Product domain models and MVP logic
packages/data     Repository boundary and local MVP adapter
docs              Product planning documents
```

The first implementation intentionally keeps infrastructure light while preserving boundaries that can later move to Postgres, object storage, queues, and AI workers.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

