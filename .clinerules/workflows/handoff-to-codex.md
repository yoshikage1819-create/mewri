# Handoff A Slice To Codex CLI

1. Read `AGENTS.md` and the current handoff document.
2. Do not change code. Produce a concise implementation brief containing:
   goal, hypothesis, relevant files, product/security constraints, acceptance
   checks, non-goals, and unresolved questions.
3. For auth, SQL/RLS/storage, credentials, migration, or deployment work,
   include the rejected-access and rollback checks required before release.
4. Give the user a ready-to-run Codex instruction beginning with:
   `Use $mewri-ship-beta to implement this reviewed slice:`.
5. Structure the instruction as `Goal`, `Context`, `Constraints`, and
   `Done when`; for sensitive paths require `codex.cmd review --uncommitted`
   after implementation and validation.
