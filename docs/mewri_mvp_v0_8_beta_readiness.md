# Mewri MVP v0.8 Beta Readiness

Date: 2026-05-22
Status: current MVP beta-prep source of truth

## Purpose

MVP v0.8 prepares Mewri for a small nearby beta without expanding into unsupported product scope.

The goal is to make the current local demo testable by people nearby, then identify the smallest next step toward a shareable URL beta.

## Current Baseline

The current MVP supports:

1. Viewing the active ZINE in `参加中のZINE`.
2. Viewing today's theme.
3. Posting only to today's active theme.
4. Opening `みんなの投稿` from the photo-stack link.
5. Viewing the active ZINE's posts inside `このZINEの中身`.
6. Viewing today's theme and already-closed themes inside the active ZINE.
7. Keeping scheduled/future themes non-postable.
8. Separating posting reward from ZINE generation reward.
9. Generating a ZINE after the MVP post minimum is met.
10. Running on desktop and phone over the same Wi-Fi network.

## Home IA

The home screen order should remain:

1. `参加中のZINE`
2. `このZINEの中身`
3. `フォロー中ユーザーの投稿`
4. `発見と回遊`

### 1. `参加中のZINE`

This section is for immediate participation.

It should include:

- Active ZINE/group identity.
- Today's active theme.
- Primary CTA: `今日の投稿をする`.
- Photo-stack link: `みんなの投稿`.

It should not include:

- Full 3-day cycle mechanics.
- ZINE generation CTA.
- Host-created themes.
- `自分の投稿`.

### 2. `このZINEの中身`

This section is for collected posts and the delayed ZINE reward.

It should include:

- `投稿アーカイブ`.
- Today's theme posts.
- Already-closed theme posts.
- Theme filter/all-post view.
- 3-day cycle progress.
- Strong `ZINEを生成` CTA.
- Generated ZINE preview when available.

This separation matters because:

- Posting is the immediate reward.
- ZINE generation is the delayed collective reward.
- Keeping them separate makes the generated ZINE feel like something to reach, not a form attachment.

### 3. `フォロー中ユーザーの投稿`

This is placeholder-only in v0.8.

It must not imply that real follow data, notifications, or external feeds are implemented.

### 4. `発見と回遊`

This is placeholder-only in v0.8.

It must not imply that public discovery, ranking, recommendations, or real completed-ZINE browsing are implemented.

## Nearby Beta Definition

`Nearby beta` means:

- The developer runs the app locally.
- A nearby tester opens the app from a phone on the same Wi-Fi network.
- The tester can complete the demo loop without touching the codebase.
- The tester understands which parts are implemented and which parts are placeholders.

This is not yet a public or remote beta.

## Nearby Beta Test Script

Ask a tester to complete this flow:

1. Open the phone URL.
2. Read `今日のテーマ`.
3. Tap `今日の投稿をする`.
4. Use the sample image button if image URL input is unclear.
5. Add or edit a short caption.
6. Submit the post.
7. Tap `みんなの投稿`.
8. Confirm the new post appears inside `このZINEの中身`.
9. Add sample posts if needed.
10. Generate a ZINE once the app says it is ready.
11. Reset the demo and confirm the flow can be repeated.

## What To Observe

During nearby beta, watch for:

- Whether the tester knows what to do first.
- Whether today's theme feels like the correct posting target.
- Whether locking posting to today's theme feels clear.
- Whether `みんなの投稿` feels like the right link to view the active ZINE's posts.
- Whether `このZINEの中身` feels like the right place for posts, cycle progress, and ZINE generation.
- Whether closed themes being viewable but not postable feels understandable.
- Whether `フォロー中ユーザーの投稿` and `発見と回遊` are clearly future-facing.
- Whether the image URL/sample image limitation is acceptable for an MVP demo.
- Whether ZINE generation feels like the payoff of posting.

## MVP Scope Guardrails

v0.8 should not add:

- Authentication.
- Real follows.
- Notifications.
- Comments or DMs.
- Public discovery.
- Production database writes.
- Real image upload storage.
- Host-created themes.
- `自分の投稿`.
- True post-first posting.
- Multi-group posting.

Future-facing sections must remain placeholder-only.

## Local Demo Beta

This is the current target.

Required:

- Desktop layout does not break.
- Phone layout does not break.
- Phone preview works on the same Wi-Fi network.
- Posting works.
- Sample image posting works.
- `みんなの投稿` opens the active ZINE post list.
- `このZINEの中身` separates post archive from ZINE generation.
- ZINE generation works after enough posts exist.
- Reset works.

## URL-Sharing Beta

This is the next target after local demo beta.

Required before starting:

- Decide whether URL-sharing beta is a single-user localStorage demo or a shared multi-user ZINE demo.
- If single-user: deploy the app without shared persistence and clearly label it as a demo.
- If shared multi-user: add shared persistence first.

Not required for local demo beta:

- Real auth.
- Public discovery.
- Real follow graph.
- Production moderation.

## Multi-User Shared-ZINE Beta

This is a later target.

Required:

- Shared database-backed state.
- Server-controlled write path.
- Group membership or invite boundary.
- Image upload/storage decision.
- Clearer trust and reset rules.

This should not be mixed into v0.8.

## Related v0.9 Design Docs

The following documents define future posting flexibility without changing the v0.8 MVP:

- `docs/mewri_post_first_and_host_theme_strategy.md`
- `docs/mewri_theme_modes_strategy_v0_9.md`
- `docs/mewri_personal_inbox_theme_strategy_v0_9.md`
- `docs/mewri_post_routing_roadmap_v0_9.md`

These docs are intentionally design-only. They should guide future implementation after nearby beta feedback, especially around host-created themes, `自分の投稿`, post movement, and delayed multi-group posting.

## Acceptance Criteria

v0.8 is complete when:

- The nearby beta definition is documented.
- The tester flow is documented.
- Current MVP scope remains unchanged.
- The app still passes `npm.cmd run typecheck`.
- The app still passes `npm.cmd run build`.
- Desktop and phone preview URLs still return HTTP 200 when the dev server is running.

