# Mewri Deep Research Prompt: AI Development Operating Model Rebuild

Updated: 2026-06-10

Purpose: Give this document to ChatGPT Deep Research to produce a rigorous report on whether and how Mewri should reorganize its AI-assisted development system. The owner is non-technical and wants to avoid touching implementation details as much as possible while still learning the minimum system knowledge needed for safe decisions.

## Copy-Paste Prompt For ChatGPT Deep Research

You are ChatGPT Deep Research. Research and produce a practical, source-backed report for reorganizing the AI-assisted development operating model of the Mewri project.

The report must be written for a non-technical owner. The owner does not want to directly handle engineering details, secrets, deployments, migrations, or production operations, but does want to gradually understand the system architecture well enough to make safe product and risk decisions.

### Project Context

Mewri is a group-first photo product. The core loop is:

```text
today's theme -> post photo -> contribute to group ZINE -> read generated ZINE
```

Current product state:

- v0.9 browser-local demo works with localStorage.
- v0.10 closed shared beta foundation is in progress.
- The app is intentionally not public social media.
- The shared beta is for invited small groups.
- Shared mode remains disabled by default.
- Production must not be touched without explicit human approval.

Current technical direction:

- Frontend/runtime: Next.js app under `apps/web`.
- Domain logic: `packages/core`.
- Data/application boundaries: `packages/data`.
- Shared beta backend target: Supabase Auth, Postgres/RLS, private Storage.
- Current route behavior: shared-beta post route remains fail-closed by default.
- Direct browser-provided `validatedImagePath` / `imageUrl` is rejected.
- Successful post response must remain `{ ok: true, post }`, not full state.

Recent completed slices:

- C-3: staging route gate and request-scoped auth/storage/RPC factory boundaries.
- C-4: trusted authorization source contract.
- C-5: fakeable Supabase authorization source adapter.
- C-6: fail-closed shared beta image upload confirmation contract.
- C-7: docs-only comparison of Storage upload mechanisms. Current recommendation: Edge Function / server-side upload broker, because it avoids broad browser direct Storage insert while preserving fail-closed upload confirmation.

Important current blocker:

- Live staging activation still requires owner-approved Storage upload mechanism / policy / broker design.
- No live Supabase connection, real env values, service-role key, migration application, shared mode, deployment, or production action should happen without explicit approval.

### Current AI Development Setup

Current intended roles:

- Codex CLI: primary implementation, validation, and security-sensitive review.
- Codex app: command center / planning / interpreting logs / producing implementation prompts.
- Cursor: parallel or fallback implementer for low-risk local-demo UI, docs, runbooks, fixtures, and non-security tests.
- ChatGPT: fallback command center and research assistant. It should not be treated as a code executor or replacement security reviewer.

Current friction:

- The owner is non-technical and wants fewer direct engineering tasks.
- Codex token exhaustion can stop main work.
- Cursor has been used during fallback, but current rules limit it mostly to low-risk work.
- The owner wants Cursor to handle somewhat higher-risk work if that can be made rationally safe.
- The owner wants Codex to visualize system architecture in non-technical language.
- Whenever human judgment is needed, Codex should output the minimum knowledge the owner must understand before deciding.

### Research Goal

Research whether Mewri should reorganize its AI development system to:

1. Let the non-technical owner stay mostly out of engineering execution.
2. Make Codex continuously explain and visualize the system architecture in plain language.
3. Make Codex output just-in-time minimum knowledge before human approval points.
4. Increase Cursor's role safely, including possibly some medium-risk tasks.
5. Preserve security boundaries for auth, RLS, Storage, migrations, secrets, deployment, staging activation, and production.
6. Maintain fast progress toward a closed shared beta without weakening safety.

### Sources To Use

Use broad, credible sources. Prefer primary and practitioner sources.

Required source categories:

- Official OpenAI / Codex / ChatGPT / Deep Research / agentic coding documentation where available.
- Official Cursor documentation and credible Cursor workflow materials.
- Official GitHub documentation on branches, pull requests, code review, Actions, security, and repository management.
- Supabase official docs on Auth, RLS, Storage policies, Edge Functions, service role keys, and security model.
- Security guidance from credible sources such as OWASP, NIST, GitHub Security Lab, cloud/security engineering blogs, or equivalent practitioner sources.
- Research or field reports on AI coding agents, human-in-the-loop software development, agent supervision, code review quality, and automation risk.
- Practical engineering sources from experienced teams on CI/CD, staging environments, code ownership, incident prevention, and non-technical stakeholder workflows.

Do not rely only on generic blog posts. Cite sources clearly and distinguish official docs, research papers, and practitioner opinion.

### Questions To Answer

Answer these questions directly:

1. What is the ideal AI development operating model for Mewri right now?
2. How should responsibilities be split among Codex CLI, Codex app, Cursor, ChatGPT Deep Research, GitHub, and the human owner?
3. Can Cursor safely take on more than low-risk docs/UI work? If yes, exactly which medium-risk tasks can it own, and what guardrails are required?
4. Which tasks must remain Codex-only or human-approved because of security risk?
5. How should the owner approve risky actions without needing deep engineering knowledge?
6. What minimum knowledge should the owner learn at each approval gate?
7. How should Codex visualize system architecture for a non-technical owner?
8. What diagrams or explanation artifacts should be generated and kept current?
9. How should work continue when Codex CLI/app tokens are exhausted?
10. How should GitHub, branches, pull requests, reviews, and CI be used to reduce risk?
11. What should the next 30 days of operating model improvements look like?
12. What should be explicitly rejected as too risky or not worth the complexity now?

### Required Report Structure

Produce a detailed report with these sections:

1. Executive summary for a non-technical owner
2. Current Mewri situation and constraints
3. Recommended operating model
4. Role matrix: Codex CLI / Codex app / Cursor / ChatGPT / GitHub / human owner
5. Cursor risk expansion proposal
6. Tasks that remain Codex-only or human-approved
7. Human approval gates and minimum knowledge cards
8. Architecture visualization system for Codex to maintain
9. GitHub workflow and review model
10. Fallback mode when Codex is unavailable
11. Security and secrets handling rules
12. 30-day implementation roadmap
13. Rejected options and why
14. Source-backed evidence and citations
15. Open questions / assumptions

### Required Recommendations

The report must recommend concrete artifacts Mewri should create or update, such as:

- AI operating model document
- Cursor medium-risk task policy
- Human approval checklist templates
- Non-technical architecture diagrams
- Just-in-time learning cards
- GitHub PR/review workflow
- CI validation checklist
- Agent handoff template
- Incident / rollback playbook

For each artifact, state:

- purpose
- owner
- when it is used
- where it should live in the repo or outside the repo
- how often it should be updated

### Required Risk Levels

Classify work into at least these risk levels:

- Green: safe for Cursor during fallback
- Yellow: Cursor may implement, but Codex must review before merge
- Orange: Codex CLI only, human approval before merge or activation
- Red: human approval required before any action; Codex may only plan until approved

Map Mewri tasks into these levels, including:

- local demo UI/copy/accessibility
- local-only feedback UI
- ZINE readability improvements
- docs/runbooks
- tests and fixtures
- API route changes
- packages/data shared-beta code
- Supabase Auth/RLS/Storage policies
- Edge Functions / upload broker
- service-role key handling
- migrations
- env values
- deployment
- production
- participant communication

### Human Owner Requirements

The owner is non-technical. The report must not assume the owner will:

- edit code manually
- inspect diffs deeply
- understand RLS, JWT, service-role keys, or migrations without explanation
- manage secrets directly
- debug deployment failures alone
- make security judgments without a minimal explanation card

For each risky gate, include a plain-language explanation:

- What is being decided?
- Why does it matter?
- What can go wrong?
- What evidence should the owner ask Codex for?
- What is the safe default if unsure?

### Architecture Visualization Requirements

Recommend how Codex should produce diagrams that a non-technical owner can understand.

The report should specify at least these diagrams:

- current local demo architecture
- target closed shared beta architecture
- auth -> authorization -> image upload -> post RPC flow
- what remains fail-closed by default
- where secrets must never appear
- agent workflow: Codex / Cursor / ChatGPT / GitHub
- fallback mode workflow when Codex is unavailable

For each diagram, specify:

- intended audience
- format recommendation, such as Mermaid, simple ASCII, slide, Markdown table, or image
- update trigger
- owner decision it supports

### Decision Biases

Use these biases unless strong evidence says otherwise:

- Prefer safety over speed for auth/RLS/Storage/secrets/deploy.
- Prefer small verifiable slices over large autonomous changes.
- Prefer Codex CLI for security-sensitive implementation.
- Prefer Cursor for parallel low/medium-risk tasks only when file ownership is isolated.
- Prefer GitHub PR/review gates before merging Cursor work.
- Prefer staging-only verification before any production action.
- Prefer no service-role key unless a safer architecture is impractical.
- Prefer fail-closed defaults.

### Output Quality Bar

The report must be practical enough that it can be turned into repo docs and agent instructions immediately.

Avoid vague advice like "use best practices". Give concrete workflows, examples, templates, and decision rules.

Separate what should be implemented now from what should wait.

Call out any recommendation that depends on a source being uncertain, outdated, or product-plan-dependent.

## Current Mewri Facts To Preserve

- Active repo path: `C:\dev\mewri\ph`.
- Old OneDrive repo copy is not active development state.
- `.vscode/` remains local/untracked and should not be committed unless explicitly decided.
- `main` has been kept in sync with `origin/main` after C-7.
- C-7 recommended Edge Function / server-side upload broker as the next Storage upload mechanism direction.
- C-8 must not use live staging credentials or enable shared mode without explicit approval.
- Cursor must not edit security-sensitive shared-beta backend surfaces unless a new policy is created and Codex review remains mandatory before merge.

## Suggested Follow-Up Prompt After Deep Research Returns

After the report is generated, give it to Codex with this instruction:

```text
Use $mewri-ship-beta.

Read this Deep Research report and map its recommendations into concrete Mewri repo artifacts.

Do not implement code yet.

Create a proposed implementation plan for:
- updated AI operating model docs
- Cursor medium-risk policy
- human approval learning cards
- architecture visualization docs
- GitHub review workflow
- fallback workflow updates

Keep shared-beta auth/RLS/Storage/secrets/deploy safety boundaries intact.
```
