# Mewri

Mewri is a social product where daily photo themes become a collaborative digital ZINE every 3 days in MVP v0.

## MVP v0 Direction

- Daily `Theme`
- Lightweight `Post`
- 3-day `ZineCycle` Option A
- AI-assisted, human-meaning ZINE creation
- Group-first, SNS expansion later

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
```

