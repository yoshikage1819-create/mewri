---
paths:
  - "packages/data/**"
  - "supabase/**"
  - "apps/web/src/app/api/**"
  - "apps/web/src/app/actions/**"
---

# Shared Beta Security

- The working product remains the browser-local demo until authenticated server writes and the Supabase adapter are complete.
- Keep database, auth, and storage calls behind `packages/data` service/repository boundaries; UI components must not perform trusted writes.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code or use a `NEXT_PUBLIC_` secret.
- Require authenticated group membership for shared Theme, Post, ZINE, event, and private image access.
- Treat anonymous and non-member rejection as acceptance tests for any RLS or storage-policy change.
- Store shared post images in private storage paths controlled by group and authenticated user identity, not as Data URLs.
- In a Cline Provider `FREE` task, analyze or draft tests only for this area; require Codex CLI review and verification before accepting implementation changes.
