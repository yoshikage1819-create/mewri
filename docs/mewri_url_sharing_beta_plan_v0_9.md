# Mewri URL共有β 計画 v0.9

作成日: 2026-05-22
状態: 近距離β合格後の次ステップ

## 目的

セルフチェック結果が「1 = 迷わず使えた」ため、次はURLを共有して身近な人に試してもらう段階へ進みます。

ただし、ここでいきなり本格的なSNSや共有DBを入れる必要はありません。まず決めるべきなのは、URL共有βをどの強度で始めるかです。

## 結論

最初のURL共有βは、**単一ユーザー向けのデモURL** として始めるのが安全です。

理由:

- 現在のMVPはlocalStorage中心で、共有データベースではない。
- まだ認証、ユーザー分離、グループ招待、画像アップロードがない。
- いきなり複数人が同じZINEに投稿するβにすると、技術的にも設計的にも一気に重くなる。
- 今確認したいのは、共同編集の完全性ではなく「Mewriの体験が伝わるか」。

## URL共有βの種類

### A. 単一ユーザーデモURL

最初に推奨する形。

特徴:

- URLを開いた人が、自分のブラウザ内でMewriを試す。
- データはその人のブラウザに保存される。
- 他の人の投稿とは同期されない。
- 「共有ZINE」ではなく「Mewri体験デモ」として扱う。

メリット:

- 早く公開できる。
- 大きなDB設計を入れずに済む。
- 画面、文言、投稿体験、ZINE生成の評価ができる。

デメリット:

- 複数人で同じZINEを作っている感じはまだ出ない。
- 本当の共同制作体験は検証できない。

### B. 共有ZINE β

まだ早いが、次の大きな目標。

特徴:

- 複数人が同じZINE/グループに投稿できる。
- 投稿が共有DBに保存される。
- 招待、権限、画像保存、荒らし対策が必要になる。

メリット:

- Mewri本来の共同制作体験に近い。

デメリット:

- 認証、DB、アップロード、権限の設計が必要。
- β公開までの時間が伸びる。
- 初心者がCodex/CLIで進めるには、一気に難度が上がる。

## v0.9でやること

v0.9では、まずAの単一ユーザーデモURLを目指します。

やること:

1. デプロイ先を決める。
2. 本番ビルドで動くか確認する。
3. localStorageデモであることをUIまたは説明文に明記する。
4. 友人に送る短い説明文を作る。
5. 送った相手から、迷った場所と欲しい機能を聞く。

やらないこと:

- 共有DB。
- 認証。
- 実画像アップロード。
- 実フォロー。
- 通知。
- hostテーマ。
- `自分の投稿`。
- 複数人同時投稿。

## 推奨デプロイ方針

Next.jsアプリなので、最初の候補はVercelです。

ただし、今すぐCLIでデプロイまで進める前に、次を確認します。

- GitHubリポジトリにpushできる状態か。
- Vercelアカウントを使うか。
- 環境変数が必要ない状態か。
- localStorageデモで問題ないと明記できるか。

## 友人に送る説明文

最初のURL共有βでは、次の説明で十分です。

```text
Mewriの初期デモです。
今日のテーマに写真を投稿して、みんなの投稿を見て、ZINEを生成するところまで試してみてください。

まだ本物のログイン、フォロー、画像アップロード、複数人での同期はありません。
データはあなたのブラウザ内だけに保存されます。

迷った場所、押したくならなかったボタン、意味が分からなかった言葉があれば教えてください。
```

## URL共有βの合格条件

次を満たせば、URL共有β v0.9は合格です。

- URLを受け取った人がアプリを開ける。
- 今日のテーマに投稿できる。
- `みんなの投稿` から投稿一覧を見られる。
- `ZINEを生成` まで到達できる。
- localStorageデモであることが伝わる。
- 未実装機能が実装済みに見えない。
- スマホとPCで大きな崩れがない。

## 次の判断

URL共有βの結果で、次を選びます。

1. 体験は伝わったが共同感が足りない: 共有DB/招待設計へ進む。
2. 今日のテーマ以外に投稿したい声が強い: `自分の投稿` を先に設計する。
3. 人間がテーマを作りたい声が強い: hostテーマを先に設計する。
4. 画像URLが分かりにくい声が強い: 画像アップロードを先に検討する。

## 次にCLIへ投げる命令文

推奨モデル: 5.3 Codex

理由:

- まだ大きなDB/認証設計ではなく、既存MVPをURL共有デモとして安全に整える作業だから。
- 小さなUI文言、ビルド確認、デプロイ準備の洗い出しが中心だから。

```text
Prepare Mewri for a v0.9 single-user URL-sharing beta demo.

Use these docs as source of truth:
- docs/mewri_mvp_v0_8_beta_readiness.md
- docs/mewri_self_beta_qa_v0_8.md
- docs/mewri_nearby_beta_handoff_v0_8.md
- docs/mewri_url_sharing_beta_plan_v0_9.md
- docs/mewri_ai_workbench_setup.md

Do not implement shared database, authentication, real follows, notifications, host-created themes, 自分の投稿, post-first posting, multi-group posting, or real image upload storage.

Goal:
Make the current MVP safe to share as a single-user browser-local demo URL.

Tasks:
1. Review the app for any copy that implies shared multi-user behavior is already implemented.
2. Add or adjust small UI copy if needed to clearly say this is a demo and data is saved in this browser only.
3. Confirm the current MVP flow still works:
   - 参加中のZINE
   - 今日のテーマ
   - 今日の投稿をする
   - みんなの投稿
   - このZINEの中身
   - ZINEを生成
4. Confirm placeholder sections do not look implemented.
5. Check whether the app can be deployed as a static/single-user demo without required environment variables.
6. Run npm.cmd run typecheck.
7. Run npm.cmd run build.
8. Report whether the app is ready for Vercel or another URL-sharing deployment path.

If any issue requires shared persistence, auth, or image upload, document it instead of implementing it.
```
