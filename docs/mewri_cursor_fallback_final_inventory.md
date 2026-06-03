# Final inventory: Cursor fallback branch

Factual file and safety inventory for Codex review. Not a merge instruction.

| Field | Value |
| --- | --- |
| Branch | `cursor/parallel-local-ui-docs` |
| Base commit (`origin/main` at review start) | `f336e0a` |
| Current tip | `100100d` |
| App / UI work tip | `dcfcb48` |
| Worktree | `C:\dev\mewri\ph-cursor` |

**Cursor did not merge to `main`.**

---

## Timeline (completed safe fallback tasks)

| Order | Commit (short) | Task |
| --- | --- | --- |
| 1 | `3d5fa98` | Align owner / handoff docs with `C:\dev` worktree paths |
| 2 | `fe8aff4` | Merge `main`; extract `createSampleImageDataUrl` into `local-demo-ui.ts` |
| 3 | `30dc99e` | Empty post list copy; `calcLocalImageScale` + tests |
| 4 | `cdb190f` | Mobile spacing (`<=759px`) vs wireframe rhythm |
| 5 | `941ce8b` | Collapsible local demo safety notice |
| 6 | `862835b` | Ephemeral feedback note UI (no submit / persistence) |
| 7 | `493a58d` | Non-technical `local-demo-review-guide` runbook |
| 8 | `394d2f0` | Copy consistency (`LOCAL_DEMO_*` single source) |
| 9 | `dcfcb48` | Accessibility (labels, keyboard, char count, safety structure) |
| 10 | `8816188` | Handoff: canonical “Codex reset: Cursor branch summary” |
| 11 | `100100d` | PR description draft doc + docs index link |

Earlier branch history (before `f336e0a`, often already on `main` via PR #1) includes local dev disk migration docs, `.onedriveignore`, resume script, and initial local-demo polish slices. See `git log origin/main..HEAD` in `ph-cursor`.

---

## Changed file inventory (Cursor scope since merge-base `de33570`)

Grouped by category. Generated from `git diff --name-only de33570..100100d` plus this doc.

### Local demo UI

| File | Role |
| --- | --- |
| `apps/web/src/app/local-demo-ui.ts` | Shared copy, helpers, IDs, char-count formatter |
| `apps/web/src/app/local-demo-safety-notice.tsx` | Collapsible safety scope notice |
| `apps/web/src/app/local-demo-feedback-note.tsx` | Ephemeral feedback textarea + clear |
| `apps/web/src/app/page.tsx` | Banner, safety/feedback placement, demo UX hooks |

### Local demo tests

| File | Role |
| --- | --- |
| `apps/web/src/app/local-demo-ui.test.ts` | Unit tests for helpers, copy, IDs, char count |

### Styles

| File | Role |
| --- | --- |
| `apps/web/src/app/styles.css` | Demo notice, safety notice, feedback note, mobile demo spacing |

### Docs / runbooks

| File | Role |
| --- | --- |
| `docs/runbooks/local-demo-review-guide.md` | Non-technical reviewer steps |
| `docs/mewri_owner_local_dev_disk_setup.md` | Owner path / migration guidance (updated on branch) |
| `docs/README.md` | Index links (runbook, PR draft, this inventory) |

### Handoff / PR docs

| File | Role |
| --- | --- |
| `docs/mewri_chatgpt_handoff_current.md` | Status + Codex reset branch summary |
| `docs/mewri_cursor_fallback_pr_draft.md` | GitHub PR body draft |
| `docs/mewri_cursor_fallback_final_inventory.md` | This inventory |

### App paths in `f336e0a..dcfcb48` (UI/docs only)

Same as above except handoff/PR docs added in `8816188` / `100100d`. Use for focused app review:

```text
apps/web/src/app/local-demo-feedback-note.tsx
apps/web/src/app/local-demo-safety-notice.tsx
apps/web/src/app/local-demo-ui.test.ts
apps/web/src/app/local-demo-ui.ts
apps/web/src/app/page.tsx
apps/web/src/app/styles.css
docs/README.md
docs/mewri_chatgpt_handoff_current.md
docs/mewri_owner_local_dev_disk_setup.md
docs/runbooks/local-demo-review-guide.md
```

---

## Diff note (branch vs `origin/main` at `f336e0a`)

`git diff --name-only origin/main HEAD` may also list `apps/web/src/app/api/shared-beta/**` and `packages/data/src/shared-beta-*` if the branch tip is behind newer `main` commits (e.g. post-authorization at `f336e0a`). Those paths are **not** part of the Cursor fallback slices above. **Codex should rebase the branch onto current `main` and re-run the diff** before merge; expect the PR diff to match the inventory tables after rebase.

---

## Forbidden areas (not changed by Cursor fallback)

Cursor fallback work did **not** intentionally modify:

| Area | Paths (representative) |
| --- | --- |
| Supabase | `supabase/**` |
| Web API routes | `apps/web/src/app/api/**` |
| Data layer / shared-beta runtime | `packages/data/**` (except unrelated drift vs `main`; see diff note) |
| Auth / session / login | auth flows, session code |
| RLS / Storage / migrations | SQL policies, migration apply |
| Secrets / env | `.env*`, credentials, tokens |
| Deploy / production / staging | deploy config, shared-mode activation |

No production data and no private beta participant data were used.

---

## Validation summary

| Check | Result |
| --- | --- |
| `npm.cmd test` | Pass — **161** tests (on app tip `dcfcb48`) |
| `npm.cmd run typecheck` | Pass (spot-checked during slices) |
| `npm.cmd run build` | Pass (spot-checked during slices) |
| `npm.cmd run lint` | **Fails** — pre-existing: `next lint` resolves `lint` as a directory under `apps/web` |

---

## Known lint issue

Repo-wide `npm.cmd run lint` failure is pre-existing and not introduced by the Cursor fallback branch. Do not treat it as a blocker for this inventory unless fixed separately on `main`.

---

## Remaining Codex review items

1. Rebase `cursor/parallel-local-ui-docs` onto current `origin/main` if behind; confirm PR file list matches inventory tables.
2. Review `git diff f336e0a..dcfcb48` (or post-rebase `origin/main...HEAD`) for UI/docs/tests only.
3. Manual keyboard pass: safety notice (`<details>`), feedback note, char count, **メモを消す**.
4. Confirm feedback note has no network submit and no new persistence.
5. Skim `local-demo-ui.ts` for shared-beta or env imports.
6. Use `docs/mewri_cursor_fallback_pr_draft.md` when opening/updating the GitHub PR.
7. **Owner/Codex** decides open PR, edit text, and merge — Cursor does not merge to `main`.

---

## Related docs

- `docs/mewri_chatgpt_handoff_current.md` — living status and Codex reset summary
- `docs/mewri_cursor_fallback_pr_draft.md` — PR description draft
