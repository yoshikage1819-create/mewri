# PR draft: Cursor fallback branch (`cursor/parallel-local-ui-docs`)

Use this text when opening or updating a GitHub PR. Owner or Codex should decide whether to open the PR, edit the description, or merge.

| Field | Value |
| --- | --- |
| Head branch | `cursor/parallel-local-ui-docs` |
| Suggested base | `main` at `f336e0a` (rebase or update base to current `main` before merge) |
| Branch tip | `8816188` (docs-only handoff update) |
| App / UI work tip | `dcfcb48` (local demo safety + feedback accessibility) |
| Worktree | `C:\dev\mewri\ph-cursor` |

**Cursor did not merge to `main`.**

---

## Summary

Low-risk **local demo UI, tests, and documentation** from the Cursor fallback queue while Codex usage was limited. Improves the browser-local v0.9 demo for owners and non-technical reviewers: clearer copy, safety scope notice, ephemeral feedback note (no submit), accessibility, mobile spacing, and a review runbook. No shared-beta wiring, auth, or persistence changes.

---

## Scope

- **In scope:** `apps/web` local demo surfaces, `local-demo-ui` helpers/tests, `styles.css` demo blocks, owner migration docs/scripts, AI fallback / handoff docs, local demo review runbook.
- **Out of scope:** Backend, API routes, `packages/data` runtime, Supabase, auth/session, RLS/Storage/migrations, env/secrets, deploy/staging/production activation.

---

## What changed

- Extracted and tested local-demo helpers (`local-demo-ui.ts`, unit tests).
- Demo banner, progress/empty-state copy, reset/ZINE confirm dialogs, skip link, focus styles, `aria-live` / `aria-current`, reduced-motion scroll.
- Collapsible **safety notice** (local-only scope; no prod/beta participant data; no secrets).
- **Feedback note** UI: textarea + clear only; no API, no `localStorage` write for feedback.
- Copy consistency via `LOCAL_DEMO_*` constants; accessibility labels and keyboard-friendly safety/feedback blocks.
- Mobile spacing (`<=759px`) aligned to wireframe rhythm.
- `docs/runbooks/local-demo-review-guide.md` for non-technical reviewers.
- Local dev disk migration: `.onedriveignore`, owner doc, resume script with dirty-worktree guard.
- Handoff: canonical **Codex reset: Cursor branch summary** in `mewri_chatgpt_handoff_current.md`; this PR draft.

Commits since `f336e0a` on the branch (app + docs; tip may include `8816188`):

```text
8816188 Update Codex handoff summary for Cursor fallback branch
dcfcb48 Improve local demo safety and feedback accessibility.
394d2f0 Align local demo user-facing copy across UI and docs.
493a58d Add non-technical local demo review runbook.
862835b Add ephemeral local demo feedback note UI.
941ce8b Add collapsible local demo safety scope notice.
cdb190f Tune local demo mobile spacing to wireframe rhythm.
30dc99e Improve local demo empty post list guidance.
fe8aff4 Merge main and extract local demo sample image helper.
3d5fa98 Align owner and handoff docs with C:\dev worktree design.
```

Older branch commits (before `f336e0a`) include PR #1-era migration and local-demo polish; see `git log origin/main..HEAD` in `ph-cursor`.

---

## What did not change

- `apps/web/src/app/api/**` (including shared-beta post route)
- `packages/data/**` shared-beta runtime, auth, or adapters
- `supabase/**` migrations, RLS, or Storage policies
- Auth/session/login flows
- Env files, secrets, deploy/staging/production config
- Shared mode, Supabase connection, or server persistence

No production data and no private beta participant data were used for this work.

---

## Validation

| Check | Result |
| --- | --- |
| `npm.cmd test` | **Pass** — 161 tests (validated on app tip `dcfcb48`) |
| `npm.cmd run typecheck` | Pass (spot-checked during slices) |
| `npm.cmd run build` | Pass (spot-checked during slices) |
| `npm.cmd run lint` | **Known failure** — pre-existing: `next lint` treats `lint` as a directory under `apps/web`; not introduced by this branch |

---

## Known issue

- `npm.cmd run lint` fails for the repo-wide Next.js lint path issue above. Do not block this PR on that failure unless the path issue is fixed separately on `main`.

---

## Safety boundaries

- Local demo remains **browser `localStorage` only** for product state; feedback note is ephemeral in React state (cleared on refresh).
- Safety notice states: no production or private beta participant data in the demo; no secrets in screenshots or notes.
- Cursor did not merge to `main` and did not enable shared beta, migrations, or deploy.

---

## Manual review checklist

1. `npm.cmd install` (if needed) and `npm.cmd run dev` in `ph-cursor`.
2. Confirm top demo banner and collapsible safety notice copy.
3. Open safety notice with keyboard (Enter/Space); read all bullets.
4. Type in feedback note; confirm char count updates; use **メモを消す**; confirm nothing is sent to a server.
5. Resize to mobile width (`<=759px`); check spacing and tap targets.
6. Optional: follow `docs/runbooks/local-demo-review-guide.md` as a non-technical reviewer would.

---

## Codex review checklist

1. `git fetch` and checkout `cursor/parallel-local-ui-docs` at `8816188` (or latest push).
2. `git diff f336e0a..dcfcb48` — confirm app diff is UI/docs/tests only; read `8816188` for handoff-only delta.
3. Skim `local-demo-ui.ts` and demo components for imports from shared-beta or env-dependent code.
4. Confirm feedback note has no submit handler and no new API routes.
5. Compare user-facing copy to `local-demo-review-guide.md`.
6. Decide PR title/body edits, rebase onto current `main`, and merge policy (Codex/owner — not Cursor).

---

## Merge note

- **Owner or Codex** should decide whether to open this PR, update the description from this draft, rebase onto current `main`, and merge.
- Cursor must **not** merge to `main` or push to `main`.
- After merge, continue v0.10 / shared-beta work in `C:\dev\mewri\ph` on `main` without mixing in-flight API changes with this branch.
- This PR does **not** authorize deploy, migration apply, RLS/Storage edits, auth changes, or shared-mode activation.

---

## Suggested PR title

`Local demo UI polish, safety notice, feedback note, and review docs (Cursor fallback)`

## Suggested labels (optional)

`documentation`, `ui`, `no-backend`
