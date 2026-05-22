# Mewri Vercel Deployment Guide v0.9

更新日: 2026-05-22
対象: v0.9 単一ユーザーURL共有ベータ（browser-local demo）

## 1. 前提
- このデプロイは「単一ユーザー・ブラウザローカルデモ」向けです。
- データ保存は `localStorage` のみです（共有DBなし）。
- MVP IAと投稿挙動は変更しません。

## 2. 推奨Vercelプロジェクト設定（初回）
- Framework Preset: `Next.js`
- Root Directory: `.`（リポジトリルート）
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: 未設定（Next.js標準）
- Node.js Version: `22.x`

## 3. ルート/ワークスペース注意点
- このリポジトリは npm workspaces 構成です:
  - `apps/*`
  - `packages/*`
- `apps/web` は `@mewri/core` / `@mewri/data` に依存するため、`apps/web` 単体ではなくリポジトリルート前提で依存解決します。
- そのため、Root Directory は `apps/web` ではなく `.` を推奨します。

## 4. 環境変数ステータス
- 現在のMVPは必須環境変数なしで `build` 可能です。
- Vercelの Environment Variables は空で開始できます。

## 5. 既知の制約（URL共有デモ）
- 投稿・ZINE生成結果は閲覧者それぞれのブラウザ内にのみ保存されます。
- 端末/ブラウザが変わるとデータは共有されません。
- ブラウザデータ削除で状態は消えます。
- 未実装のまま:
  - shared database
  - authentication
  - real follows
  - notifications
  - host-created themes
  - 自分の投稿
  - post-first posting
  - multi-group posting
  - real image upload storage

## 6. デプロイ前チェックリスト
1. `npm.cmd run typecheck` が通る
2. `npm.cmd run build` が通る
3. ホームIA順序が維持されている
4. `URL共有デモ` 注意文が表示される
5. プレースホルダーが未実装に見える文言になっている
6. モバイル/デスクトップで主要レイアウト崩れがない

## 7. デプロイ後スモークテスト
1. URLを開いてホームが表示される
2. `今日の投稿をする` から投稿できる
3. `みんなの投稿` で投稿一覧が見える
4. 未来テーマは投稿不可、クローズ済みテーマは閲覧のみ
5. 条件を満たすと `ZINEを生成` が有効化される
6. ページ再読込後、同一ブラウザで状態が保持される
7. 別ブラウザ/シークレットでは状態が共有されない

## 8. URL配布時の案内文（推奨）
```text
これはMewriの単一ユーザーURL共有デモです。
投稿やZINE生成の結果は、あなたのブラウザ内にのみ保存されます（他ユーザーには共有されません）。
ログイン、フォロー、通知、画像アップロードは未実装です。
今日のテーマに投稿して、「みんなの投稿」から一覧確認し、条件達成後にZINE生成を試してください。
```
