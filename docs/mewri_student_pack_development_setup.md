# Mewri Student Pack 開発環境セットアップ

## 目的

Mewri の現在の開発段階では、機能を増やす前に、同じ環境で安全に起動できることと、スマホ・PC の表示を確実に確認できることが重要です。

この文書は GitHub Education の特典のうち、現在の Mewri に直接役立つものだけを採用する方針を記録します。

## いま有効な環境

- GitHub Pro: Student benefits により有効。GitHub の請求画面で `$0.00` を確認済み。
- GitHub Codespaces: `180 core-hours` / `20GB` の枠を確認済み。
- GitHub Copilot: 現在は Copilot Free が有効。Copilot Student への切替は GitHub 側でプラン変更が一時停止中のため、再開後に確認する。
- Vercel: 現在の公開プレビューを引き続き使用する。

## 今回セットアップしたもの

`.devcontainer/devcontainer.json` を追加し、GitHub Codespaces で同じ開発環境を再現できるようにします。

Codespaces を作成すると、以下が自動的に準備されます。

- Node.js 22 ベースの開発環境
- `npm install` による依存パッケージの準備
- `localhost:3000` のプレビュー用ポート転送
- ESLint と、利用可能な範囲での GitHub Copilot 拡張

Codespaces 内での起動コマンド:

```bash
npm run dev:host
```

## 今すぐ追加しないもの

- Azure / DigitalOcean: 現在は Vercel と `localStorage` の検証段階であり、別ホスティングやクラウド基盤は検証対象を増やしてしまう。
- 外部データベース・認証: 複数ユーザー版へ進む設計判断の後に導入する。
- Notion 連携: 設計書が Git 管理の `docs/` に揃っているため、いま移行すると情報源が二重になる。

## 次に価値が高い特典

スマホ表示の崩れを繰り返し確認する必要があるため、レスポンシブ表示確認を効率化する Polypane または LambdaTest の Student Pack 特典が次の候補です。

ただし、外部サービスへのアカウント連携や利用条件の同意を伴うため、引換条件を確認したうえで個別に有効化します。

## 運用上の注意

- Codespaces は無料枠の使用時間を消費するため、使用後は停止する。
- Copilot のデータ利用設定と公開コード一致候補の扱いは、必要に応じて GitHub 設定で見直す。
- 本番に近い共同制作テストへ進むまでは、現在の MVP の範囲を越えるバックエンド導入を先送りする。
