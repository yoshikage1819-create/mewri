# Mewri Home v0.6 Extension Brief

Date: 2026-05-22

## Purpose

This document fixes the current v0.6 home screen state and defines the next safe extension step.

v0.6 is now the visual and interaction baseline for the home screen. It preserves the wireframe's information architecture while keeping product behavior inside current MVP limits.

## Confirmed v0.6 State

- The home screen follows this order:
  1. Active ZINE
  2. Same-theme posts
  3. Relevant updates
  4. Discovery and circulation
- The screen keeps the "today's action is obvious at a glance" principle.
- Existing MVP behaviors remain intact:
  - posting
  - theme selection
  - local feed viewing
  - ZINE generation
- Discovery-oriented modules are currently placeholders only.

## Scope Guardrails

The next step must not silently add product capability that current MVP docs exclude.

Still excluded from real implementation unless the product scope is formally expanded:

- authentication
- follows
- notifications
- public discovery
- comments or DMs
- remote backend dependencies introduced only to support future social features

If future-facing sections appear in the UI, they should be handled as one of the following:

- placeholder modules
- static sample data
- local-only mocked states
- structural hooks for later implementation

## Design Direction

The editorial direction can keep drawing atmosphere from:

- 032c
- The Creative Independent
- Yukiko
- Middle Plane

But those references should influence:

- typography attitude
- composition
- spacing rhythm
- material feel
- image treatment
- editorial tone

They should not override:

- hierarchy clarity
- task visibility
- posting CTA prominence
- MVP product correctness

## Critical Design Position

The correct next move is not "make it more expressive at any cost."

The correct next move is:

1. preserve the current wireframe logic
2. strengthen the visual system
3. create future-ready seams without pretending unsupported features already exist

The main risk is importing too much from editorial references and weakening the product's central action. If visual ambition conflicts with usability, usability wins.

## Recommended Model

- `gpt-5.2`

Reason:
OpenAI's current official model documentation lists GPT-5.2 as the flagship choice for coding and agentic tasks.

## Next CLI Prompt

```text
Use the current v0.6 implementation as the baseline and extend it carefully without breaking existing MVP scope.

Reference files:
- /C:/Users/kouda/OneDrive/ドキュメント/ph/docs/home-wireframe.svg
- /C:/Users/kouda/OneDrive/ドキュメント/ph/docs/mewri_v0_6_home_extension_brief.md

Goal:
- Evolve the home screen beyond v0.6 in a future-ready way while preserving the current information architecture, hierarchy, and MVP-safe behavior.

Non-negotiable constraints:
- Do not break or reorder the core home structure:
  1. Active ZINE
  2. Same-theme posts
  3. Relevant updates
  4. Discovery and circulation
- Do not add real follows, notifications, authentication, or public discovery logic unless that capability already exists in the codebase and clearly matches current docs.
- Keep unsupported future features as placeholders, mock states, or extension seams only.

Required work:
- Review the current home implementation and identify the best extension points for future features.
- Improve component structure so future modules can be upgraded from placeholder to real feature with minimal rework.
- Tighten the editorial design system further:
  - stronger typography hierarchy
  - better spacing rhythm
  - more intentional image treatment
  - sharper section transitions
  - preserved readability and mobile usability
- Refine the Active ZINE area so the primary action remains unmistakable.
- Make the Same-theme posts section feel more purposeful without turning it into a distracting feed.
- Keep discovery-oriented sections visibly secondary and clearly non-implemented where appropriate.

Critical reasoning requirement:
- Before making changes, write a short critical note explaining:
  - which parts of the editorial references are appropriate to push further
  - which parts would be wrong to copy directly
  - where future-facing UI should stop short of fake product completeness

Implementation requirement:
- Stay consistent with existing repository patterns.
- Prefer reusable structures over one-off visual hacks.
- Keep the app buildable offline.
- Summarize changes and explicitly call out what remains placeholder-only.
```

## Browser Check Links

Wireframe source:

- [home-wireframe.svg](/C:/Users/kouda/OneDrive/ドキュメント/ph/docs/home-wireframe.svg)

v0.6 brief:

- [mewri_v0_6_home_extension_brief.md](/C:/Users/kouda/OneDrive/ドキュメント/ph/docs/mewri_v0_6_home_extension_brief.md)

Local app after starting the dev server:

- [http://localhost:3000](http://localhost:3000)

Phone preview on the current Wi-Fi network:

- [http://192.168.1.11:3000](http://192.168.1.11:3000)

If you want phone preview on the same Wi-Fi network, use the existing workflow in:

- [mewri_mobile_preview_v0_5.md](/C:/Users/kouda/OneDrive/ドキュメント/ph/docs/mewri_mobile_preview_v0_5.md)

## Local Check Command

From the project root:

```powershell
npm.cmd run dev
```

For phone preview, prefer:

```powershell
npm.cmd run dev:host
```

If the phone page stays on `Loading Mewri...`, confirm that `apps/web/next.config.ts` allows the current Wi-Fi IPv4 address through `allowedDevOrigins`, then restart the dev server.
