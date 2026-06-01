# Mewri 現在のプロジェクト概要 - ChatGPT 引き継ぎ用

更新日: 2026-06-01

## プロダクト概要

Mewri は一般的な写真フィードではなく、数人で写真を持ち寄り、数日分の投稿から ZINE を完成させるサービスです。

```text
今日のテーマを見る
-> 写真を軽く投稿する
-> 進行中の ZINE に投稿が蓄積する
-> 生成された ZINE を読む
```

## 現在動いているもの: v0.9 ローカルデモ

- Next.js の Web アプリとして実装済み。
- UI は日本語で、モバイルと desktop の表示を確認済み。
- 「参加中のZINE」で今日の active theme に写真を投稿できる。
- 「このZINEの中身」で投稿一覧と生成 ZINE を閲覧できる。
- 画像ファイル選択、ローカルプレビュー、ZINE 生成が動く。
- データ保存はブラウザの `localStorage` のみ。
- 他端末・他ユーザーとのデータ共有、ログイン、実画像アップロードはまだない。

公開デモ対象は `mewri-b` です。

## 次に進めているもの: v0.10 Closed Shared Beta Foundation

目的は、招待された少人数が同じ active ZINE に投稿できる将来の共有ベータ基盤を安全に準備することです。

現在の作業ツリーには、まだ commit / push / deploy していない次の準備実装があります。

- Supabase を推奨バックエンドとする方針文書。
- `packages/data` に閉じた共有モード用の設定判定境界。
- Supabase Postgres の schema / RLS / Storage policy の SQL 草案。
- SQL 草案はレビューを経て、cycle/theme/post/ZINE/page の group 整合性を
  複合外部キーで保護し、検証済み server write / upload 経路ができるまで
  post insert と画像 upload policy を開かない安全側の状態に更新済み。
- 設定不足時にローカルデモへ戻ること、未完成の共有モードを起動しないことのテスト。
- 文字化けしていた初期の意思決定ログと要件定義の復旧。
- Codex CLI を主実装・検証、Cline を計画と低リスク補助に使う
  `AGENTS.md`、Skill、Cline rules/workflows、運用文書。
- Cursor Pro は現時点では導入せず、Codex/Cline の token・利用上限による
  中断が実装速度の継続的な阻害要因になった場合に試験導入を再検討する。

## 重要な設計判断

- 既存の `localStorage` デモは壊さず、既定動作として維持する。
- Supabase 資格情報がなくても既存デモは build / 表示できる。
- UI コンポーネントから Supabase へ直接問い合わせず、`packages/data` の repository/service 境界を使う。
- 共有モードの投稿画像は Data URL ではなく private Storage に保存する。
- 共有書き込みは招待済み認証ユーザーだけに許可し、匿名書き込みは許可しない。
- group member だけが同じ group の Theme、Post、ZINE、画像を読める RLS を前提にする。
- `service_role` はブラウザに公開しない。

## 現在の主要データモデル

```text
User / Profile
Group
GroupMember
Theme
Post
ZineCycle
Zine
ZinePage
EventLog
```

共有ベータ準備では、招待管理用に `beta_invites` を運用テーブルとして追加する想定です。

## 明示的にまだ実装しないもの

- 公開 signup と匿名投稿
- public discovery
- follow、いいね、コメント、通知
- host-created themes
- 個人受け取りテーマや post-first 投稿
- 複数 ZINE / 複数 group への同時投稿
- 実際の Supabase 接続、ログイン画面、Storage upload、DB adapter

これらを後回しにする理由は、まず「複数人が同じ ZINE に参加することが価値になるか」を安全に検証するためです。

## 技術構成

```text
apps/web       Next.js Web UI
packages/core  ドメインモデルとビジネスロジック
packages/data  localStorage / 将来の共有永続化境界
docs           要件・判断・運用文書
supabase       将来適用する migration 草案
```

主要ファイル:

- `docs/README.md`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/api/shared-beta/posts/route.ts`
- `apps/web/src/app/styles.css`
- `packages/data/src/shared-beta-runtime.ts`
- `packages/data/src/shared-beta-post-authorization.ts`
- `packages/data/src/shared-beta-post-route-boundary.ts`
- `packages/data/src/db-mappers.ts`
- `packages/data/src/db-row-types.ts`
- `supabase/migrations/202605260001_closed_shared_beta_foundation.sql`
- `docs/mewri_v0_10_closed_shared_beta_foundation.md`
- `docs/mewri_ai_workbench_setup.md`
- `AGENTS.md`

## 直近の検証結果

- `npm.cmd run typecheck`: 成功
- `npm.cmd test`: 成功 (`69` tests passed)
- `npm.cmd run build`: 成功。Supabase 環境変数なしで build 可能
- `375px`, `390px`, `1280px` 表示で横 overflow がないことを確認済み
- Codex/Cline `mewri-ship-beta` Skill の形式検証: 成功
- SQL の `zine_pages.group_id` 制約に合わせ、DB row mapper が親 ZINE
  から group を導出し、孤立ページを拒否する境界を追加。
- `packages/data/src/shared-beta-post-authorization.ts` に、shared beta の
  server 投稿専用 command service を追加。未認証、なりすまし、非メンバー、
  他 group / inactive theme、不正な private image path を投稿前に拒否し、
  demo 操作や未認可 publish command は公開しない。
- `packages/data/src/shared-beta-post-route-boundary.ts` を追加し、認証結果と
  server 側で検証済みの image path を受け取る route/application 境界を実装。
  未認証・なりすまし・非メンバー・他 group / inactive theme・不正 path・
  server 未検証 path の場合は shared-beta post command を実行しないテストを追加。
- `apps/web/src/app/api/shared-beta/posts/route.ts` を追加。実 adapter/実 auth
  の接続前は `503 shared_beta_route_unavailable` で閉じたままにし、
  localStorage デモの投稿フローは変更しない。
- shared-beta 投稿の成功 response は `MewriState` 全体ではなく、作成した
  `Post` 一件だけを返す契約へ狭めた。HTTP response に `state` を含めない
  回帰テストを追加し、将来の server-backed adapter 接続時に他 group の
  state を誤って返さない境界を設けた。
- `docs/README.md` を現行文書の入口として追加し、AI 運用とモデル選択は
  `docs/mewri_ai_workbench_setup.md` に統合。復旧済み正本に吸収された
  文字化け旧計画と重複する旧モデルメモは削除した。
- Codex 活用調査を運用へ反映し、CLI スライスを
  `Goal / Context / Constraints / Done when` で定義すること、shared-data
  セキュリティ差分は validators 後に別の Codex review pass を必須にする
  ことを `AGENTS.md`、Skill、AI workbench に追加した。
- 2026-05-28 に公式モデル案内と CLI 設定を再確認し、今後の実装・独立
  review の推奨モデルを `gpt-5.5` / reasoning `high` に更新した。
- 2026-05-28 に post route 成功 response の P1 remediation slice を実装。
  `packages/data` の guarded post command と route boundary、および
  `apps/web` の HTTP handler は、成功時に作成済み `Post` 一件のみを
  返し、全 `MewriState` を外部 response に含めない。
- 2026-05-28 に DB/RLS/storage 契約の remediation slice を実装。
  migration 草案では `profiles.id` と user 参照を Supabase Auth 対応の
  `uuid` に維持しつつ、group/cycle/theme/post/ZINE/page/event の
  domain-owned ID と関係キーを prefixed string を保持できる `text` に
  統一した。複合 foreign key による group 整合性保護は維持する。
- `private` RLS helper について、`authenticated` に schema `USAGE` と
  read policy が使う helper の `EXECUTE` だけを付与した。`anon` には
  policy も helper 権限も追加しない。
- shared beta の Storage bucket は `post-images` 固定契約とし、
  `SUPABASE_POST_IMAGE_BUCKET` に異なる値が指定された場合は shared
  runtime を選択せず local mode へ閉じるテストを追加した。
- 上記変更後、`npm.cmd run typecheck`、`npm.cmd test` (`69` tests
  passed)、`npm.cmd run build` が成功した。
- 2026-05-28 に `codex.cmd review --uncommitted -c model='"gpt-5.5"' -c model_reasoning_effort='"high"'`
  を再実行し、SQL/RLS/storage および bucket contract の今回の修正には
  finding が出なかった。未解決の P1 は、`validatedImagePath` が request
  JSON 由来で server-side upload または lookup の証明になっていない点である。
  これを修正し再 review が通るまで、staging migration、実 adapter
  接続、shared mode 有効化へ進まない。
- 2026-05-28 に上記 route/upload 信頼境界の remediation を実装した。
  HTTP request body から `validatedImagePath` / `imageUrl` を拒否し、
  server-only の image verification 依存関係が path を返さない限り投稿を
  実行しない。さらに投稿 command service は、形式が正しい private path
  であっても server-side upload / Storage lookup の検証結果なしでは拒否する。
- この remediation 後、`npm.cmd run typecheck`、`npm.cmd test`
  (`75` tests passed)、`npm.cmd run build` が成功した。
- 完成差分に対して `codex.cmd review --uncommitted -c model='"gpt-5.5"' -c model_reasoning_effort='"high"'`
  を外側実行環境から再実行し、追加 finding はなかった。
  shared mode は未有効のまま維持し、staging migration / adapter 接続は
  owner による次ゲート判断後にのみ進める。
- 2026-05-28 の commit 準備確認で、`npm.cmd run typecheck`、
  `npm.cmd test` (`75` tests passed)、`npm.cmd run build` が成功した。
  build 生成物は git status に出ておらず、現在の差分は closed shared beta
  foundation と agent/docs 運用整理の commit 単位として扱える。
- 2026-05-28 に Supabase staging migration 適用前の拒否検証計画
  `docs/mewri_supabase_staging_refusal_verification_plan_v0_10.md` を追加した。
  migration 適用、project 作成、shared mode 有効化はまだ行っていない。
  Owner が staging project と migration 対象を確認し、明示承認してから
  `supabase link --project-ref <staging-project-ref>` に進む。
- 2026-05-28 に staging Storage RLS read 境界を SQL Editor の管理者文脈ではなく
  実 authenticated session で確認する local-only page / script を追加した。
  `tools/supabase-storage-rls-read-check.html` と
  `tools/serve-storage-rls-check.mjs` は public anon key だけを使い、
  Storage の metadata list 読み取り確認だけを行う。手順は
  `docs/mewri_storage_rls_local_read_check_instructions.md` に記録した。
  service_role key、shared mode、production resources は使わない。
- 2026-05-28 に `mewri-staging` で Supabase staging refusal verification を完了した。
  migration は正常適用され、tables と private `post-images` bucket (`public=false`) を確認済み。
  `posts` は `SELECT` policy のみで、authenticated direct `INSERT` は拒否された。
  `storage.objects` も `SELECT` policy のみで、authenticated direct `INSERT` は拒否された。
  `anon` には public table privileges がなく、`private` schema `USAGE` は
  `authenticated=true` / `anon=false`、helper function `EXECUTE` grants は期待通り。
  member-a は `group_staging_a` のみ、member-b は `group_staging_b` のみ見える。
  local Storage RLS checker では、anon は A/B どちらの object metadata も見えず、
  member-a は A のみ、member-b は B のみ見えることを確認した。
  service_role key は使わず、production は触らず、shared mode は disabled のまま。

## 次に行うべきこと

1. 追加した route/application 境界へ、実 Supabase adapter・実認証セッション・
   検証済み Storage upload 経路を接続し、staging で統合検証する（明示承認後）。
2. 未 commit の docs / checklist / `.cursor/rules` を必要なら commit する。
3. 実際の招待ユーザー間で同じ ZINE が共有されることを確認してから closed beta を開始する。

## ChatGPT への注意

- 共有ベータ機能はまだ稼働していません。現在動くのは browser-local v0.9 デモです。
- v0.10 は staging（`mewri-staging`）に foundation + RPC migration 適用済みだが、
  アプリは未接続・shared mode 無効のまま。production 接続済みと扱わないでください。
- 新規提案では、Mewri の核である `今日のテーマ -> 投稿 -> ZINEへの貢献 -> 生成ZINE` を優先してください。

## 2026-05-28 server-only shared-beta integration slice

- Added fake-client-only server boundaries for Supabase auth session resolution, private post image upload/verification, and an atomic shared-beta post+event gateway interface. No live Supabase connection was added.
- `POST /api/shared-beta/posts` now uses a server dependency factory, but it remains `503 shared_beta_route_unavailable` unless shared-beta env is complete and explicit server clients/repository/image resolver are injected.
- Browser request bodies still reject `validatedImagePath` and `imageUrl`. Successful HTTP responses remain `{ ok: true, post }` only.
- Image upload now requires authenticated membership and an active theme before reading or uploading the image; unauthorized attempts do not create objects.
- The post gateway models one atomic post+event operation. A real Supabase implementation still needs a narrow RPC or equivalent transaction before staging/shared mode can be enabled.
- No service role key was requested or used, no real env values were added, no migrations were applied, no deployment happened, and shared mode remains off.
- Validation: `npm.cmd run typecheck` passed; `npm.cmd test` passed with 95 tests; `npm.cmd run build` passed.
- Independent review: first `codex.cmd review --uncommitted` was blocked by nested Windows sandbox spawn failure; rerun with `codex.cmd -s danger-full-access review --uncommitted -c model='"gpt-5.5"' -c model_reasoning_effort='"high"'` found P1 upload-before-authorization and P2 malformed-cookie findings; both were fixed and covered by tests. Final rerun reported no actionable correctness issues.
- Next gate: implement the real staging-only Supabase RPC/client adapter for the atomic post+event gateway and real image-file extraction only after human approval for staging env wiring. Production remains untouched.

## 2026-05-29 shared-beta post RPC draft slice

- Added draft migration `supabase/migrations/202605290001_shared_beta_create_post_rpc.sql` for `private.create_shared_beta_post` plus authenticated-only `create_shared_beta_post` RPC wrapper. The draft validates `auth.uid()`, membership, active same-group theme, private `post-images/<group>/<user>/<filename>` path, and matching `storage.objects` metadata before atomically inserting one `posts` row and one `post_created` event. No migration was applied.
- Updated `packages/data/src/supabase-shared-beta-post-gateway.ts` to use a narrow mocked Supabase `rpc("create_shared_beta_post", ...)` client shape and fail closed on RPC error, zero rows, multiple rows, or returned-row mismatch. It maps only through `postFromDbRow()` and returns `Post` only.
- Updated mocked tests in `packages/data/src/supabase-shared-beta-post-gateway.test.ts` and `apps/web/src/app/api/shared-beta/posts/server-dependencies.test.ts`.
- No real Supabase connection, no service role key, no env wiring, no shared mode, no deploy, and no production touch.
- Validation: `npm.cmd run typecheck`, `npm.cmd test` (102 tests), and `npm.cmd run build` passed. `git diff --check` had only CRLF warnings.
- Independent review: `codex.cmd -s danger-full-access review --uncommitted -c model='"gpt-5.5"' -c model_reasoning_effort='"high"'` reported no discrete correctness, security, or maintainability issues.
- Migration apply and staging RPC verification completed on 2026-05-29; see section below.
- Remaining risk/next gate: connect real Supabase adapter/auth/upload path to
  `POST /api/shared-beta/posts` on staging only after explicit env-wiring approval.
  Do not enable shared mode or touch production until that integration passes review.

## 2026-05-29 mewri-staging RPC migration apply and verification

- Owner approved applying `supabase/migrations/202605290001_shared_beta_create_post_rpc.sql`
  to `mewri-staging` only. Production was not touched. `MEWRI_RUNTIME_MODE=shared_beta`
  remains disabled. No service role key was used in chat or docs.
- Repo migration hardened in commit `4ab93e4`: public-only authenticated EXECUTE on
  `create_shared_beta_post`, `security definer` wrapper, explicit `revoke ... from anon`
  on both RPC functions (staging required a follow-up `revoke from anon` after apply
  when `public` still showed `anon_execute`).
- Post-apply structural checks (SQL Editor): public/private RPC exist; `anon` has no
  EXECUTE; `authenticated` has public RPC only; `posts` and `storage.objects` remain
  SELECT-only with no client INSERT policies.
- Authenticated client verification via `tools/supabase-storage-rls-read-check.html`
  (extended in commit `98a0b4c`; local-only, public anon key + member-a/b login only):

| Check | Result |
| --- | --- |
| C3 member RPC success (`read-check.webp`) | Pass |
| C4.1 identity mismatch | Pass (`identity_mismatch`) |
| C4.2 other-group theme | Pass (`active_group_theme_required`) |
| C4.3 inactive theme | Skipped (no non-active theme row in staging seed) |
| C4.4 forged image path | Pass (`private_image_path_required`) |
| C4.5 missing storage object | Pass (`storage_object_not_found`) |
| C5.1 direct `posts` insert | Pass (`permission denied for table posts`) |
| C5.2 direct Storage upload | Pass (denied; message `Bucket not found` — upload did not succeed) |

- C3 created post example id `post_ddb242c9618e415b9ddf8f5692cfbe93` with matching
  `post_created` event (verified via RPC return row).
- Passing this verification does not enable closed beta or shared mode by itself.
- Next gate: staging-only real adapter for `create_shared_beta_post` RPC, server-side
  image upload verification, and guarded `POST /api/shared-beta/posts` integration test.

## 2026-05-29 shared-beta post image Storage client slice (C-2)

- Added `packages/data/src/supabase-shared-beta-post-image-storage-client.ts`:
  `createSupabaseSharedBetaPostImageStorageClient` implements
  `SharedBetaPostImageStorageClient` via member JWT + public anon key (upload +
  `objectExists` list lookup). Reuses staging/shared env resolvers from the RPC client.
- No `POST /api/shared-beta/posts` env wiring, no shared mode, no Storage INSERT
  migration, no deploy. Staging still has no client Storage upload policy (C5.2);
  upload will fail at RLS until a future approved migration adds the server path policy.
- Follow-up hardening removed the Storage client from the browser-used package root export
  and tightened public Supabase key validation across auth/RPC/storage clients. Legacy
  JWT anon keys require payload role `anon`; modern `sb_publishable_...` keys are allowed;
  legacy `service_role` JWTs and modern `sb_secret_...` keys are rejected in the public
  key slot.
- Cursor owner rules were rewritten into readable ASCII instructions that tell Cursor to
  answer the owner in Japanese and stop before migrations, secrets, shared mode,
  production, deploys, or real user communication.
- Validation: `npm.cmd run typecheck` passed; `npm.cmd test` passed with 128 tests;
  `npm.cmd run build` passed.
- Follow-up C-3 preparation updated the server route dependency shape so the post boundary
  can be resolved per request. `createSharedBetaPostServerDependenciesFromEnvironment`
  now supports request-scoped Storage and RPC client factories that receive the member
  access token from the same request after auth/identity checks. This avoids reusing fixed
  member clients across requests.
- No real env values, migration, shared mode, production deploy, or live Supabase connection
  were added. The default route still fails closed unless complete explicit wiring is
  injected.
- Validation after C-3 preparation: `npm.cmd run typecheck` passed; `npm.cmd test` passed
  with 129 tests; `npm.cmd run build` passed.
- Next gate (C-3 continued): create the real server-only environment wiring for auth,
  request-scoped RPC, request-scoped image storage, repository, and image extraction only
  after explicit staging env-wiring approval.

## 2026-06-01 Cursor fallback for Codex usage exhaustion

- Added a Codex-token fallback rule for Cursor and a runbook:
  `docs/mewri_cursor_codex_token_fallback.md`.
- Cursor may continue in the `ph-cursor` worktree on `cursor/parallel-local-ui-docs`
  while Codex usage is exhausted, but only for low-risk UI/docs/tests/handoff work.
- Cursor must stop and queue work for Codex review if the task involves auth, RLS,
  Storage policy, server route security, migrations, secrets, shared mode, production,
  deploy, real user communication, merge to `main`, or push to `main`.

## 2026-06-01 local demo UI polish slice (Cursor fallback)

- Extracted local-demo pure helpers to `apps/web/src/app/local-demo-ui.ts`
  (`calcReadinessPercent`, `formatRemainingToday`, `escapeSvgText`) with unit tests.
- Local demo home: owner-facing demo notice copy (no `localStorage` jargon), `aria-live`
  on photo/post status messages, `aria-current` on bottom section nav links.
- No auth, persistence, shared-beta route, migration, env, or shared mode changes.
- Codex should review this slice only for accidental coupling to shared-beta paths;
  no security-sensitive code was touched.

## 2026-06-01 local demo safety and focus slice (Cursor fallback)

- Commit `1d3889f`: local demo notice, `aria-live` / `aria-current`, helper extraction.
- Added `formatFullDate` to `local-demo-ui.ts`, reset confirmation dialog, load-error
  `role="alert"`, and global `:focus-visible` outlines for keyboard navigation.
- No auth, persistence, shared-beta, migration, or env changes.

## 2026-06-01 local demo ZINE generate slice (Cursor fallback)

- ZINE生成前に確認ダイアログ（初回生成 / 作り直しで文言を切り替え）。
- 生成後はステータス表示と `#generated-zine` へのスムーズスクロール。
- モバイル幅（759px以下）の余白を投稿フォーム・ZINE生成ブロックで調整。
- No auth, persistence, shared-beta, migration, or env changes.

## 2026-06-01 local demo navigation slice (Cursor fallback)

- Skip link to main content, clearer header button labels, sample-post bulk-add confirmation.
- Scroll-to-ZINE respects `prefers-reduced-motion`; page metadata title/description in Japanese.
- No auth, persistence, shared-beta, migration, or env changes.

## 2026-06-01 local dev disk migration (owner PC performance)

- Added `.onedriveignore` for `node_modules`, `.next`, and other regenerable artifacts.
- Added `docs/mewri_owner_local_dev_disk_setup.md`.
- Copied the repository to `C:\dev\mewri\ph-cursor` (without heavy folders).
- Removed `node_modules` and `apps/web/.next` from the OneDrive copy to reduce sync load.
- Next owner step: open `C:\dev\mewri\ph-cursor` in Cursor and run `npm.cmd install` there.
- After confirming Git push, the OneDrive `ph-cursor` folder may be deleted.
