# Mewri v0.10 Closed Shared Beta Foundation

更新日: 2026-05-26

状態: 実装準備の最初の安全な縦切り

## なぜ v0.10 を開始するか

v0.9 は、ブラウザ内だけで完結するデモとして、Mewri の主ループを操作可能にした。

```text
今日のテーマ -> 写真を投稿 -> 進行中のZINEへの貢献 -> 生成ZINEを読む
```

次に検証すべき中心仮説は、複数の人が同じ ZINE に写真を持ち寄ることで、この報酬構造が強くなるかである。これは端末ごとに孤立した `localStorage` では観測できないため、UI 機能追加より先に、閉じた共有ベータの土台を準備する。

## v0.9 で確認できたこと

v0.9.5 から v0.9.7 の改善と実機確認により、少なくとも次が確認対象として成立した。

- 主導線は `参加中のZINE` で今日のテーマを見て写真を投稿し、`このZINEの中身` で蓄積と生成結果を見る構成が分かりやすい。
- 画像 URL 中心ではなく、端末からの画像選択とプレビューが投稿の実感に必要だった。
- ZINE は投稿カード一覧ではなく、読む対象として提示する方が Mewri の報酬に合う。
- モバイルと desktop のレイアウトを維持しながら、今日の投稿に集中する IA を保てる。
- `localStorage` 保存で、単一ブラウザ内の投稿、再読み込み、ZINE生成のデモは実行できる。

## localStorage では検証できないこと

- 招待された複数ユーザーが同じ active ZINE と投稿一覧を見ること。
- 別端末で投稿した画像がグループ内の他メンバーに反映されること。
- 誰が投稿したか、誰がどのグループの内容を読めるかという信頼境界。
- 投稿と ZINE 生成の同時操作に対する永続化・整合性。
- 実画像の安全な保存、読み取り、削除方針。

したがって v0.10 は、公開SNS化ではなく、招待された少人数だけで共同制作を検証するための基盤を対象とする。

## 共有書き込みを公開・匿名にしない理由

Mewri の投稿はグループの制作物に直接入り、最終的に ZINE のページになる。匿名または公開書き込みを許すと、無関係な画像投稿、成りすまし、画像権利問題、生成結果の汚染が直ちに起き得る。

閉じたベータでは次を原則とする。

- 読み取りと投稿は、招待を受けて認証済みのグループメンバーに限定する。
- 投稿者IDは認証セッションから決定し、ブラウザ入力を信頼しない。
- グループ作成、メンバー追加、テーマ設定、ZINE公開はサーバー管理の操作とする。
- `anon` ロールに投稿、Storage upload、グループ内容閲覧のポリシーを与えない。

## 推奨バックエンド: Supabase

この段階では Supabase を推奨する。

- Postgres により、現在の `User/Profile`, `Group`, `GroupMember`, `Theme`, `Post`, `ZineCycle`, `Zine`, `ZinePage`, `EventLog` 関係をそのまま関係データとして扱える。
- Supabase Auth は少人数招待ベータに適した email magic link / email OTP を提供する。
- Supabase Storage は実画像を Data URL ではなく非公開オブジェクトとして保持できる。
- RLS を `group_members` に結び付け、同じグループに所属する人だけがデータと画像へアクセスする境界を表現できる。

この選択は live 接続済みという意味ではない。現時点で追加するのは、設定境界、migration ドラフト、運用手順である。

参考となる公式資料:

- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage Access Control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Passwordless Email Login: https://supabase.com/docs/guides/auth/auth-email-passwordless

## 実行モードと環境変数

既定モードは現在のブラウザローカルデモであり、環境変数を要求しない。現在の Vercel デモも Supabase 資格情報なしで build 可能なままにする。

将来、サーバー側共有経路を有効化する際の必須 server-only 変数:

```dotenv
MEWRI_RUNTIME_MODE=shared_beta
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-secret>
SUPABASE_POST_IMAGE_BUCKET=post-images
```

`SUPABASE_SERVICE_ROLE_KEY` はブラウザに公開してはならない。`NEXT_PUBLIC_` 接頭辞を付けない。
`SUPABASE_POST_IMAGE_BUCKET` は shared beta では `post-images` 固定契約であり、
異なる値を設定した runtime は共有モードとして扱わずローカルデモへ閉じる。

認証セッションをブラウザで開始する実装を追加する段階で必要になる公開設定:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key>
```

公開 anon key は RLS を回避しない。共有モードを提供する前に、実際の JWT と RLS で読み書きを検証する必要がある。

## 認証方針

小規模な closed beta の推奨認証は email magic link または email OTP である。

- 所有者が先に招待メールアドレスと所属グループを登録する。
- 招待済みアドレスだけにログイン導線を渡す。
- magic link/OTP の発行時に新規ユーザーの自動作成を無条件に許可しない。
- ログイン後に `auth.users.id` と `profiles.id` を対応付け、`group_members.user_id` によってアクセスを制御する。
- 公開サインアップ、ユーザー検索、グループ発見は追加しない。

## 画像保存方針

ローカルデモでは引き続き Data URL を `localStorage` に保存できる。

共有モードでは次を必須とする。

- 画像本体は Supabase Storage の非公開 `post-images` bucket に保存する。
- オブジェクトパスは `post-images/<group_id>/<authenticated_user_uuid>/<generated_filename>` とする。
- `posts.image_url` は Storage オブジェクトへの参照または期限付き取得に必要なパスを保持し、Data URL は保存しない。
- upload 前にサーバーで MIME type、サイズ、所属グループ、投稿先の active theme を検証する。
- server upload 経路が完成するまでは `storage.objects` の authenticated `insert` policy を作らず、画像 upload 自体を拒否する。
- bucket 側でも初期許可 MIME type を JPEG / PNG / WebP、サイズを 10 MB 以下に制限する。

## データモデル

共有モードは現在のドメイン関係を維持する。migration ドラフトは [202605260001_closed_shared_beta_foundation.sql](../supabase/migrations/202605260001_closed_shared_beta_foundation.sql) に置く。

| 現行モデル | Supabase table | 関係 |
| --- | --- | --- |
| `User` | `profiles` | `auth.users.id` と1対1 |
| `Group` | `groups` | 作成者は `profiles` |
| `GroupMember` | `group_members` | `profiles` と `groups` の所属境界 |
| `ZineCycle` | `zine_cycles` | group内の制作期間 |
| `Theme` | `themes` | cycle と group に所属 |
| `Post` | `posts` | 投稿者、group、theme に所属 |
| `Zine` | `zines` | cycle ごとに最大1冊 |
| `ZinePage` | `zine_pages` | zine の順序付きページ。DB 内では同一 group 制約用の `group_id` も保持 |
| `EventLog` | `event_logs` | group単位の操作記録 |

Supabase Auth 本人性に結び付く `profiles.id` と各 `user_id` / 招待ユーザー参照は
`uuid` のまま維持する。一方、`groups`, `group_members`, `zine_cycles`,
`themes`, `posts`, `zines`, `zine_pages`, `event_logs` の domain-owned ID と
それを参照する group/theme/cycle/post/ZINE/entity 列は、現行の
`group_*` / `cycle_*` / `theme_*` / `post_*` / `zine_*` / `page_*` /
`event_*` ID を保存できる `text` 契約とする。

閉じた招待管理用に、ドメイン外の運用テーブル `beta_invites` を migration ドラフトに含める。この表は公開機能ではなく、サーバーだけが扱う allowlist である。

## RLS 期待値

- `profiles`, `groups`, `group_members`, `zine_cycles`, `themes`, `posts`, `zines`, `zine_pages`, `event_logs`, `beta_invites` は RLS を有効化する。
- `anon` には読み取り・書き込みの policy を付けない。
- 認証済みユーザーは、所属する group の cycle/theme/post/ZINE/page/event だけ読める。
- server upload / post 作成経路が未実装の間は、authenticated を含む client に post insert policy を与えない。実装時は、サーバーが本人の `user_id`、所属 group、active theme、検証済み画像パス、`group_only` 可視性を確認して書き込む。
- メンバー招待、テーマ作成、ZINE生成/公開、イベント書き込みはブラウザ直書きにせず、認証と権限を検証したサーバー経路から行う。
- Storage の読み取りは group membership を検証する。upload は、サーバー経路完成までは policy を与えず拒否し、実装時に membership と authenticated user path を検証する。
- cycle/theme/post/ZINE の `group_id` が関連参照と一致することを複合外部キーで保証し、server-only 書き込みの不整合でも別 group の参照を作らない。
- `private` RLS helper を使用する authenticated member には helper の
  `execute` と schema `usage` のみを与え、`anon` には与えない。

Service role は RLS を回避できるため、サーバー実装での membership/role 検証は別途必須である。これは本スライス時点で未完成のセキュリティ境界である。

## 今回実装するもの

- localStorage デモを既定動作として維持する。
- `packages/data` に server-only の共有設定検出境界を追加する。
- shared beta 設定が不完全な場合はローカルモードへ戻る。
- 設定が揃っていても、認証済み実DBアダプタがない状態で共有モードを開始しない。
- `packages/data` に server-side の投稿 command service を追加し、認証、本人性、group membership、active theme、private image object path、および server-side upload / Storage lookup による画像検証の拒否境界をテスト可能にする。
- `packages/data` に route/application 境界を追加し、認証結果と server 側で検証済みの image path を受けるまで投稿 command を呼ばない。
- `apps/web` の request body は `validatedImagePath` / `imageUrl` を受け付けず、client が検証済み path を自己申告する経路を持たない。
- `apps/web` の API route は実認証・実 adapter 接続前には `503 shared_beta_route_unavailable` を返し、共有書き込みを開始しない。
- Supabase schema / RLS / Storage policy の適用前 SQL ドラフトを追加する。
- closed beta の運用判断と手動セットアップ手順を記録する。

## 明示的に対象外

- live Supabase project への接続
- 実ログイン画面、magic link/OTP 送信処理
- 実際の Storage upload と signed URL 表示
- 実 database repository adapter
- host-created themes
- 個人受け皿テーマや post-first 投稿
- follow、コメント、いいね、通知
- 公開 discovery、公開 ZINE feed
- 複数 ZINE / 複数 group への同時投稿

host themes や個人受け皿投稿は、共有された今日のテーマへの共同投稿という最初の仮説をぼかす。follow や公開 discovery は共有ZINE成立後の流通機能であり、権限とモデレーションを広げるため、この段階では入れない。

## 所有者が行う Supabase 手順

1. Supabase project を新規作成し、Region と課金/保存要件を確認する。
2. Auth の Email provider を有効にし、Site URL と許可 redirect URL を closed beta 用 URL に限定する。
3. 自動的な公開 signup を提供しない運用を決め、招待済みメールのみを `beta_invites` と auth user/profiles/group_members に登録する管理手順を用意する。
4. SQL Editor または Supabase CLI migration として `supabase/migrations/202605260001_closed_shared_beta_foundation.sql` をレビュー後に適用する。
5. `post-images` bucket が private で、server route 実装前は認証済みメンバーの post insert と画像 upload が拒否され、匿名の select/insert も拒否されることを確認する。
6. Vercel の server-only 環境変数へ `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_POST_IMAGE_BUCKET=post-images` を登録する。ただし `MEWRI_RUNTIME_MODE=shared_beta` は実 adapter と server auth route 完成まで設定しない。
7. 次の実装で、サーバー側 repository adapter、認証 callback、投稿 upload/insert、所属検証の統合テストを追加する。

## ロールアウトとロールバック

ロールアウト:

1. 今回はコードとSQLドラフトだけを追加し、公開デモは local mode のまま運用する。
2. 実 project 作成後、staging 相当の招待グループで Auth/RLS/Storage を検証する。
3. server-controlled 投稿と ZINE 読み取りが成立してから、招待者だけへ共有モードURLを渡す。

ロールバック:

- shared mode は明示的な `MEWRI_RUNTIME_MODE=shared_beta` を必要とする。
- 障害または権限不備があれば、この変数を外して再デプロイし、既存 local demo へ戻す。
- 共有DBのデータを localStorage デモへ自動コピーしない。テストデータの削除/保持は Supabase 側で所有者が判断する。

## 招待開始前の受け入れ条件

- local demo が Supabase 環境変数なしで build / 表示 / 投稿 / ZINE生成できる。
- 実 Supabase project に migration が適用され、すべての公開テーブルと画像 bucket で RLS が有効である。
- 匿名ユーザーによる group content read、post insert、image upload が拒否される。
- authenticated member の post insert と image upload も、検証済み server write / upload 経路が追加されるまでは拒否される。
- server write / upload 経路の実装後、招待済み authenticated member は自分の group のみ読め、active theme への本人投稿だけをサーバー経由で実行できる。
- 招待されていない authenticated user が group content を読めず書けない。
- 画像が Data URL ではなく private Storage 経由で保存・閲覧される。
- 投稿と event、ZINE publish と page/event のトランザクション整合性が adapter テストで確認される。
- server-side 投稿 command の単体テストで、未認証、なりすまし、非メンバー、他 group / inactive theme、不正画像パス、および server 未検証の正形式 path が拒否される。
- iPhone Safari と desktop で既存 IA と主要操作が崩れない。

## 現時点の結論

このスライスは、Supabase project がなくても実装とレビューが可能である。ただし共有βを稼働させる準備が完了したという意味ではない。実際に招待者が同じ ZINE データを共有できるようにするには、所有者による Supabase project 作成と migration 適用に加え、認証済みサーバー書き込み adapter と実RLS検証が次に必要である。
