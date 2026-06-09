# Mewri 現在のプロジェクト概要E- ChatGPT 引き継ぎ用

更新日: 2026-06-05

## Codex reset: Cursor branch summary

Review this block first after reset. Cursor work stays on `ph-cursor` only.

| Item | Value |
| --- | --- |
| Branch | `cursor/parallel-local-ui-docs` |
| Branch tip | `cursor/parallel-local-ui-docs` after merging current `origin/main` |
| Current review base | current `origin/main` after memory pack commit (`845bab6`) |
| Worktree | `C:\dev\mewri\ph-cursor` |

**Cursor did not:** merge to `main`, push to `main`, or edit `supabase/**`,
`apps/web/src/app/api/**`, `packages/data/**`, auth/session/login, RLS/Storage
policies/migrations, env/secrets, deploy/staging activation, or production settings.

### Completed safe fallback tasks (this branch)

- Local dev disk migration docs, `.onedriveignore`, resume script (`121acf1` dirty-worktree guard).
- PR #1 scope merged on `main` (`4d5a4fb`); branch rebased/merged `origin/main` as needed.
- Local demo UI polish: helpers in `local-demo-ui.ts`, banner copy, `aria-live` / `aria-current`, focus styles, reset/ZINE confirm dialogs, skip link, reduced-motion scroll, Japanese metadata.
- ZINE progress copy, empty post list, `calcLocalImageScale`, sample image helper.
- Mobile spacing tuned to wireframe rhythm (`<=759px`).
- Collapsible **local demo safety notice** (scope / no prod-beta / no secrets).
- Ephemeral **feedback note** UI (textarea + clear only; no submit or persistence).
- Non-technical **`docs/runbooks/local-demo-review-guide.md`**.
- Copy consistency pass (`LOCAL_DEMO_*` in `local-demo-ui.ts`).
- Accessibility pass on safety notice + feedback note (labels, keyboard, non-color cues, char count for screen readers).

### Cursor fallback commits before latest `origin/main` merge

```text
dcfcb48 Improve local demo safety and feedback accessibility.
394d2f0 Align local demo user-facing copy across UI and docs.
493a58d Add non-technical local demo review runbook.
862835b Add ephemeral local demo feedback note UI.
941ce8b Add collapsible local demo safety scope notice.
cdb190f Tune local demo mobile spacing to wireframe rhythm.
30dc99e Improve local demo empty post list guidance.
fe8aff4 Merge main and extract local demo sample image helper.
3d5fa98 Align owner and handoff docs with C:\dev worktree design.
```

Older commits on the same branch (before `f336e0a`) include PR #1 handoff, migration
runbook/script, and earlier local-demo slices  Esee `git log origin/main..HEAD` in
`ph-cursor` for the full list.

### Files / areas touched (high level)

- `apps/web/src/app/local-demo-ui.ts`, `local-demo-ui.test.ts`
- `apps/web/src/app/local-demo-safety-notice.tsx`, `local-demo-feedback-note.tsx`
- `apps/web/src/app/page.tsx`, `styles.css` (banner, demo notice, safety/feedback blocks, mobile layout)
- `docs/runbooks/local-demo-review-guide.md`, `docs/README.md` (runbook link)
- `docs/mewri_owner_local_dev_disk_setup.md`, `tools/resume-local-dev-migration.ps1`, `.onedriveignore`
- Parallel/fallback design docs (`mewri_ai_parallel_fallback_execution_design.md`, etc.)

No changes to shared-beta API routes, `packages/data` runtime, Supabase SQL, or auth.

### Validation history (Cursor branch)

| Check | Result |
| --- | --- |
| `npm.cmd test` | Pass - **161** tests before latest main merge; rerun after conflict resolution |
| `npm.cmd run typecheck` | Pass (spot-checked during slices) |
| `npm.cmd run build` | Pass (spot-checked during slices) |
| `npm.cmd run lint` | **Fails**  Epre-existing issue: `next lint` treats `lint` as a directory under `apps/web` (not introduced by Cursor branch) |

App tests were not required for docs-only handoff updates.

### Codex review checklist (after reset)

1. In `C:\dev\mewri\ph-cursor`, `git fetch` and checkout latest `cursor/parallel-local-ui-docs`.
2. Review `origin/main...HEAD`; for the focused app slice, `f336e0a..dcfcb48` remains the UI/docs/tests-only range.
3. Open local demo (`npm.cmd run dev`); Tab through safety notice and feedback note; confirm copy matches `local-demo-review-guide.md`.
4. Skim `local-demo-ui.ts` for accidental imports from shared-beta or env-dependent code.
5. Decide PR/merge strategy  E**Codex or owner merges**; Cursor must not merge to `main`.
6. Continue shared-beta / v0.10 work in `C:\dev\mewri\ph` on `main` separately; do not edit in-flight API files in `ph` until committed or handed off.

Slice-level notes below are historical detail; this section is the canonical branch summary.

## 開発用 worktree�E�現在�E�E

```text
Codex 主 worktree:   C:\dev\mewri\ph          �E�通常は main�E�E
Cursor 用 worktree:  C:\dev\mewri\ph-cursor   �E�Eursor/* ブランチE��E
```

- 両方とめEOneDrive の外！EC:\dev\mewri\`�E�で運用する、E
- 旧 OneDrive コピ�E�E�EOneDrive\ドキュメンチEph`、`ph-cursor`�E��E**現在の作業用 worktree ではなぁE*、E
  `ph-cursor` フォルダは削除済み。新しい作業では開かなぁE��E

## プロダクト概要E

Mewri は一般皁E��写真フィードではなく、数人で写真を持ち寁E��、数日刁E�E投稿から ZINE を完�Eさせるサービスです、E

```text
今日のチE�Eマを見る
-> 写真を軽く投稿する
-> 進行中の ZINE に投稿が蓄積すめE
-> 生�EされぁEZINE を読む
```

## 現在動いてぁE��も�E: v0.9 ローカルチE��

- Next.js の Web アプリとして実裁E��み、E
- UI は日本語で、モバイルと desktop の表示を確認済み、E
- 「参加中のZINE」で今日の active theme に写真を投稿できる、E
- 「このZINEの中身」で投稿一覧と生�E ZINE を閲覧できる、E
- 画像ファイル選択、ローカルプレビュー、ZINE 生�Eが動く、E
- チE�Eタ保存�Eブラウザの `localStorage` のみ、E
- 他端末・他ユーザーとのチE�Eタ共有、ログイン、実画像アチE�Eロード�EまだなぁE��E

公開デモ対象は `mewri-b` です、E

## 次に進めてぁE��も�E: v0.10 Closed Shared Beta Foundation

目皁E�E、招征E��れた少人数が同ぁEactive ZINE に投稿できる封E��の共有�Eータ基盤を安�Eに準備することです、E

現在の作業チE��ーには、まだ commit / push / deploy してぁE��ぁE��の準備実裁E��あります、E

- Supabase を推奨バックエンドとする方針文書、E
- `packages/data` に閉じた�E有モード用の設定判定墁E��、E
- Supabase Postgres の schema / RLS / Storage policy の SQL 草案、E
- SQL 草案�Eレビューを経て、cycle/theme/post/ZINE/page の group 整合性めE
  褁E��外部キーで保護し、検証済み server write / upload 経路ができるまで
  post insert と画僁Eupload policy を開かなぁE���E側の状態に更新済み、E
- 設定不足時にローカルチE��へ戻ること、未完�Eの共有モードを起動しなぁE��とのチE��ト、E
- 斁E��化けしてぁE��初期の意思決定ログと要件定義の復旧、E
- Codex CLI を主実裁E�E検証、Cline を計画と低リスク補助に使ぁE
  `AGENTS.md`、Skill、Cline rules/workflows、E��用斁E��、E
- Cursor Pro は現時点では導�Eせず、Codex/Cline の token・利用上限による
  中断が実裁E��度の継続的な阻害要因になった場合に試験導�Eを�E検討する、E

## 重要な設計判断

- 既存�E `localStorage` チE��は壊さず、既定動作として維持する、E
- Supabase 賁E��惁E��がなくても既存デモは build / 表示できる、E
- UI コンポ�EネントかめESupabase へ直接問い合わせず、`packages/data` の repository/service 墁E��を使ぁE��E
- 共有モード�E投稿画像�E Data URL ではなぁEprivate Storage に保存する、E
- 共有書き込みは招征E��み認証ユーザーだけに許可し、匿名書き込みは許可しなぁE��E
- group member だけが同じ group の Theme、Post、ZINE、画像を読める RLS を前提にする、E
- `service_role` はブラウザに公開しなぁE��E

## 現在の主要データモチE��

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

共有�Eータ準備では、招征E��琁E��に `beta_invites` を運用チE�Eブルとして追加する想定です、E

## 明示皁E��まだ実裁E��なぁE��の

- 公閁Esignup と匿名投稿
- public discovery
- follow、いぁE�E、コメント、E��知
- host-created themes
- 個人受け取りチE�Eマや post-first 投稿
- 褁E�� ZINE / 褁E�� group への同時投稿
- 実際の Supabase 接続、ログイン画面、Storage upload、DB adapter

これらを後回しにする琁E��は、まず「褁E��人が同ぁEZINE に参加することが価値になるか」を安�Eに検証するためです、E

## 技術構�E

```text
apps/web       Next.js Web UI
packages/core  ドメインモチE��とビジネスロジチE��
packages/data  localStorage / 封E��の共有永続化墁E��
docs           要件・判断・運用斁E��
supabase       封E��適用する migration 草桁E
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

## 直近�E検証結果

-
`npm.cmd run typecheck`: 成功
-
`npm.cmd test`: 成功 (`69` tests passed)
-
`npm.cmd run build`: 成功。Supabase 環墁E��数なしで build 可能
- `375px`, `390px`, `1280px` 表示で横 overflow がなぁE��とを確認済み
- Codex/Cline `mewri-ship-beta` Skill の形式検証: 成功
- SQL の `zine_pages.group_id` 制紁E��合わせ、DB row mapper が親 ZINE
  から group を導�Eし、孤立�Eージを拒否する墁E��を追加、E
- `packages/data/src/shared-beta-post-authorization.ts` に、shared beta の
  server 投稿専用 command service を追加。未認証、なりすまし、E��メンバ�E、E
  仁Egroup / inactive theme、不正な private image path を投稿前に拒否し、E
  demo 操作や未認可 publish command は公開しなぁE��E
- `packages/data/src/shared-beta-post-route-boundary.ts` を追加し、認証結果と
  server 側で検証済みの image path を受け取めEroute/application 墁E��を実裁E��E
  未認証・なりすまし�E非メンバ�E・仁Egroup / inactive theme・不正 path・
  server 未検証 path の場合�E shared-beta post command を実行しなぁE��ストを追加、E
- `apps/web/src/app/api/shared-beta/posts/route.ts` を追加。宁Eadapter/宁Eauth
  の接続前は `503 shared_beta_route_unavailable` で閉じたままにし、E
  localStorage チE��の投稿フローは変更しなぁE��E
- shared-beta 投稿の成功 response は `MewriState` 全体ではなく、作�Eした
  `Post` 一件だけを返す契紁E��狭めた、ETTP response に `state` を含めなぁE
  回帰チE��トを追加し、封E��の server-backed adapter 接続時に仁Egroup の
  state を誤って返さなぁE��E��を設けた、E
- `docs/README.md` を現行文書の入口として追加し、AI 運用とモチE��選択�E
  `docs/mewri_ai_workbench_setup.md` に統合。復旧済み正本に吸収された
  斁E��化け旧計画と重褁E��る旧モチE��メモは削除した、E
- Codex 活用調査を運用へ反映し、CLI スライスめE
  `Goal / Context / Constraints / Done when` で定義すること、shared-data
  セキュリチE��差刁E�E validators 後に別の Codex review pass を忁E��にする
  ことめE`AGENTS.md`、Skill、AI workbench に追加した、E
- 2026-05-28 に公式モチE��案�Eと CLI 設定を再確認し、今後�E実裁E�E独竁E
  review の推奨モチE��めE`gpt-5.5` / reasoning `high` に更新した、E
- 2026-05-28 に post route 成功 response の P1 remediation slice を実裁E��E
  `packages/data` の guarded post command と route boundary、およ�E
  `apps/web` の HTTP handler は、�E功時に作�E済み `Post` 一件のみめE
  返し、�E `MewriState` を外部 response に含めなぁE��E
- 2026-05-28 に DB/RLS/storage 契紁E�E remediation slice を実裁E��E
  migration 草案では `profiles.id` と user 参�EめESupabase Auth 対応�E
  `uuid` に維持しつつ、group/cycle/theme/post/ZINE/page/event の
  domain-owned ID と関係キーめEprefixed string を保持できる `text` に
  統一した。褁E�� foreign key による group 整合性保護は維持する、E
- `private` RLS helper につぁE��、`authenticated` に schema `USAGE` と
  read policy が使ぁEhelper の `EXECUTE` だけを付与した。`anon` には
  policy めEhelper 権限も追加しなぁE��E
- shared beta の Storage bucket は `post-images` 固定契紁E��し、E
  `SUPABASE_POST_IMAGE_BUCKET` に異なる値が指定された場合�E shared
  runtime を選択せぁElocal mode へ閉じるテストを追加した、E
- 上記変更後、`npm.cmd run typecheck`、`npm.cmd test` (`69` tests
  passed)、`npm.cmd run build` が�E功した、E
- 2026-05-28 に `codex.cmd review --uncommitted -c model='"gpt-5.5"' -c model_reasoning_effort='"high"'`
  を�E実行し、SQL/RLS/storage および bucket contract の今回の修正には
  finding が�Eなかった。未解決の P1 は、`validatedImagePath` ぁErequest
  JSON 由来で server-side upload また�E lookup の証明になってぁE��ぁE��である、E
  これを修正し�E review が通るまで、staging migration、宁Eadapter
  接続、shared mode 有効化へ進まなぁE��E
- 2026-05-28 に上訁Eroute/upload 信頼墁E��の remediation を実裁E��た、E
  HTTP request body から `validatedImagePath` / `imageUrl` を拒否し、E
  server-only の image verification 依存関係が path を返さなぁE��り投稿めE
  実行しなぁE��さらに投稿 command service は、形式が正しい private path
  であってめEserver-side upload / Storage lookup の検証結果なしでは拒否する、E
- こ�E remediation 後、`npm.cmd run typecheck`、`npm.cmd test`
  (`75` tests passed)、`npm.cmd run build` が�E功した、E
- 完�E差刁E��対して `codex.cmd review --uncommitted -c model='"gpt-5.5"' -c model_reasoning_effort='"high"'`
  を外�E実行環墁E��ら�E実行し、追加 finding はなかった、E
  shared mode は未有効のまま維持し、staging migration / adapter 接続�E
  owner による次ゲート判断後にのみ進める、E
- 2026-05-28 の commit 準備確認で、`npm.cmd run typecheck`、E

`npm.cmd test` (`75` tests passed)、`npm.cmd run build` が�E功した、E
  build 生�E物は git status に出ておらず、現在の差刁E�E closed shared beta
  foundation と agent/docs 運用整琁E�E commit 単位として扱える、E
- 2026-05-28 に Supabase staging migration 適用前�E拒否検証計画
  `docs/mewri_supabase_staging_refusal_verification_plan_v0_10.md` を追加した、E
  migration 適用、project 作�E、shared mode 有効化�Eまだ行ってぁE��ぁE��E
  Owner ぁEstaging project と migration 対象を確認し、�E示承認してから
  `supabase link --project-ref <staging-project-ref>` に進む、E
- 2026-05-28 に staging Storage RLS read 墁E��めESQL Editor の管琁E��E��脈ではなぁE
  宁Eauthenticated session で確認すめElocal-only page / script を追加した、E
  `tools/supabase-storage-rls-read-check.html` と
  `tools/serve-storage-rls-check.mjs` は public anon key だけを使ぁE��E
  Storage の metadata list 読み取り確認だけを行う。手頁E�E
  `docs/mewri_storage_rls_local_read_check_instructions.md` に記録した、E
  service_role key、shared mode、production resources は使わなぁE��E
- 2026-05-28 に `mewri-staging` で Supabase staging refusal verification を完亁E��た、E
  migration は正常適用され、tables と private `post-images` bucket (`public=false`) を確認済み、E
  `posts` は `SELECT` policy のみで、authenticated direct `INSERT` は拒否された、E
  `storage.objects` めE`SELECT` policy のみで、authenticated direct `INSERT` は拒否された、E
  `anon` には public table privileges がなく、`private` schema `USAGE` は
  `authenticated=true` / `anon=false`、helper function `EXECUTE` grants は期征E��り、E
  member-a は `group_staging_a` のみ、member-b は `group_staging_b` のみ見える、E
  local Storage RLS checker では、anon は A/B どちら�E object metadata も見えず、E
  member-a は A のみ、member-b は B のみ見えることを確認した、E
  service_role key は使わず、production は触らず、shared mode は disabled のまま、E

## 次に行うべきこと

1. 追加した route/application 墁E��へ、宁ESupabase adapter・実認証セチE��ョン・
   検証済み Storage upload 経路を接続し、staging で統合検証する�E��E示承認後）、E
2. 未 commit の docs / checklist / `.cursor/rules` を忁E��なめEcommit する、E
3. 実際の招征E��ーザー間で同じ ZINE が�E有されることを確認してから closed beta を開始する、E

## ChatGPT への注愁E

- 共有�Eータ機�Eはまだ稼働してぁE��せん。現在動くのは browser-local v0.9 チE��です、E
- v0.10 は staging�E�Emewri-staging`�E�に foundation + RPC migration 適用済みだが、E
  アプリは未接続�Eshared mode 無効のまま。production 接続済みと扱わなぁE��ください、E
- 新規提案では、Mewri の核である `今日のチE�EチE-> 投稿 -> ZINEへの貢献 -> 生�EZINE` を優先してください、E

## 2026-05-28 server-only shared-beta integration slice

- Added fake-client-only server boundaries for Supabase auth session resolution, private post image upload/verification, and an atomic shared-beta post+event gateway interface. No live Supabase connection was added.
- `POST /api/shared-beta/posts` now uses a server dependency factory, but it remains `503 shared_beta_route_unavailable` unless shared-beta env is complete and explicit server clients/repository/image resolver are injected.
- Browser request bodies still reject `validatedImagePath` and `imageUrl`. Successful HTTP responses remain `{ ok: true, post }` only.
- Image upload now requires authenticated membership and an active theme before reading or uploading the image; unauthorized attempts do not create objects.
- The post gateway models one atomic post+event operation. A real Supabase implementation still needs a narrow RPC or equivalent transaction before staging/shared mode can be enabled.
- No service role key was requested or used, no real env values were added, no migrations were applied, no deployment happened, and shared mode remains off.
- Validation:
`npm.cmd run typecheck` passed;
`npm.cmd test` passed with 95 tests;
`npm.cmd run build` passed.
- Independent review: first `codex.cmd review --uncommitted` was blocked by nested Windows sandbox spawn failure; rerun with `codex.cmd -s danger-full-access review --uncommitted -c model='"gpt-5.5"' -c model_reasoning_effort='"high"'` found P1 upload-before-authorization and P2 malformed-cookie findings; both were fixed and covered by tests. Final rerun reported no actionable correctness issues.
- Next gate: implement the real staging-only Supabase RPC/client adapter for the atomic post+event gateway and real image-file extraction only after human approval for staging env wiring. Production remains untouched.

## 2026-05-29 shared-beta post RPC draft slice

- Added draft migration `supabase/migrations/202605290001_shared_beta_create_post_rpc.sql` for `private.create_shared_beta_post` plus authenticated-only `create_shared_beta_post` RPC wrapper. The draft validates `auth.uid()`, membership, active same-group theme, private `post-images/<group>/<user>/<filename>` path, and matching `storage.objects` metadata before atomically inserting one `posts` row and one `post_created` event. No migration was applied.
- Updated `packages/data/src/supabase-shared-beta-post-gateway.ts` to use a narrow mocked Supabase `rpc("create_shared_beta_post", ...)` client shape and fail closed on RPC error, zero rows, multiple rows, or returned-row mismatch. It maps only through `postFromDbRow()` and returns `Post` only.
- Updated mocked tests in `packages/data/src/supabase-shared-beta-post-gateway.test.ts` and `apps/web/src/app/api/shared-beta/posts/server-dependencies.test.ts`.
- No real Supabase connection, no service role key, no env wiring, no shared mode, no deploy, and no production touch.
- Validation:
`npm.cmd run typecheck`,
`npm.cmd test` (102 tests), and `npm.cmd run build` passed. `git diff --check` had only CRLF warnings.
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
| C5.2 direct Storage upload | Pass (denied; message `Bucket not found`  Eupload did not succeed) |

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
- Validation:
`npm.cmd run typecheck` passed;
`npm.cmd test` passed with 128 tests;

`npm.cmd run build` passed.
- Follow-up C-3 preparation updated the server route dependency shape so the post boundary
  can be resolved per request. `createSharedBetaPostServerDependenciesFromEnvironment`
  now supports request-scoped Storage and RPC client factories that receive the member
  access token from the same request after auth/identity checks. This avoids reusing fixed
  member clients across requests.
- No real env values, migration, shared mode, production deploy, or live Supabase connection
  were added. The default route still fails closed unless complete explicit wiring is
  injected.
- Validation after C-3 preparation:
`npm.cmd run typecheck` passed;
`npm.cmd test` passed
  with 129 tests;
`npm.cmd run build` passed.
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

- ZINE生�E前に確認ダイアログ�E��E回生戁E/ 作り直しで斁E��を�Eり替え）、E
- 生�E後�EスチE�Eタス表示と `#generated-zine` へのスムーズスクロール、E
- モバイル幁E��E59px以下）�E余白を投稿フォーム・ZINE生�EブロチE��で調整、E
- No auth, persistence, shared-beta, migration, or env changes.

## 2026-06-01 local demo navigation slice (Cursor fallback)

- Skip link to main content, clearer header button labels, sample-post bulk-add confirmation.
- Scroll-to-ZINE respects `prefers-reduced-motion`; page metadata title/description in Japanese.
- No auth, persistence, shared-beta, migration, or env changes.

## 2026-06-01 local dev disk migration (owner PC performance)

- Added `.onedriveignore` for
ode_modules`, `.next`, and other regenerable artifacts.
- Added `docs/mewri_owner_local_dev_disk_setup.md`.
- Active worktrees under `C:\dev\mewri\`: Codex `ph`, Cursor `ph-cursor` (git worktrees).
- Added `tools/resume-local-dev-migration.ps1` (stops before `git restore` when the
  worktree is dirty; see owner doc).
- Legacy OneDrive `ドキュメンチEph-cursor` removed; OneDrive paths are not active
  development worktrees.
- Owner: open `C:\dev\mewri\ph-cursor` in Cursor; run
`npm.cmd install` there if

ode_modules` is missing.

## 2026-06-02 PR #1 merged to main

- PR: https://github.com/yoshikage1819-create/mewri/pull/1 (merged via `4d5a4fb`).
- Scope was local dev migration docs/script, local demo UI polish, resume script safety.
- Cursor branch `cursor/parallel-local-ui-docs` should track `origin/main` after merges.

## 2026-06-01 local demo progress copy slice (Cursor fallback, pre-merge)

- Shared ZINE progress copy helpers in `local-demo-ui.ts`
  (`formatZineRemainingHeadline`, `formatZineGenerateBlockedHint`, `formatPostSubmitSuccessMessage`).
- Show the progress card even before the first post, with a first-post encouragement line.
- Disabled「ZINEを作る」button now has an owner-facing hint via `aria-describedby`.
- No auth, persistence, shared-beta, migration, or env changes.

## 2026-06-01 RPC migration approval checklist alignment

- Codex verified that `supabase/migrations/202605290001_shared_beta_create_post_rpc.sql`
  already follows the preferred public-only RPC grant shape:
  `authenticated` gets EXECUTE on `public.create_shared_beta_post` only, while
  `private.create_shared_beta_post` remains callable only through the security-definer
  public wrapper.
- Added a local SQL contract test so future edits cannot accidentally grant
  `authenticated` direct EXECUTE on the private RPC or remove anon/public revokes.
- Updated `docs/mewri_supabase_staging_rpc_migration_approval_checklist_v0_10.md`
  so Part B no longer describes桁E as a future/manual fix; it is now the adopted
  draft contract.
- No staging SQL was applied, no live Supabase connection was made, no env values were
  added, shared mode remains disabled, and production was not touched.

## 2026-06-02 AI parallel/fallback execution design

- Added `docs/mewri_ai_parallel_fallback_execution_design.md` as the concrete
  coordination design for Codex + Cursor.
- It defines the `C:\dev\mewri\ph` Codex worktree, `C:\dev\mewri\ph-cursor`
  Cursor worktree, file ownership matrix, parallel protocol, fallback queue,
  ready-to-paste Cursor prompts, and handoff templates.
- Updated `docs/README.md` and `docs/mewri_cursor_codex_token_fallback.md` so
  Cursor can find the design without reading the full chat.
- Chat context has been compacted by the Codex app at least once in this thread.
  App-level compaction is automatic and not directly schedulable from repo code;
  durable compression is handled by keeping this handoff current after each slice.

## 2026-06-02 Codex app / CLI token economy update

- Adopted the pasted operating guidance: Codex app is the command center for
  priority, log interpretation, and producing compact CLI prompts; Codex CLI is
  the default implementer, validator, and diff reviewer.
- Updated durable repo guidance so future prompts stay short:
  `AGENTS.md`, `.codex/skills/mewri-ship-beta/SKILL.md`,
  `docs/mewri_ai_workbench_setup.md`, and
  `docs/mewri_ai_parallel_fallback_execution_design.md`.
- Updated Codex CLI examples from the old OneDrive path to `C:\dev\mewri\ph`.
- No product code, Supabase, auth, RLS, Storage, migration, env, shared mode,
  deployment, or production resources were touched.

## 2026-06-02 Parallel mode note: Codex shared-beta route work (historical)

- Historical note: C-3/C-4 shared-beta route and authorization-source work are now committed on `main`.
- Surfaces: `apps/web/src/app/api/shared-beta/posts/*` (route-boundary,
  server-dependencies, new `image-file.ts`).
- Cursor must **not** edit those files during fallback or parallel UI/docs work unless Codex explicitly hands off a new slice.

### Cursor next (parallel mode)

- Continue fallback queue on `cursor/parallel-local-ui-docs`: local demo UI/tests/docs only.
- Rebase or merge `origin/main` into the Cursor branch after each `main` advance.

### Codex next on `C:\dev\mewri\ph`

- Finish and commit shared-beta post route slice; run security review pass.
- Continue v0.10 foundation per §次に行うべきこと item 1 (staging adapter wiring after owner approval).

## 2026-06-02 local demo sample image helper slice (Cursor, parallel mode)

- Merged `origin/main` (PR #1 + Codex workflow docs) into `cursor/parallel-local-ui-docs`.
- Moved `createSampleImageDataUrl` into `local-demo-ui.ts` with tests (SVG title escaping).
- No shared-beta API, auth, or persistence changes.

## 2026-06-02 local demo post list empty-state slice (Cursor fallback)

- Context-aware empty post list copy (`formatEmptyPostListMessage`, `formatPostListKicker`).
- Extracted `calcLocalImageScale` for tested local image downscale math.
- Codex token exhausted: Cursor continues on `ph-cursor` only; do not edit `ph` shared-beta API WIP.

## 2026-06-02 local demo safety/feedback accessibility (Cursor fallback)

- Safety notice: summary toggle hint, list structure, focus ring, non-color expand marker.
- Feedback note: label/htmlFor, textarea describedby, output for char count with aria-label.
- Review guide: keyboard/screen-reader notes added.

## 2026-06-02 local demo copy consistency audit (Cursor fallback)

- Aligned banner, safety notice bullets, feedback intro, tests, and review guide wording.
- Single source for user-facing copy: `local-demo-ui.ts` (including top banner text).

## 2026-06-02 local demo review guide (Cursor fallback, docs only)

- Added `docs/runbooks/local-demo-review-guide.md` for non-technical reviewers.
- Linked from `docs/README.md`. Covers safety notice, feedback note UI, and manual reporting.

## 2026-06-02 local demo mobile spacing slice (Cursor fallback)

- Tuned `styles.css` mobile rules (`<=759px`) to match `home-wireframe.svg` section rhythm
  (~20px between blocks, ~16px shell inset) and v0.9.7 tap/readability guidance.
- Adjusted shell, section panels, post form, ZINE generate block, theme pills, and ZINE book gaps.
- No logic, auth, or shared-beta changes.
## 2026-06-02 C-3 code-only staging route factory slice

- Added an explicit staging-only route gate
  `MEWRI_ENABLE_STAGING_SHARED_BETA_POST_ROUTE=true` for
  `POST /api/shared-beta/posts`. The exported route still returns
  `503 shared_beta_route_unavailable` by default, including with no gate or no
  trusted repository/authorization source.
- The route factory now resolves public Supabase URL + anon/publishable key
  only for the gated staging route. It rejects service-role/secret-style keys
  in the public key slot and does not require or use `SUPABASE_SERVICE_ROLE_KEY`.
- Added request-scoped auth, Storage, and RPC client factory paths that use the
  same member access token after authentication passes. Tests use injected
  fake clients only; no live Supabase request was made. After review, the
  route factory remains fail-closed unless trusted auth, repository, Storage,
  and RPC dependencies are all explicitly injected; it does not silently create
  a live Storage upload path from env alone.
- Added multipart form parsing for shared-beta post requests. The server route
  accepts `userId`, `groupId`, `themeId`, `caption`, and an `image` file, rejects
  client-supplied `validatedImagePath`/`imageUrl`, and passes the file to the
  server upload boundary.
- Added tests for missing staging gate, incomplete/invalid public config,
  service-role/secret key rejection, request-scoped client factories, missing
  auth before upload/RPC, multipart missing/unsupported/oversized image
  rejection, unauthorized group/theme rejection, and happy-path fake posting.
- No real env values, service-role key, live Supabase connection, migration,
  shared mode, deployment, or production resource was used.
- Validation:
`npm.cmd run typecheck` passed;
`npm.cmd test` passed with
  160 tests;
`npm.cmd run build` passed; `git diff --check` returned only CRLF
  normalization warnings.
- Independent review: the first `codex.cmd review --uncommitted` hit the known
  Windows sandbox spawn failure. The full-access rerun found a P2 issue where
  default Storage client fallback would fail against current staging RLS; fixed
  by requiring explicit trusted Storage/RPC clients or factories. Final
  full-access rerun reported no C-3 route finding; it only flagged the unrelated
  excluded `docs/mewri_friend_pitch_deck.html` artifact.
- Blocker: true live staging route activation still needs a trusted Supabase
  membership/theme authorization source or repository adapter plus an approved
  upload mechanism/policy. Until that exists and is approved, leave the
  exported route fail-closed.

## 2026-06-03 C-4 trusted authorization source contract slice

- Added a narrow `SharedBetaPostAuthorizationSource` contract that answers only
  whether an authenticated user may create a post for a target group/theme. It
  does not expose `MewriState`, repository handles, Storage clients, or Supabase
  details.
- Added a memory-repository adapter helper for tests/local compatibility:
  `createRepositorySharedBetaPostAuthorizationSource`. The app route factory now
  requires this narrow authorization source instead of a full `MewriRepository`.
- Updated the shared-beta route boundary so authorization source checks run
  before RPC command execution, and the app route factory checks the source
  before image file resolution/upload. Unauthorized member/theme cases do not
  upload and do not call RPC.
- Preserved fail-closed behavior: the exported route remains
  `503 shared_beta_route_unavailable` unless the explicit staging gate and
  trusted auth, authorization source, Storage, and RPC dependencies are all
  injected.
- Fixed a review-found ordering regression in the local guarded command service:
  membership/theme authorization now runs before server image validation.
- No live Supabase connection, real env values, service-role key, migration,
  shared mode, deployment, or production resource was used.
- Validation:
`npm.cmd run typecheck` passed;
`npm.cmd test` passed with
  166 tests;
`npm.cmd run build` passed; `git diff --check` returned only CRLF
  normalization warnings.
- Independent review: the standard `codex.cmd review --uncommitted` timed out.
  Full-access review found the authorization-before-image-validation ordering
  issue; it was fixed and covered by a regression test. Final full-access review
  reported no discrete correctness, security, or maintainability issues.
- Remaining blocker/next gate: live staging activation still needs an approved
  Storage upload mechanism/policy and real staging adapters. Stop before
  credentials, migrations, shared mode, deployment, or production.

## 2026-06-03 Cursor fallback routing expansion

- Documentation-only workflow update. No product code, Supabase wiring, env
  values, migrations, shared mode, deploy, or production resources were changed.
- Expanded Cursor-safe implementation lanes for fallback/parallel periods:
  local demo UI/accessibility, pure local-demo helpers and tests, local-only
  feedback UI, ZINE preview/readability, fixtures and regression tests, owner
  docs/runbooks, and handoff cleanup.
- Fallback now explicitly means Codex CLI and Codex app are both unavailable
  until reset. Routing in that mode is Cursor 80-90%, ChatGPT 10-20%, Codex CLI
  0%, and Codex app 0%.
- ChatGPT is the owner command center only: choose the next safe Cursor task,
  rewrite Cursor prompts, interpret short non-secret validation logs, and format
  handoffs. ChatGPT is not a code executor, not a Codex diff-review substitute,
  and must not approve auth/RLS/Storage/migration/API-security work as
  merge-ready.
- Cursor hard stops remain: `supabase/**`, `apps/web/src/app/api/**`,
  `packages/data/**` shared-beta auth/storage/RPC/security/runtime/Supabase
  code, secrets/env/deploy/production, migrations, staging activation, and main
  merge/push. If Cursor reaches those surfaces during fallback, it stops and
  writes a handoff for Codex after reset.
- Unrelated/untracked `.vscode/` and `docs/mewri_friend_pitch_deck.html` remain
  excluded from staging/commit decisions.

## 2026-06-05 Phase 1 Mewri Memory Pack

- Added repository-local canonical memory files under `memory/` for project
  core, current status, safety constraints, shared-beta gates,
  Codex/Cursor/ChatGPT protocol, architecture, and next actions.
- Added `docs/mewri_memory_pack.md` to explain Phase 1 purpose, selective
  memory injection, stale-memory risk, critical-memory review rules, and the
  future optional roles of Obsidian and Mem0.
- Updated `AGENTS.md` and `docs/README.md` with lightweight memory-pack
  pointers. Do not inject all memory files by default; select only the relevant
  files and verify critical memory against current repo docs before
  security-sensitive work.
- No Mem0 or Obsidian integration, selector tooling, app code, Supabase work,
  migrations, env values, deploy, shared mode, production changes, service-role
  key use, or real Supabase connection were added.
- Unrelated/untracked `.vscode/` and `docs/mewri_friend_pitch_deck.html` remain
  excluded from staging/commit decisions.

## 2026-06-05 Obsidian memory vault bootstrap

- Added docs for local Obsidian memory-vault setup:
  `docs/mewri_obsidian_memory_vault_setup.md`.
- Created a local, non-repo Obsidian vault at `C:\dev\mewri\memory-vault` with:
  `README.md`, `mewri/00-start-here.md`, `mewri/obsidian-rules.md`,
  `mewri/memory-pack-sync.md`, `mewri/chatgpt-fallback-command-center.md`, and
  `.obsidian/app.json`.
- The vault is a human reading/editing UI only. Repo `memory/` remains the
  intended canonical agent-readable memory pack once added.
- No Obsidian Sync, plugin, Mem0, selector tooling, app runtime dependency,
  Supabase connection, env values, migration, shared mode, deploy, production
  resource, or secret handling was added.

## 2026-06-05 C-5 Supabase authorization source adapter slice

- Added `packages/data/src/supabase-shared-beta-post-authorization-source.ts`,
  a narrow fakeable Supabase read adapter for `SharedBetaPostAuthorizationSource`.
  It answers only whether authenticated user X can create a post in group Y for
  theme Z.
- The adapter checks exactly one `group_members` match before checking exactly
  one same-group active `themes` row. It returns existing denial codes:
  `group_membership_required` and `active_group_theme_required`.
- It fails closed on Supabase read errors, thrown read errors, missing rows,
  multiple rows, malformed rows, and mismatched rows. It does not expose
  `MewriState`, raw rows, table clients, Storage clients, or full repository
  access to the route/UI.
- Added fake-client tests for member success, non-member denial, missing /
  other-group / inactive themes, read errors, ambiguity, malformed rows, and
  no raw-row/state exposure.
- Added a route dependency test proving an injected Supabase-backed
  authorization denial stops before image resolution, Storage upload, client
  factory creation, or RPC.
- Route defaults remain fail-closed. No live Supabase connection, env values,
  service-role key, migrations, Storage policies, shared mode, deploy, or
  production resources were used.
- Validation: `npm.cmd run typecheck` passed; `npm.cmd test` passed with 200
  tests; `npm.cmd run build` passed; `git diff --check` returned only CRLF
  normalization warnings.
- Independent review: standard `codex.cmd review --uncommitted` timed out
  without findings; full-access rerun reported no discrete correctness or
  security issue.
- Remaining blocker/next gate: live staging activation still needs approved
  Storage upload mechanism/policy and explicit trusted staging adapter wiring.
  Stop before credentials, migrations, shared mode, deployment, or production.

## 2026-06-09 friend-deck cleanup and C-5 preservation

- Owner deleted the friend deck / PPTX / PDF / script / output artifacts and kept only `docs/mewri_friend_onboarding_invitation.md` and `docs/mewri_friend_first_week_guide.md`.
- Confirmed `docs/mewri_friend_main_deck*`, `docs/mewri_friend_one_page_overview*`, `docs/mewri_friend_pitch_deck.html`, `docs/scripts/`, and `outputs/` are absent in the current worktree.
- `pptxgenjs` had no remaining references outside package manifests after the deck generator deletion. It was removed from `devDependencies`; `vitest`, package scripts, and lint config were left unchanged.
- C-5 Supabase authorization source work remains the active main slice. Route defaults remain fail-closed, and no Supabase live connection, env value, service-role key, migration, shared mode, deployment, or production resource was used.
