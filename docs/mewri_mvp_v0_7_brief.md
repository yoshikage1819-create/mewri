# Mewri MVP v0.7 Brief

Date: 2026-05-22

## Purpose

MVP v0.7 should make the current MVP clearer, more testable, and more ready for real user feedback without expanding the product into unsupported social features.

The priority is not major visual redesign. The priority is making the current MVP loop understandable in Japanese and reliable on both mobile and desktop.

## Primary Goals

1. Keep visible UI copy natural in Japanese.
2. Make the posting rule explicit: users can post only to today's Theme.
3. Keep mobile and desktop layouts stable.
4. Keep future discovery and follow-related areas clearly placeholder-only.
5. Add only small UX improvements that support the existing MVP loop.

## Required Scope

v0.7 may refine:

- visible UI copy
- empty states
- loading states
- form helper text
- button labels
- placeholder explanations
- mobile/desktop spacing only where it affects usability
- local demo usability

v0.7 should not add:

- authentication
- real follows
- notifications
- comments or DMs
- public discovery
- production database writes
- real image upload storage

## Japanese Copy Direction

The UI should feel like a thoughtful ZINE-making tool.

Tone:

- clear
- calm
- editorial
- not overly cute
- not enterprise-like
- not generic SNS language

Suggested section labels:

- Active ZINE -> 参加中のZINE
- Today's Theme -> 今日のテーマ
- Post to today -> 今日の投稿をする
- Everyone's posts stack -> みんなの投稿
- Same-theme posts -> 進行中ZINEのみんなの投稿
- Relevant updates -> フォロー中ユーザーの投稿
- Discovery and circulation -> 発見と回遊

## v0.7 Home Flow Adjustments

The home flow keeps the same broad order but refines what each section means:

1. `参加中のZINE`
   - Shows today's Theme and the primary posting action.
   - Users can post only to today's Theme.
   - Do not expose the full 3-day cycle as a primary UI object.
   - Immediately after `今日の投稿をする`, show a small photo-stack link labeled `みんなの投稿`.
   - The photo stack links to `進行中ZINEのみんなの投稿`.
2. `進行中ZINEのみんなの投稿`
   - Shows posts in the active ZINE that contains today's Theme.
   - Users can view today's Theme and already-closed Themes.
   - Scheduled future Themes should not be shown as posting targets.
   - Closed Themes are read-only in practice because posting is locked to today's Theme.
   - ZINE generation status can live here as a secondary MVP utility.
3. `フォロー中ユーザーの投稿`
   - Future-facing section for posts by followed users.
   - In MVP, this must stay placeholder-only because follows are not implemented.
4. `発見と回遊`
   - Future-facing discovery and circulation area.
   - In MVP, this must stay placeholder-only.

## Critical UX Position

Fine visual polish is not the main v0.7 task.

The correct next step is to remove ambiguity:

- users should know what to do first
- users should understand that only today's Theme can be posted to
- users should understand that image upload is not implemented yet
- users should understand placeholder sections are future-facing
- users should be able to complete the demo loop on a phone

If visual refinement conflicts with product clarity, product clarity wins.

## Acceptance Criteria

v0.7 is complete when:

- all visible primary UI copy is Japanese
- the section order remains understandable
- posting is locked to today's Theme
- closed Theme posts remain viewable from `みんなの投稿`
- scheduled future Themes are not presented as posting targets
- sample image posting still works on phone
- ZINE generation still works after enough posts exist
- follow and discovery modules are clearly marked as future/demo-only
- `npm.cmd run typecheck` passes
- `npm.cmd run build` passes
