# Mewri Theme Modes Strategy

Version: v0.9 planning draft
Status: design only
Last updated: 2026-05-22

## Purpose

Mewri needs more than one kind of theme, but it should not expose all theme types at once.

This document separates theme modes so future implementation can expand without weakening the MVP.

## Current Principle

The MVP is built around one clear behavior:

Post to today's theme in the active ZINE.

This is correct because it gives the user a single obvious next action. The first beta should not make users choose between many posting destinations before they understand what Mewri is.

## Theme Modes

### 1. Daily AI Theme

Role:

- The main MVP posting destination.
- Generated from time, weather, place, or other contextual conditions.
- One active daily theme should be emphasized at a time.

UI priority:

- Highest.
- Should live in `参加中のZINE`.
- Should power the primary CTA: `今日の投稿をする`.

Rules:

- Users can post only to the active daily theme in the current MVP.
- Scheduled future themes should not be postable.
- Closed themes should be viewable from `みんなの投稿`, not used as posting destinations.

### 2. Host Theme

Role:

- A human host creates a theme for a specific group.
- It supports intentional group activity outside the AI daily theme.

UI priority:

- Medium after MVP is stable.
- Should not replace today's AI theme on the home screen until tested.

Rules:

- Still theme-first.
- Still group-bound.
- Should have a visible host name or host label.
- Should have a time window.

Risk:

- If added too early, users may not understand whether Mewri is AI theme-led, host-led, or just a group posting app.

### 3. Personal Inbox Theme: `自分の投稿`

Role:

- A safety valve for posts that do not fit today's theme.
- Lets the user post without breaking the current requirement that posts belong to a theme.

UI priority:

- Low to medium.
- Should not compete visually with today's theme.
- Should be framed as personal/private, not as another public group theme.

Rules:

- Does not count toward ZINE generation by default.
- Can later be moved to a real theme.
- Should not appear as a normal group theme in public theme lists.

Risk:

- If it looks like a normal theme, users may misunderstand Mewri as a personal scrapbook first and a ZINE collaboration tool second.

## Recommended Data Shape

Current:

```ts
type ThemeSource = "ai" | "host" | "admin";
```

Recommended future addition:

```ts
type ThemeKind = "daily" | "host_prompt" | "personal_inbox";
```

Why:

- `source` answers who created it.
- `kind` answers how it behaves.

Examples:

- AI daily theme: `source: "ai"`, `kind: "daily"`
- Host-created group theme: `source: "host"`, `kind: "host_prompt"`
- Personal inbox: `source: "system"`, `kind: "personal_inbox"`

## Home Screen Implication

The home screen should keep this hierarchy:

1. `参加中のZINE`
2. Today's active theme and post CTA
3. `みんなの投稿`
4. Follow/user-related updates
5. Discovery/circulation placeholders

Future host and personal inbox entry points should be secondary:

- Host theme entry can appear inside group/ZINE management later.
- `自分の投稿` can appear as a small alternative inside the post form or a secondary action.

They should not be placed above today's theme.

## What Not To Do

Do not:

- Show every available theme as equal on the home screen.
- Let scheduled future themes become posting targets.
- Let `自分の投稿` contribute to ZINE generation without explicit user action.
- Present host themes as public discovery before group and permission rules exist.
- Add multi-ZINE posting before single-theme movement is understood.

## Decision

Mewri should support multiple theme modes eventually, but v0.9 should treat them as design seams, not full product features.

The next implementation-ready direction is:

- Preserve daily AI theme as the primary flow.
- Design host theme creation as a group-level expansion.
- Design `自分の投稿` as a special personal inbox.
- Delay true post-first and multi-ZINE linking.

