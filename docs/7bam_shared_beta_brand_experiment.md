# 7bam Shared Beta Brand Experiment

Updated: 2026-06-22

## Purpose

This document defines a reversible display-brand experiment for the closed
shared beta experience.

The experiment tests whether `7bam` is easier to remember, explain, and share
than the current product name when friends encounter the shared photo-to-ZINE
experience.

## Scope

This is shared-beta user-facing display branding only.

The internal technical name remains `Mewri`.

## Temporary Display Brand

| Field | Value |
| --- | --- |
| Display name | `7bam` |
| Recommended visible form | `7bam beta` |
| Reading | `セブンバム` |
| Experiment label | `試験名称` |
| Temporary tagline | `みんなの今日が、あとで一冊になる。` |

Current explanation:

- `7` represents the seven colors of a rainbow.
- The product turns different people's daily photos into one shared album /
  ZINE.

Compact optional explanation:

```text
7は虹の7色。友人それぞれの今日が集まり、あとで一冊になるサービス名を試しています。
```

## Surfaces Changed

- Shared-beta-configured metadata title resolves to:
  `7bam beta | みんなの今日が、あとで一冊になる。`
- Shared-beta-configured metadata description describes the invited shared beta.
- A pure UI-owned brand resolver was added under `apps/web/src/app/brand.ts`.

These changes are display-only. They do not activate shared mode.

## Surfaces Deliberately Not Changed

The following remain `Mewri` or otherwise unchanged:

- GitHub repository name
- local worktree names
- package scopes such as `@mewri/core` and `@mewri/data`
- TypeScript names such as `MewriState`
- API route paths
- database tables and columns
- Supabase project/resources
- Storage buckets
- RPC names
- environment-variable names
- migration filenames
- event names
- test fixture IDs
- local-demo root UI wordmark and copy
- production branding

The current local-demo root page still displays `Mewri` because it is the
browser-local demo, not a shared-beta UI.

## Feedback Questions

These questions should be used only in an existing feedback flow or interview
script. Do not add a new analytics provider, database table, or personal-data
store for this experiment.

1. `7bamを何と読みましたか？`
2. `名前からどんなサービスを想像しましたか？`
3. `使ってみたい名前だと感じますか？`
4. `友人に紹介しやすい名前ですか？`
5. `Mewriと7bamなら、どちらが合うと思いますか？`

## Success Criteria

- At least 80% of testers read it as `セブンバム`.
- Fewer than 20% describe it as clearly negative or embarrassing.
- At least 60% connect it to photos, friends, memory, album, or ZINE after
  seeing the product.
- 5-minute name recall is at least 70%.
- A majority of shared-beta testers prefer it over `Mewri`.
- No accessibility regression.
- No confusion that `beta` is part of the permanent name.

## Rollback

Rollback should require only one of:

- switch the shared-beta brand resolver back to `Mewri`, or
- revert this UI/docs/test-only change.

Rollback must not require:

- database migration
- data rewriting
- Storage changes
- API changes
- Supabase configuration changes
- package renaming

## Safety Statement

This experiment does not approve shared mode activation, deployment,
production changes, migration application, new secret handling, auth changes,
RLS changes, Storage policy changes, RPC changes, API security changes, or beta
user communication.
