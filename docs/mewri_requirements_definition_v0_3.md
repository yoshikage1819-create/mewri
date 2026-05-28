# Mewri Requirements Definition v0.3

作成日: 2026-05-20

復旧日: 2026-05-26

この文書は、文字化けしていた初期要件文書を、現行のドメインモデルと後続の MVP 判断資料に整合する範囲で復旧したものである。既存の製品判断は変更しない。

## 1. 目的

Mewri の MVP は、一般的な写真フィードを作ることではなく、次の体験を検証するためのものである。

```text
今日の Theme を見る
-> 写真を軽く投稿する
-> Group の投稿が ZineCycle に蓄積する
-> ZINE として生成された完成物を読む
```

## 2. 製品原則

```text
投稿は軽い
ZINE は深い
Theme は日々の投稿の入口
ZINE は複数日の投稿を束ねた完成物
AI は補助
意味は人間の参加から生まれる
Group から始める
```

Follow、公開 Discovery、コメント、ランキングなどの一般 SNS 機能は、主ループの価値確認より先に導入しない。

## 3. 初期利用単位

初期検証では、小人数の Group を利用単位とする。各 Group は一つ以上の ZineCycle を持ち、Cycle 内に日次 Theme と Post が集まる。

初期の検証対象は次の流れである。

```text
小人数 Group
-> 日次 Theme
-> Group メンバーの Post
-> ZineCycle 完了
-> ZINE 生成と閲覧
```

## 4. ドメインモデル

MVP から共有ベータまで維持する主要モデルは次の通りである。

| モデル | 役割 |
| --- | --- |
| `User` | 利用者プロフィール |
| `Group` | ZINE を共作する単位 |
| `GroupMember` | User と Group の所属・役割 |
| `Theme` | ある日に投稿する対象 |
| `Post` | Theme に対する写真投稿 |
| `ZineCycle` | 投稿を束ねる制作期間 |
| `Zine` | Cycle から生成される完成物 |
| `ZinePage` | ZINE 内の投稿配置 |
| `EventLog` | 最低限の行動記録 |

### 主な関係

```text
Group 1 --- * GroupMember * --- 1 User
Group 1 --- * ZineCycle
ZineCycle 1 --- * Theme
Theme 1 --- * Post
ZineCycle 1 --- 0..1 Zine
Zine 1 --- * ZinePage
Post 1 --- 0..* ZinePage
```

## 5. Theme と Post

Theme は日ごとの投稿のきっかけであり、`scheduled`、`active`、`closed` の状態を持つ。MVP では active な今日の Theme にのみ投稿でき、closed な Theme は閲覧対象とする。

Post は `User`、`Group`、`Theme` に属する写真投稿である。caption は任意とする。共有データベースに移行する場合、投稿画像そのものはファイルストレージに保存し、Post は参照先を保持する。

## 6. ZineCycle と ZINE

ZineCycle は複数日の Theme と Post を束ねる制作期間である。初期検証では完成までのフィードバックが早い短い Cycle を許容する。

ZINE は ZineCycle の投稿から生成される完成物であり、Feed の代替ではない。ZinePage は表紙や本文のページ順・配置を表す。

Cycle の状態は次を想定する。

```text
scheduled
active
closed
generating
ready_for_review
published
archived
```

ZINE の状態は次を想定する。

```text
draft
review
published
archived
```

## 7. EventLog

初期から取得し得る最低限のイベントは次の通りである。

```text
theme_viewed
post_created
zine_cycle_viewed
zine_generated
zine_published
zine_viewed
app_opened
```

共有ベータでイベントを保存する場合も、Group の閲覧権限と個人情報の扱いを優先し、公開ログにしない。

## 8. アーキテクチャ要件

```text
apps/web       UI と Web 実行環境
packages/core  ドメインモデルと純粋なロジック
packages/data  永続化境界とサービス境界
docs           製品判断と実装方針
```

- UI コンポーネントから保存先へ直接依存しない。
- ローカルデモでは `localStorage` 実装を利用できる。
- 共有永続化を導入するときは `packages/data` の repository/service 境界を通す。
- 認証、所属確認、画像保存、共有書き込みの認可は後付けの装飾ではなく共有モードの前提とする。

## 9. MVP と次段階の範囲

ローカル MVP が成立させるもの:

```text
今日の active Theme への投稿
投稿一覧の閲覧
ZINE の生成と閲覧
ブラウザローカル保存
モバイル中心の主要導線
```

共有ベータで初めて検証できるもの:

```text
招待された複数人が同じ Group / active ZINE データを見ること
メンバーの投稿が同じ ZINE に蓄積すること
Group 外の利用者がコンテンツへアクセスできないこと
```

当面の対象外:

```text
公開 Discovery
Follow
コメント
DM
ランキング
通知の拡張
host-created themes
個人受け取りテーマ
複数 ZINE への同時投稿
印刷や課金
```

## 10. セキュリティ要件

共有データを扱う段階では次を必須とする。

- 認証済みの招待ユーザーだけが Group に参加できる。
- Group の Theme、Post、ZINE、画像はメンバーだけが閲覧できる。
- 匿名の書き込みは許可しない。
- 投稿者 ID は認証済みユーザーから決定し、クライアント入力を信用しない。
- 画像は共有 DB の Data URL として保持しない。
- 管理キーをブラウザへ配布しない。

## 11. 判定基準

Mewri らしさを保っているかは、次で判定する。

```text
投稿の入口が軽いか
参加者の写真が同じ ZINE の素材になるか
生成された ZINE が投稿の報酬として読めるか
Group 内の共同制作を強めているか
一般 SNS 機能が主ループを覆っていないか
```
