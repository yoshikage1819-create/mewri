# Mewri Workflow

- Read `AGENTS.md`, `docs/README.md`, and `docs/mewri_chatgpt_handoff_current.md` before changing code.
- Preserve existing uncommitted changes unless the user specifically asks to modify them.
- Keep tasks scoped to one testable slice and state assumptions before substantial work.
- For feature, security, database, deployment, or growth work, use Plan mode first and record acceptance checks before editing.
- When the selected model is tagged `FREE`, restrict Cline implementation to docs, UI copy/style, test ideas, and other narrow reversible work; hand application/data/security implementation to Codex CLI.
- Do not edit concurrently with Codex CLI in the same working tree. Produce a scoped handoff first or wait until the other change is reviewed.
- Run `npm.cmd run typecheck` and `npm.cmd test` after code changes; run `npm.cmd run build` when runtime or UI behavior changes.
- Never place secrets in source files or messages. Do not read `.env` files or request live credentials in Cline.
