# Mewri director project brief for ChatGPT learning

Updated: 2026-06-10
Encoding: UTF-8
Audience: non-technical owner / director
Status: learning brief. This document contains no secrets, credentials, tokens, env values, private participant data, production data, or live Supabase values.

## 1. What Mewri is trying to become

Mewri is a small-group photo and ZINE-making service.

The core idea is not to make another public social network. The goal is to create a quiet place where invited people in a small group respond to a theme, leave photos, and later see those photos become a ZINE-like memory.

Plain version:

- A host creates or chooses a theme.
- A small invited group posts photos to that theme.
- The group gradually creates material for one shared booklet / ZINE.
- The product should feel warm, personal, and low-pressure.
- The main loop is: Theme -> Post -> ZINE contribution -> generated ZINE.

The most important product question is not only “can users post photos?” It is:

> Do people want to return, post again, and explain the experience to a friend?

## 2. Current product stage

Mewri is still before a true public beta.

Current state:

- v0.9 browser-local demo exists and should keep working.
- v0.10 closed shared beta foundation is being prepared.
- Supabase staging safety checks have been done for refusal boundaries.
- Shared beta server route work exists, but it is intentionally fail-closed by default.
- Production should not be touched.
- Shared mode should not be enabled until explicit approval and staging evidence exist.

Meaning for the director:

Mewri is not ready for broad users yet. The current work is building a safe path from local demo to a closed shared beta.

## 3. What has already been proven

The project has already invested heavily in safety before opening shared posting.

Confirmed or prepared so far:

- Local demo behavior remains the default path.
- Shared beta route returns unavailable by default unless explicit gates and trusted dependencies are present.
- Browser request bodies cannot claim their own trusted image path.
- Auth, membership, theme, image validation, upload, and post creation are separated into boundaries.
- Fake-client tests prove many failure cases close safely.
- Staging refusal verification confirmed important database and Storage denial behavior.
- Direct client insert into posts and Storage objects remains refused.
- Private `post-images` bucket exists in staging.
- Member A / Member B Storage visibility boundaries were checked with real-session style metadata checks.

Plain version:

The team is not just trying to “make posting work.” It is trying to make posting work only for the right person, in the right group, for the right theme, with the right private image path.

## 4. Current main technical gate

The active gate is C-8e: live staging upload broker verification.

This means:

- Fake tests are done for the upload broker direction.
- The next risky step would prove the real staging environment can upload a private image through the server-controlled broker and create one post/event safely.
- This is not yet executed.
- It requires careful owner approval.
- It must not expose secrets.
- It must not touch production.

The current recommendation is to proceed slowly:

1. Keep the C-8e approval card and non-technical checklist as the guide.
2. Confirm the project is `mewri-staging`, not production.
3. Do not paste service-role keys, access tokens, refresh tokens, magic links, or `.env` files into chat.
4. Stop before any unclear credential, deploy, migration, production screen, or shared mode activation.

## 5. The system in simple architecture terms

Simple future shared-beta posting flow:

```text
Browser
  -> Next.js server route
  -> auth/session check
  -> membership and active-theme authorization
  -> image MIME/size/path validation
  -> server-side upload broker
  -> private Supabase Storage object
  -> post RPC creates one post and one event
  -> response returns only { ok: true, post }
```

What each part means:

- Browser: the user’s screen.
- Next.js server route: the trusted server doorway.
- Auth/session: proves who the user is.
- Membership/theme authorization: proves the user belongs to the group and the theme is active.
- Image validation: checks the file type, size, and safe path.
- Upload broker: server-controlled upload step, not broad browser direct upload.
- Private Storage: where the image file lives.
- Post RPC: controlled database action that writes the post and event together.
- Response: only returns the created post, not the whole app state.

## 6. What must stay off by default

These must stay off unless explicitly approved:

- Production changes.
- Public launch.
- Shared mode activation.
- Migration application.
- Deployment.
- Service-role key use.
- Real staging credential handling.
- Beta-user communication.
- Spending money on new infrastructure.

Director rule:

If a step asks for a secret, production project, deploy, migration, or public user communication, pause and ask Codex to explain the decision using the minimum knowledge card.

## 7. Current AI development structure

The project uses AI because there is no budget for a hired engineering team.

Current operating model:

- Codex app acts as command center.
- Codex CLI implements and validates risky code.
- Cursor can help with safe lanes and fallback work.
- ChatGPT can help the owner learn, understand, and choose safe next tasks.
- GitHub stores the project history.
- Repo docs and handoff files act as memory.
- Obsidian may be used as a human reading workspace.

Important boundary:

ChatGPT can help the director understand and plan, but ChatGPT should not be treated as the final security reviewer for auth, RLS, Storage, migrations, env, deploy, or production work.

## 8. Cursor risk lanes

Cursor can help more, but only inside risk lanes.

Green tasks Cursor may own:

- docs and checklists
- local demo UI copy and layout
- accessibility and mobile readability for local demo
- local-only helper tests
- owner onboarding material

Yellow tasks Cursor may implement only with Codex review:

- fake-client tests
- type-only drafts
- docs for shared beta workflows without secrets
- non-security tests around existing boundaries

Orange tasks Cursor may draft but Codex must own finalization:

- server route test drafts
- Supabase adapter tests using fakes
- Storage upload diagrams
- SQL/RLS analysis without applying migrations

Red tasks Cursor must not implement:

- real Supabase project work
- `supabase/**`
- `apps/web/src/app/api/**` security-sensitive behavior
- `packages/data/**` auth, Storage, RPC, runtime, repository wiring
- `.env*` or secrets
- deployment
- production
- migrations
- shared mode activation
- push or merge to main

## 9. What the director should learn next

The director does not need to become an engineer. The director needs enough understanding to approve or stop risky steps.

Suggested learning path for ChatGPT:

### Level 1: Product and user learning

Learn:

- What is Mewri’s core loop?
- Who is the first user group?
- What does “return or not?” mean?
- What makes this different from a public SNS?
- What should friends test first?

Why:

This helps decide whether the product is worth building before adding complexity.

### Level 2: Safety and privacy basics

Learn:

- What is staging vs production?
- What is a secret key?
- Why should service-role keys never be pasted into chat?
- What does “private bucket” mean?
- Why should direct browser upload be limited?

Why:

This helps the director avoid accidental leaks or production mistakes.

### Level 3: Shared beta architecture

Learn:

- What is an API route?
- What is authentication?
- What is group membership authorization?
- What is Storage?
- What is RPC?
- Why does the route return 503 by default?

Why:

This helps the director understand why progress is slow but safer.

### Level 4: AI operating model

Learn:

- What should Codex app do?
- What should Codex CLI do?
- What can Cursor safely do?
- What should ChatGPT do during fallback?
- What tasks require human approval?

Why:

This keeps development moving without pretending AI is a full engineering team.

### Level 5: Approval decisions

Learn how to read the minimum knowledge card:

```text
Decision:
What changes:
Why it matters:
What could go wrong:
What is still closed/off by default:
What evidence we have:
What evidence we do not have yet:
Rollback:
What I need you to approve:
What you should not paste or do:
```

Why:

This is the director’s main decision tool.

## 10. Recommended ChatGPT learning prompt

Use this prompt in ChatGPT:

```text
You are helping me understand the Mewri project as a non-technical director.

I do not want to become the engineer. I want to understand enough to make product, safety, and approval decisions without touching code or secrets.

Use the project brief I provide as the source of truth.

Please teach me in this order:
1. What Mewri is trying to become.
2. What the current development stage is.
3. What is safe to test now and what is not safe yet.
4. The system architecture in plain language.
5. The difference between local demo, staging, and production.
6. The meaning of auth, membership, Storage, RPC, route, and fail-closed.
7. What decisions I must approve as owner.
8. What I must never paste into chat or screenshots.
9. What Cursor can safely do during fallback.
10. What questions I should ask Codex before approving live staging work.

After explaining, ask me 5 simple check questions to confirm I understood the parts that matter for safe decisions.
Do not ask me for secrets, env files, tokens, access keys, production data, or private participant data.
```

## 11. Questions the director should ask before any risky step

Before approving C-8e or any later live step, ask Codex:

1. Is this staging or production?
2. What exact secret or credential is needed, if any?
3. Can this be done without pasting the secret into chat?
4. What stays off by default?
5. What could leak if this goes wrong?
6. What evidence do we already have?
7. What evidence are we missing?
8. What is the rollback?
9. What files will change?
10. Are we applying a migration, deploying, enabling shared mode, or contacting users?

If the answer is unclear, stop.

## 12. Current next gate

The next risky gate is not a normal coding task.

It is:

```text
C-8e live staging upload broker verification
```

This should only proceed after the owner explicitly approves the C-8e approval text and understands:

- it must be `mewri-staging`, not production
- secrets must not be pasted into AI chats or docs
- shared mode remains disabled unless separately approved
- no migration or deploy happens unless separately approved
- only safe evidence should be recorded

## 13. What ChatGPT should not do

ChatGPT should not:

- ask for service-role keys
- ask for `.env` files
- ask for access tokens or refresh tokens
- approve security-sensitive diffs as merge-ready
- tell Cursor to edit Red-zone files
- tell the owner to deploy or apply migrations
- treat production as a test environment
- replace Codex review for auth, RLS, Storage, API, migration, env, or deploy work

## 14. One-sentence summary

Mewri is moving from a local demo toward a closed shared beta, and the current work is making sure invited group posting with private images can become real without opening unsafe browser uploads, leaking secrets, or touching production too early.