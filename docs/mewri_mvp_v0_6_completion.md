# Mewri MVP v0.6 Completion

Date: 2026-05-22

## Status

MVP v0.6 is complete as a usable local/mobile MVP baseline.

This does not mean the product UI is final. It means the current app can be used to test the core MVP loop without adding unsupported product scope.

## Completed Product Loop

The v0.6 home screen supports the current MVP loop:

1. See the active ZINE cycle.
2. See today's Theme.
3. Post a photo URL or use a sample image.
4. Review same-theme posts.
5. Check local cycle updates.
6. Generate a ZINE once the MVP post minimum is met.

## Confirmed Home Order

The home screen follows the wireframe order:

1. Active ZINE
2. Same-theme posts
3. Relevant updates
4. Discovery and circulation

The fourth section remains placeholder-only.

## MVP Scope Preserved

v0.6 does not add:

- authentication
- follows
- notifications
- comments or DMs
- public discovery
- production database integration
- image upload storage

The app remains local/demo-first and group-first.

## Mobile Preview Fixes

v0.6 includes fixes needed for phone preview over the local network:

- `allowedDevOrigins` includes the current Wi-Fi IPv4 host.
- The browser local repository falls back to memory if `localStorage` is unavailable or broken.
- Client-side ID generation no longer requires `crypto.randomUUID()`, which can be unavailable on non-secure mobile HTTP origins.
- The post form includes a sample-image action so the MVP can be tested without preparing an external image URL.

## Verification

Verified on 2026-05-22:

- `npm.cmd run typecheck` passes.
- `npm.cmd run build` passes.
- `http://192.168.1.11:3000` returns HTTP 200.

## Known Limits

- The UI still contains English copy and should be localized to Japanese next.
- The visual system is good enough for MVP testing, but not final polish.
- Phone preview depends on the PC's current Wi-Fi IPv4 address. If the IP changes, update `allowedDevOrigins`.
- The app still uses local browser/demo persistence and should not be treated as multi-device synced state.

## Current Browser Links

Local desktop:

- [http://localhost:3000](http://localhost:3000)

Phone on current Wi-Fi:

- [http://192.168.1.11:3000](http://192.168.1.11:3000)

