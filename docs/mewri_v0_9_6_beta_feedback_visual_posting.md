# Mewri v0.9.6 Beta Feedback: Visual Posting

## Beta feedback received
- ホーム画面の説明が長く、同じ説明が繰り返されて読みづらい。
- 投稿時に画像URL入力が中心だと、実際に投稿している感覚が弱い。
- 生成ZINEが投稿カード一覧に見えてしまい、読む対象としてのまとまりが弱い。

## What changed in v0.9.6
- ホーム画面の可視コピーを短縮し、操作中心の日本語に整理。
- β制限とlocalStorage制限は、1行のコンパクト通知へ集約。
- 投稿フォームに `input type="file" accept="image/*"` を追加。
- 選択画像を `FileReader.readAsDataURL` でローカルData URL化し、そのまま `post.imageUrl` として保存。
- 選択画像のローカルプレビューを追加。
- 既存のサンプル画像入力導線は維持。
- 手動画像URL入力は「URL入力（上級）」として折りたたみ式に変更（フォールバックとして残す）。
- 生成ZINE表示を投稿カードとは別見た目へ変更。
- ZINEに表紙、ページ番号、紙面スタイル、画像比率強化、終端ページ（END）を追加。
- IA順は維持。
  1. 参加中のZINE
  2. このZINEの中身
  3. フォロー中ユーザーの投稿
  4. 発見と回遊
- 未実装領域は引き続き `未実装` と明示。

## Why local image selection is still MVP browser-local scope
- 画像ファイルはブラウザ内でData URLに変換して状態へ保存するだけで、サーバーアップロードは行わない。
- 永続化先は従来どおり当該ブラウザの `localStorage`。
- 認証、共有DB、サーバー側画像ストレージを追加していないため、MVPのローカル完結方針を維持。

## Intentionally unimplemented (unchanged)
- 認証
- 共有データベース
- 実フォロー機能
- コメント / いいね / 通知
- 公開ディスカバリー
- サーバー側画像アップロード / 保存

## Next test checklist
- 投稿フォーム
  - ローカル画像を選択してプレビュー表示される
  - そのまま投稿できる
  - 投稿後にフォームと選択状態がクリアされる
- データ保持
  - リロード後も投稿画像（Data URL）がlocalStorage経由で表示される
  - URL入力（上級）を使った投稿も従来どおり動く
- ZINE生成表示
  - 表紙、ページ番号、終端ページが表示される
  - 投稿カード一覧と視覚的に区別される
  - モバイル/デスクトップでレイアウト破綻がない
- プレースホルダー
  - 3,4セクションが `未実装` 表記のまま
- 開発検証
  - `npm run typecheck`
  - `npm run build`
  - ローカルHTTP 200確認
