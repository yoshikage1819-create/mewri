# Mewri Post Routing Roadmap

Version: v0.9 planning draft
Status: design only
Last updated: 2026-05-22

## Purpose

This roadmap defines when to add new posting destinations without destabilizing the MVP.

## Current Baseline

The current stable direction is:

- One active daily theme is the main posting target.
- `参加中のZINE` owns the main action.
- `みんなの投稿` opens posts from the active ZINE, including closed themes.
- Future discovery/follow behavior stays placeholder-only until real data and permissions exist.

This baseline should not be disturbed before nearby beta testing.

## Stage 1: v0.8 Nearby Beta

Goal:

- Confirm that testers understand the current flow.

Questions:

- Do users understand what to do first?
- Do users understand that today's theme is the posting target?
- Do users expect to post outside today's theme?
- Do users understand what `みんなの投稿` contains?
- Do users understand when ZINE generation becomes available?

No new posting mode should be added in this stage unless testers are blocked.

## Stage 2: v0.9 Design Seams

Goal:

- Prepare the product for host themes and personal inbox posting.

Work:

- Add design docs for theme modes.
- Decide how `自分の投稿` is represented.
- Decide host theme constraints.
- Decide if UI should show a small placeholder or remain hidden.

Implementation should remain minimal.

## Stage 3: v0.10 Controlled Prototype

Goal:

- Prototype flexibility without becoming a generic feed.

Candidate features:

- Host theme creation for one group.
- `自分の投稿` as a secondary posting target.
- Personal inbox list.

Avoid:

- Multi-group posting.
- Public discovery.
- True post-first without theme.
- Automatic post classification.

## Stage 4: v1.0 Beta Sharing

Goal:

- Let a small number of people test the app through a more stable shared environment.

Required before this stage:

- Stable persistence outside one browser.
- Clear beta test script.
- Basic user/group separation.
- Known limits documented in the UI.

Posting model at this stage can still be simple:

- Active daily theme.
- Optional host theme.
- Optional personal inbox.

## Stage 5: v1.1+ Post Movement

Goal:

- Let users reorganize posts after creation.

Start with:

- Move from `自分の投稿` to one real theme.

Delay:

- Copying to multiple themes.
- Linking one post to many ZINEs.
- Multi-group publishing.

## Why Multi-Group Posting Comes Later

Posting to multiple groups at once sounds useful, but it creates hard product questions:

- Which group owns the post discussion?
- Can one group remove it without affecting another?
- If one group is private and one is public, which visibility wins?
- Can the same post appear in multiple finished ZINEs?
- Does editing the post update every ZINE appearance?

These questions are solvable, but not before single-group beta learning.

## Practical Next Step

Before implementing new routing behavior:

1. Run nearby beta using the v0.8 script.
2. Watch whether users ask for non-theme posting.
3. If yes, prototype `自分の投稿` first.
4. Add host themes second.
5. Add post movement third.

## Decision

The next product step is not full post-first.

The correct order is:

1. Validate today's theme flow.
2. Design and prototype `自分の投稿`.
3. Design and prototype host themes.
4. Add movement from personal inbox to real themes.
5. Consider multi-group or multi-ZINE linking only after beta evidence.

