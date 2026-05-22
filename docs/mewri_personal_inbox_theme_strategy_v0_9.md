# Mewri Personal Inbox Theme Strategy

Version: v0.9 planning draft
Status: design only
Last updated: 2026-05-22

## Purpose

This document defines `自分の投稿`, a special posting destination for moments when a user wants to post but the current daily theme does not fit.

It is a bridge between the current theme-first MVP and a future, more flexible posting system.

## Concept

`自分の投稿` is not a normal theme.

It is a personal inbox theme:

- The user can post into it when no active theme fits.
- The post remains owned by the user.
- The post is not automatically part of a group ZINE.
- The post can later be moved into a real theme.

This keeps the app flexible without becoming fully post-first.

## Why This Is Rational

The current MVP says: post to today's theme.

That is clear, but it can feel restrictive. Users may have good photos that do not match the AI theme.

`自分の投稿` solves the emotional problem without breaking the architecture:

- Users are not blocked from posting.
- Every post still has a `themeId`.
- The product still teaches that posts belong to themes.
- ZINE generation remains clean because personal inbox posts do not automatically count.

## Critical Risks

Risk 1: It may weaken today's theme.

Mitigation:

- Keep `今日の投稿をする` as the primary CTA.
- Present `自分の投稿` as a secondary route.

Risk 2: It may look like a normal public theme.

Mitigation:

- Label it clearly as personal.
- Do not show it in group theme lists.
- Do not include it in `みんなの投稿`.

Risk 3: It may pollute ZINE generation.

Mitigation:

- Personal inbox posts are excluded from ZINE generation by default.
- A post must be moved into a real theme before it becomes ZINE-eligible.

Risk 4: Moving later may become confusing.

Mitigation:

- Start with one simple action: `テーマに移す`.
- Avoid copy/link until later.

## Initial UX

The first UI should be very small.

Possible placement:

- Inside the post form, below the locked today's theme display.

Possible copy:

- Primary: `今日のテーマに投稿する`
- Secondary: `テーマに合わない投稿は「自分の投稿」に保存`

Avoid:

- Making `自分の投稿` look like a competing theme card.
- Placing it above today's theme.
- Showing it in discovery.

## Behavior Rules

Initial behavior:

- User chooses `自分の投稿`.
- User submits image URL/caption.
- Post is stored under a personal inbox theme.
- Post appears in a personal area or future management screen.

Not included initially:

- Multi-group assignment.
- Multi-ZINE assignment.
- Public discovery.
- Comments/reactions.
- Automatic AI classification into themes.

## Future Move Flow

Later, a user can move a post:

1. Open `自分の投稿`.
2. Select a post.
3. Choose `テーマに移す`.
4. Pick one eligible active or host theme.
5. Confirm move.

After move:

- The post's theme association changes.
- It becomes eligible for that theme's ZINE rules.
- It leaves the personal inbox list.

## Data Model Notes

The simple future model:

```ts
type ThemeKind = "daily" | "host_prompt" | "personal_inbox";
```

Personal inbox theme:

```ts
{
  source: "system",
  kind: "personal_inbox",
  status: "active"
}
```

The `Post` can keep `themeId` required at first.

Do not introduce a many-to-many post/theme relation until moving has been tested.

## Acceptance Criteria

`自分の投稿` is acceptable when:

- A user understands it is personal and secondary.
- Today's theme remains the main flow.
- Personal inbox posts do not appear inside `みんなの投稿`.
- Personal inbox posts do not count toward ZINE generation.
- A future move action can be added without rewriting the whole data model.

## Decision

Mewri should not jump directly to full post-first posting.

Instead, v0.9/v0.10 should prepare `自分の投稿` as a controlled personal inbox theme.

