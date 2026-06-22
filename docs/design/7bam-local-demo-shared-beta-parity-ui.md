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
AppPanel: "today" | "profile" | "groups" | "feed"

Horizontal:
  Profile ← Today → Groups

Vertical（独立フルスクリーンパネル）:
  Today（黄色・縦スクロールなし）
  ↑ 上スワイプ / ↓ みんなの今日 ボタン
  Feed（100dvh・内部スクロール）
  ↓ 先頭で下スワイプ / ↑ 今日のテーマへ戻る
  Today

Feed パネル下部:
  未実装機能（折りたたみ: 安全注意）
  ZINE（開発用）（折りたたみ）
  フィードバック（LocalDemoFeedbackNote）

Today パネルの操作:
├─ 左スワイプ / アバタータップ → Profile
├─ 右スワイプ / グループ名タップ → Groups
├─ 上スワイプ / ↓ みんなの今日 → Feed パネルへ切替
├─ カメラボタン → 写真 source 選択（bottom sheet）
└─ Photo Composer（preview + caption）

Profile: 右スワイプ / 戻るボタン → Today
Groups: 左スワイプ / 戻るボタン → Today
Feed: scrollTop === 0 のとき下スワイプ / 戻るボタン → Today
```

ZINE 製本・プルーフ確認は Feed パネル内の `ZINE（開発用）` 折りたたみにあります。リセットとサンプル投入は Feed 上部のコンパクトバーにあります。

## パネルナビゲーション（local demo）

### 水平スワイプ

| パネル | 左 | 右 |
| --- | --- | --- |
| Today | プロフィール | グループ |
| Profile | （無視） | Today へ戻る |
| Groups | Today へ戻る | （無視） |

### 垂直スワイプ

| パネル | 上 | 下 |
| --- | --- | --- |
| Today | Feed へ | （無視） |
| Feed | （無視） | Today へ（`scrollTop === 0` のみ） |

- 最小移動距離: 72px
- 水平は `absX > absY * 1.25`、垂直は `absY > absX * 1.25`
- 画面左右 28px 以内から始まった水平スワイプは無視
- `button` / `textarea` / `dialog` 上から始まった操作は無視
- Composer / source sheet 表示中、切り替えアニメ中は無効
- 専用ライブラリは使わず pointer events のみ
- `touch-action: none` や global `preventDefault` は使わない

### タップ導線（Today）

- アバター → プロフィール（`aria-label`: プロフィールを開く）
- グループ名・メンバー → グループ（`aria-label`: グループを開く）
- `↓ みんなの今日` のみ（`aria-label`: みんなの今日を見る）→ Feed パネルへ切替
- カメラ → 既存の source sheet（変更なし）

Today には外側の白い 7bam / リセット ヘッダーはありません。

### 初回ヒント

- 文言: `左：プロフィール / 右：グループ / 上スワイプ：みんなの今日`
- 閉じると `localStorage` キー `7bam.local-demo.gesture-guide-dismissed` に記録

### Profile / Groups の local 制限

- 編集・設定・グループ作成・招待は `この機能はlocal demoでは利用できません。`
- デモ用参加グループのタップは `グループ切り替えは、このlocal demoでは利用できません。`
- フォロー数は `LOCAL_DEMO_PROFILE_STATS` 固定値（UI のみ）
- 参加グループ一覧は `LOCAL_DEMO_JOINED_GROUPS` 固定値（UI のみ）

### アニメーションとアクセシビリティ

- 水平パネル切替: 250–300ms（プロフィールは左から、グループは右から）
- Feed 切替: 下からフェードイン
- 各パネルは `height: 100dvh` + safe-area insets
- `html, body` は `overflow: hidden`（アプリシェル型）
- `prefers-reduced-motion` 時はアニメーションなし
- 非表示パネルは `hidden` + `inert` + `aria-hidden`
- パネル遷移は `aria-live` で読み上げ

### PWA（Vercel Preview / スマホ standalone 確認用）

- `apps/web/public/manifest.webmanifest` — `display: standalone`、テーマ色 `#ffe500`
- `apple-touch-icon.svg` — 黄色背景の 7bam アイコン
- `layout.tsx` — `viewport-fit=cover`、`appleWebApp.capable`、`themeColor`
- 秘密情報・shared mode は不要。local demo のみ

### スマホ確認

開発サーバーを LAN 公開する例:

```powershell
cd C:\dev\mewri\ph-cursor\apps\web
npm.cmd run dev -- --hostname 0.0.0.0
```

同一 Wi‑Fi のスマホブラウザで `http://<PCのIP>:3000` を開いて操作を確認します。

ホーム画面に追加すると standalone 表示で確認できます。

## Today 画面

- ブランド: `7bam`
- グループ名とメンバーアイコン
- `今日のテーマ` を主役表示
- 残り時間
- 円形カメラボタン → source 選択
- `↓ みんなの今日` のみ（重複ボタンなし）
- `LOCAL DEMO / この端末内だけに保存されます`
- 縦スクロールなし（フルスクリーン固定）

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

- 独立フルスクリーンパネル（`feedPanel`、内部 `overflow-y: auto`）
- 上部: コンパクト 7bam + リセット（+ サンプル投入）
- 縦1列の投稿一覧
- いいね・コメント数などは表示しない
- 空状態と `↑ 今日のテーマへ戻る` ボタン（Today パネルへ切替）
- 下部: 未実装機能 / ZINE 開発用 / 感想メモ

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
- パネル間はボタンとスワイプで移動（連続縦スクロールモデルではない）

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
| `TodayFeed` / `FeedPanelTopBar` | Feed パネル専用 |
| `ProfilePanel` / `GroupsPanel` | fixture 値 + local state の UI のみ |
| `GestureGuide` | `localStorage` で初回のみ |
| `PhotoSourceSheet` | hidden file inputs を page が制御 |
| `PhotoComposer` | `optimizeLocalImage` + `submitPost` |

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
- フルスクリーンパネル型のモバイル操作感
- local demo 境界コピー

## local demo では判断できないこと

- 実際のカメラ起動挙動（端末・browser 依存）
- shared beta の upload broker / RLS / auth
- 複数端末間の同期
- 本番パフォーマンス

## 関連ファイル

- `apps/web/src/app/page.tsx` — orchestration
- `apps/web/src/app/seven-bam-ui.tsx` — presentational UI
- `apps/web/src/app/local-demo-ui.ts` — copy / validation helpers
- `apps/web/src/app/styles.css` — 7bam tokens + app shell
- `apps/web/public/manifest.webmanifest` — PWA manifest
- `apps/web/src/app/layout.tsx` — viewport / PWA metadata
