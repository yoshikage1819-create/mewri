# Implement A Mewri Slice

1. Read `AGENTS.md`, `docs/README.md`, and `docs/mewri_chatgpt_handoff_current.md`.
2. Inspect `git status --short --branch` and identify existing user work.
3. Write a compact plan with the hypothesis, exact files likely involved,
   non-goals, acceptance checks, and rollback/security considerations.
4. If using a Cline model tagged `FREE`, stop at a Codex handoff for auth,
   SQL/RLS/storage, secrets, migration, deployment, or multi-file data-path
   implementation. Otherwise implement only the selected slice using existing
   module boundaries.
5. Run `npm.cmd run typecheck` and `npm.cmd test`; run `npm.cmd run build`
   for web/runtime changes.
6. Summarize changed files, verification, outstanding risks, and the next
   measurable beta question.
