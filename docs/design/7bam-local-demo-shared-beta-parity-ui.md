# 7bam Local Demo — Shared Beta Parity UI

## 目的

`7bam`（セブンバム）の browser-local demo UI を、将来の C-9 shared beta staging UI に近い投稿体験へ寄せるためのプロトタイプです。

これは shared beta の実装ではありません。あくまでこの端末のブラウザ内だけで動く local demo です。

## local demo と shared beta の違い

| 項目 | local demo（今回） | shared beta（将来） |
| --- | --- | --- |
| 保存先 | ブラウザ内 `localStorage` | Supabase + 非公開 Storage |
| 認証 | なし | 招待制ログイン |
| 投稿の共有 | この端末内だけ | グループメンバー間 |
| 画像アップロード | Data URL 最適化後に local 保存 | サーバー検証 + broker upload |
| API | 呼ばない | `/api/shared-beta/posts` など |

## 画面フロー

```text
Today
├─ 写真source選択（bottom sheet）
├─ Photo Composer（preview + caption）
└─ みんなの今日（縦1列フィード）
```

ZINE 製本・プルーフ確認は `ZINE（開発用）` の折りたたみ内に残しています。

## Today 画面

- ブランド: `7bam`
- グループ名とメンバーアイコン
- `今日のテーマ` を主役表示
- 残り時間
- 円形カメラボタン → source 選択
- `みんなの今日` への明示的導線
- `LOCAL DEMO / この端末内だけに保存されます`

## 写真 source 選択

bottom sheet で次を表示します。

- カメラで撮影（`accept="image/*"` + `capture="environment"`）
- ライブラリから選ぶ（`accept="image/*"`、capture なし）
- キャンセル

1枚のみ。`multiple` は付けません。

## Composer

- `LOCAL DEMO` 表示
- 今日のテーマ
- 選択写真 preview
- caption（任意・最大80文字）
- `今日を追加する`
- 撮り直す / 選び直す
- キャンセル
- 端末内保存の説明

## Feed（みんなの今日）

- 縦1列
- 写真・ユーザー名・アイコン・短い caption
- いいね・コメント数などは表示しない
- 空状態と `今日のテーマへ戻る` ボタン

## エラー状態

- 非対応 MIME: `この形式の写真は使えません。別の写真を選んでください。`
- サイズ超過: `写真が大きすぎます。別の写真を選んでください。`
- 読み込み失敗: `写真を読み込めませんでした。別の写真を選んでください。`
- カメラ失敗: `カメラを開けませんでした。ライブラリから写真を選べます。`

## Accessibility

- 44×44px 以上のタップ領域
- source sheet は `role="dialog"` + focus trap + Escape
- 投稿結果は `aria-live`
- reduced motion 対応
- Feed / Today 間はボタンで移動

## Mobile 確認

確認幅の目安: 320 / 375 / 390 / 430 px

- `100dvh`
- safe area
- 長いテーマ
- software keyboard 時の caption 入力
- portrait / landscape 画像

desktop では中央カラム（最大 560px 前後）に収めます。

## Presentational UI と local adapter の境界

| Presentational | Local adapter |
| --- | --- |
| `TodayScreen` | `page.tsx` が state / service を保持 |
| `PhotoSourceSheet` | hidden file inputs を page が制御 |
| `PhotoComposer` | `optimizeLocalImage` + `submitPost` |
| `TodayFeed` | active theme の posts を整形 |

## 将来の staging adapter との境界

今回は staging adapter を実装しません。将来 shared beta へ接続する際の送信候補:

- `image`
- `caption`
- `groupId`
- `themeId`

送信禁止（trusted input として扱わない）:

- `validatedImagePath`
- `imageUrl`
- Storage object path
- service-role key
- Supabase secret

## local demo で判断できること

- 今日のテーマ中心の画面優先順位
- source 選択 → preview → caption → 投稿の流れ
- Feed の縦1列表示
- local demo 境界コピー
- mobile 操作感

## local demo では判断できないこと

- 実際のカメラ起動挙動（端末・browser 依存）
- shared beta の upload broker / RLS / auth
- 複数端末間の同期
- 本番パフォーマンス

## 関連ファイル

- `apps/web/src/app/page.tsx` — orchestration
- `apps/web/src/app/seven-bam-ui.tsx` — presentational UI
- `apps/web/src/app/local-demo-ui.ts` — copy / validation helpers
- `apps/web/src/app/styles.css` — 7bam tokens
