# Review Shared Beta Safety

1. Read `AGENTS.md`, `docs/mewri_v0_10_closed_shared_beta_foundation.md`, and
   the relevant migration/runtime/service files.
2. Review for secret exposure, missing authentication, missing membership
   checks, incomplete RLS/storage policy, unsafe browser writes, and missing
   rejection tests.
3. Report findings first with file locations and severity.
4. Do not enable shared mode, deploy, or apply migrations unless explicitly
   requested after findings are addressed.
