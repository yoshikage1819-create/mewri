# Mewri Post-First and Host Theme Strategy

Version: v0.9 planning draft
Status: design only
Last updated: 2026-05-22

## Purpose

This document defines how Mewri should handle posting beyond the current AI daily theme without breaking the MVP concept.

The current MVP is intentionally theme-first:

- A user joins an active ZINE/group.
- The user sees today's theme.
- The user posts to today's theme.
- The post becomes part of the active ZINE context.

That flow is rational for the MVP because it keeps the first action clear. However, it creates one important tension:

- Users may ask, "Can I post something that is not today's theme?"
- Hosts may want to create their own group themes.
- A user may want one post to later belong to another ZINE or group.

The strategy is to add those paths gradually, without turning the home screen into a generic SNS feed.

## Critical Reasoning

The wrong implementation would be to make every post free-floating immediately. That would solve flexibility, but it would weaken Mewri's core idea: posts gain meaning by becoming part of a theme and later a ZINE.

The better implementation is staged:

- Keep the MVP theme-first.
- Add human host-created themes before full post-first posting.
- Add a special personal theme called `自分の投稿` as a safe bridge.
- Only later consider true post-first posting if real users keep needing it.

## Current MVP Boundary

In v0.7/v0.8, posting should remain limited to the active daily theme.

Allowed now:

- Post to today's active AI theme.
- View posts from the active ZINE.
- View already closed themes inside that active ZINE.
- Generate a ZINE from eligible posts.

Not allowed yet:

- Posting to future/scheduled themes.
- Posting to arbitrary user-created themes.
- Posting without any theme.
- Attaching one post to many ZINEs/groups.
- Moving posts between themes.

This is not a product limitation forever. It is a clarity choice for the beta.

## Host-Created Themes

Host-created themes are the first major expansion after the stable MVP.

Host-created themes should mean:

- A human host creates a theme for a specific group.
- The theme has a time window.
- Users still post inside a theme.
- The theme can later contribute to a ZINE.

This keeps Mewri theme-first while allowing non-AI group activity.

Host themes should not initially mean:

- Any user can create unlimited public themes.
- Themes become hashtags.
- Posts become public by default.
- The home screen becomes a global discovery feed.

## Post-First Posting

Post-first means a user creates a post before choosing a final theme/ZINE.

This is useful because it matches natural behavior:

- The user has a photo now.
- The user may not know where it belongs yet.
- The user may want to organize it later.

But it is risky for Mewri because it can turn the product into a camera roll or generic photo SNS.

Post-first should be considered only after:

- Daily theme posting is understandable to testers.
- Host-created themes are designed.
- There is a clear rule for whether a post is moved, copied, or linked.
- Privacy and visibility rules are explicit.

## Recommended Bridge: `自分の投稿`

Instead of implementing full post-first immediately, add a special theme option called `自分の投稿`.

Conceptually:

- `自分の投稿` is a personal inbox theme.
- It lets the user post when today's theme does not fit.
- It still satisfies the current data model requirement that every post has a `themeId`.
- It can later be moved into another theme.

This gives users freedom without breaking the theme-first architecture.

## Data Model Implication

The current model has:

- `ThemeSource = "ai" | "host" | "admin"`
- `Post.themeId`

This is enough for the MVP, but not enough to distinguish what kind of theme something is.

Future model should separate:

- `source`: who created the theme.
- `kind`: what role the theme plays.

Possible future values:

```ts
type ThemeSource = "ai" | "host" | "admin" | "system";
type ThemeKind = "daily" | "host_prompt" | "personal_inbox";
```

This distinction matters because `自分の投稿` should not behave like an ordinary theme.

## Move, Copy, or Link

The first implementation should use move, not copy.

Move means:

- A post starts in `自分の投稿`.
- The user later moves it into one real theme.
- The original personal inbox assignment is replaced.

Move is simpler and safer for beta.

Copy/link should wait because it creates harder questions:

- Can one post appear in multiple ZINEs?
- Does deleting the original remove all appearances?
- Which group owns comments or reactions?
- How does visibility work if one group is private and another is public?

## Suggested Roadmap

v0.8:

- Keep current MVP stable.
- Run nearby beta tests.
- Do not add new posting modes yet.

v0.9:

- Design host-created themes.
- Design `自分の投稿` as a personal inbox theme.
- Add UI copy or placeholder only if it does not confuse the MVP.

v0.10:

- Prototype host theme creation for one group.
- Prototype `自分の投稿` as a non-ZINE-generating posting target.

v1.0+:

- Add post movement from `自分の投稿` to a real theme.
- Consider multi-group/multi-ZINE linking only after the move behavior is tested.

## Acceptance Criteria For Future Implementation

Host-created themes are ready when:

- A host can create a theme for a group.
- Non-host users can clearly distinguish host themes from AI daily themes.
- Posts still belong to one clear theme.
- The home screen does not become cluttered.

`自分の投稿` is ready when:

- It is clearly labeled as private/personal.
- It does not count toward ZINE generation by default.
- It can later be moved into a real theme.
- Users understand that it is different from today's public/group theme.

Post-first is ready only if:

- Testers repeatedly want to post without choosing any theme.
- The product can explain where that post lives.
- Visibility and ownership are solved.
- ZINE generation rules remain coherent.

## Decision

For now, Mewri should remain theme-first.

The next flexible posting path should not be true post-first. It should be:

1. Host-created themes.
2. `自分の投稿` as a special personal inbox theme.
3. Move from `自分の投稿` to a real theme.
4. Multi-theme or multi-ZINE linking only after beta learning.

