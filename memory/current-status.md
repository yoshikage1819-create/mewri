---
id: current-status
scope: status
priority: high
tags:
  - status
  - worktrees
  - shared-beta
last_verified: 2026-06-16
read_for:
  - starting a new work session
  - handoff updates
  - selecting safe implementation scope
---

# Current Status

- The browser-local v0.9 demo is the default working product.
- The v0.10 closed shared beta foundation is in progress.
- Shared mode is disabled.
- The staging shared-beta route must remain fail-closed unless explicitly
  approved dependencies and gates are present.
- For the next 30 days, optimize for two outcomes only:
  1. complete the minimum safe C-8e staging upload-broker verification gate;
  2. learn from 3-5 real people whether the local/demo loop is worth returning to.
- Do not expand the AI organization, memory system, tool stack, or product surface unless
  it directly supports those two outcomes.

## Active Worktrees

```text
Codex: C:\dev\mewri\ph
Cursor: C:\dev\mewri\ph-cursor
```

Do not use old OneDrive copies as active development worktrees.

Before editing, run `git status --short --branch` and preserve existing
uncommitted work.
