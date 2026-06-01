# Mewri オーナー向け: PC を軽くするローカル開発の置き場所

更新日: 2026-06-01

## 目的

開発用の大量ファイル（特に `node_modules`）が OneDrive と競合し、
PC が重くなるのを防ぎます。セキュリティを弱めず、長期的に軽い構成にします。

## 採用する方針

| 項目 | 方針 |
| --- | --- |
| ソースの正本 | Git（GitHub） |
| 日常の作業フォルダ | **OneDrive の外**（例: `C:\dev\mewri\ph-cursor`） |
| クラウド同期 | ドキュメント用。開発の巨大フォルダは載せない |
| 秘密情報 | `.env` は Git に載せない。USB や共有フォルダに置かない |
| バックアップ | Git push + 必要なら暗号化 USB（BitLocker To Go） |

## 推奨フォルダ

```text
C:\dev\mewri\ph-cursor    ← Cursor / Codex 用（このリポジトリ）
C:\dev\mewri\ph           ← Codex 用メインがある場合のみ（1本化できるなら1本でよい）
```

OneDrive 上の `ドキュメント\ph-cursor` は、移行確認後に削除して構いません
（削除前に Git で push 済みか確認してください）。

## いまのリポジトリで入れた対策

- ルートの `.onedriveignore` … `node_modules` / `.next` などを OneDrive 同期から除外
- この文書 … 移行と運用の手順

## 初回セットアップ（`C:\dev` にクローン済みの場合）

PowerShell で:

```powershell
cd C:\dev\mewri\ph-cursor
npm.cmd install
npm.cmd run typecheck
npm.cmd test
```

## Cursor でフォルダを切り替える

1. Cursor を開く
2. **File → Open Folder**
3. `C:\dev\mewri\ph-cursor` を選択

以降、OneDrive 内の古いフォルダは開かないでください。

## OneDrive 側を軽くする（移行後）

古い `ドキュメント\ph-cursor` で、次だけ削除して構いません（再生成可能）:

- `node_modules`
- `apps\web\.next`

フォルダごと不要なら、Git push 確認後に `ph-cursor` 全体を削除。

OneDrive が「クラウドから大量削除」と聞いてきた場合:

- 削除対象が **`node_modules` / `.next` だけ**なら、通常は問題ありません
- **`apps` / `packages` / `docs` が含まれる**ならキャンセルしてください

## なぜ Cursor の自動実行が止まって見えるか

| 原因 | 説明 |
| --- | --- |
| **時間制限** | フォルダ全体のコピー（`robocopy`）や `npm install` は 5 分以上かかることがあり、エージェント側で中断される |
| **OneDrive** | OneDrive 上のフォルダを丸ごとコピーすると、同期が絡み極端に遅くなる |
| **UI 操作** | 作業フォルダの切り替えは Cursor の「フォルダを開く」が確実 |

**対策:** 巨大フォルダの丸ごとコピーは使わない。Git で同じコミットを揃え、`C:\dev` だけで `npm install` する。

### 再開用スクリプト（推奨）

リポジトリルートで:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\resume-local-dev-migration.ps1
```

## 採用しないこと（セキュリティ低下）

- ウイルス対策の恒久的な除外
- `.env` や API 鍵を USB・公開共有に置く
- `service_role` などをローカル以外に広げる

## Codex / Cursor の役割分担（変更なし）

- Codex: `ph`（メイン）でセキュリティ敏感な実装
- Cursor: `ph-cursor` で低リスク UI / ドキュメント
- 作業フォルダのパスだけ `C:\dev\...` に変わる
