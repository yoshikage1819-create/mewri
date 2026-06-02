# Mewri v0.10 — Staging RPC Migration Owner Approval Checklist

更新日: 2026-05-29

状態: **承認待ち — migration は未適用**

対象 SQL（このファイルだけを staging に追加適用する）:

```text
supabase/migrations/202605290001_shared_beta_create_post_rpc.sql
```

前提:

- Foundation migration `202605260001_closed_shared_beta_foundation.sql` は **mewri-staging** に既に適用済みであること。
- 2026-05-28 の refusal verification が完了していること（`docs/mewri_supabase_staging_refusal_verification_plan_v0_10.md`）。
- **production** には触らない。
- **shared mode**（`MEWRI_RUNTIME_MODE=shared_beta`）は有効化しない。
- **deploy** はこの承認スライスでは行わない。

---

## この migration が行うこと（非技術向け要約）

招待済みメンバーが、**サーバー側の一つの入口**からだけ投稿を作成できるようにする下書きです。

- ログイン本人かどうか、グループ所属、有効なテーマ、画像パスの形式、Storage に実在する画像があるかを DB 内で確認してから、投稿とイベントを **まとめて** 1 回で記録します。
- ブラウザからテーブルへ直接 `INSERT` する経路は **開きません**（foundation と同じ拒否のまま）。

---

## Part A — 適用前: オーナー承認チェックリスト

オペレーターが技術確認を済ませたうえで、オーナーが **すべてにチェック** してから「適用してよい」と明示する。

| # | 確認項目 | オーナー ☐ | メモ |
| --- | --- | --- | --- |
| A1 | Supabase dashboard で接続先が **mewri-staging** である（production 名・production ref ではない） | | |
| A2 | 適用するファイルが **1 本だけ** で、パスが `supabase/migrations/202605290001_shared_beta_create_post_rpc.sql` である | | |
| A3 | 適用対象に foundation 以外の別 migration や手編集 SQL が混ざっていない | | |
| A4 | チャット、docs、スクリーンショット、`.env` に **service_role key** を貼っていない（貼った場合はローテーション手順へ） | | |
| A5 | チャット・docs に **database password、JWT secret、access token、refresh token** を貼っていない | | |
| A6 | Vercel / ローカル app に **`MEWRI_RUNTIME_MODE=shared_beta` を設定していない**（shared mode は off のまま） | | |
| A7 | この作業で **production** project、production URL、production Vercel env に触らない | | |
| A8 | この作業で **deploy** しない（migration 適用と検証のみ） | | |
| A9 | 下記 **Part B の execute 付与方針** を読み、採用する案を決めた（推奨: 案 1） | | |
| A10 | 適用後は Part C の検証を、staging 用テストユーザーだけで行う（本番ユーザー・本番メールと混ぜない） | | |

**オーナー承認文（例）**

> 上記 A1–A10 を確認した。mewri-staging に `202605290001_shared_beta_create_post_rpc.sql` のみを適用し、Part C を実行してよい。shared mode は有効化しない。production には触らない。

承認日: __________　承認者: __________

---

## Part B — execute 付与方針（技術判断 → オーナー決定）

### 現状の草案（案 1 採用済み）

| 関数 | 役割 | 草案の grant |
| --- | --- | --- |
| `private.create_shared_beta_post` | 実処理（`security definer`） | `authenticated` に **EXECUTE なし** |
| `public.create_shared_beta_post` | 公開 RPC 入口（`security definer`） | `authenticated` に **EXECUTE** |

`anon` / `public` ロールへの grant は **revoke 済み**（草案どおり）。

### foundation との違い

Foundation では `private.is_group_member` などに `authenticated` へ EXECUTE がありますが、それは **RLS ポリシー内** から呼ぶためです。

今回の `private.create_shared_beta_post` は RLS からは呼ばず、**アプリが呼ぶ RPC 用** です。Supabase の通常の `.rpc()` は **public** スキーマの関数だけを公開します。

### 採用方針（案 1 — 現在の migration 草案に反映済み）

| 決定 | 内容 |
| --- | --- |
| **採用済み** | **`authenticated` には `public.create_shared_beta_post` の EXECUTE のみ** 付与する |
| **維持すること** | `grant execute on function private.create_shared_beta_post ... to authenticated` の行を追加しない |
| **併せて維持** | `public.create_shared_beta_post` は **`security definer`** とし、`set search_path = ''` を維持する（ラッパが owner 権限で private を呼び、呼び出し元に private EXECUTE を要求しない） |

**理由（オーナー向け）**: 利用者が使う入口を **public の 1 本** にそろえ、private 関数をログイン済みユーザーが SQL から直接叩ける余地を減らす。アプリコードは既に `rpc("create_shared_beta_post", ...)` のみを想定している。

### 非採用（案 2 — private 入口も authenticated に開く）

| 決定 | 内容 |
| --- | --- |
| 現時点では非採用 | 両方に `authenticated` EXECUTE を付与しても、private 内の検証は同じで、**.rpc() から private は通常呼べない** |
| リスク | 認証済みセッションで SQL を直接叩くと private 入口も使える（ラッパと同等の検証だが **入口が 2 つ**） |
| 運用 | 本番前の shared mode 有効化前には案 1 が必須。現在の草案はすでに案 1 で固定する |

**オーナー記入**

- 採用案: ☑ 案 1（public RPC 入口のみ）　☐ 案 2（非採用）

---

## Part C — 適用後検証（技術オペレーター実施、オーナーは結果の Pass/Fail のみ確認）

**実施環境**: mewri-staging のみ。検証用 JWT は evidence 用に保管し、チャットや本 repo には貼らない。

### C1. 構造・grant

| # | チェック | 期待結果 | Pass ☐ |
| --- | --- | --- | --- |
| C1.1 | `public.create_shared_beta_post` が存在する | 1 行 | |
| C1.2 | `private.create_shared_beta_post` が存在する | 1 行 | |
| C1.3 | `anon` に両関数の EXECUTE がない | 0 grant | |
| C1.4 | `authenticated` に **`public.create_shared_beta_post` の EXECUTE がある** | あり | |
| C1.5 | 案 1 採用時: `authenticated` に **`private.create_shared_beta_post` の EXECUTE がない** | なし | |
| C1.6 | 案 2 採用時: private にも authenticated EXECUTE がある | あり（意図どおり） | |
| C1.7 | `posts` の policy | **SELECT のみ**（INSERT policy なし） | |
| C1.8 | `storage.objects` の policy | **SELECT のみ**（INSERT policy なし） | |

### C2. anon — 実行拒否

| # | 操作 | 期待結果 | Pass ☐ |
| --- | --- | --- | --- |
| C2.1 | 未ログインで `rpc('create_shared_beta_post', ...)` | エラー（認証なし） | |

### C3. authenticated member — 成功（正例）

前提: staging の member-a が `group_staging_a` の active theme に所属し、Storage に  
`post-images/group_staging_a/<member_a_uuid>/test-rpc.webp` 相当のオブジェクトが **service_role または管理者 seed のみ** で存在すること（オーナーは seed 作業を承認するだけで、鍵は貼らない）。

| # | 操作 | 期待結果 | Pass ☐ |
| --- | --- | --- | --- |
| C3.1 | member-a が RPC を正しい `p_user_id` / group / theme / image_path で呼ぶ | 成功、**posts 1 件 + event_logs 1 件**（`post_created`） | |
| C3.2 | 返却行の `user_id` / `group_id` / `theme_id` / `image_url` が入力と一致 | 一致 | |

### C4. 拒否（負例）

| # | シナリオ | 期待結果 | Pass ☐ |
| --- | --- | --- | --- |
| C4.1 | **identity mismatch** — `p_user_id` を他人 UUID にする | 拒否（`identity_mismatch` 等） | |
| C4.2 | **non-member** — 所属していない group の theme | 拒否（`group_membership_required` 等） | |
| C4.3 | **inactive theme** — closed / 非 active theme | 拒否（`active_group_theme_required` 等） | |
| C4.4 | **wrong-group theme** — 自 group と theme の group が不一致 | 拒否 | |
| C4.5 | **forged path** — パス形式不正、他人 UUID フォルダ、バケット名不一致 | 拒否（`private_image_path_required` 等） | |
| C4.6 | **missing storage object** — 形式は正しいが Storage に無い | 拒否（`storage_object_not_found` 等） | |

### C5. 直接クライアント書き込みは引き続き拒否（回帰）

foundation で確認済みの境界が **壊れていない** こと。

| # | 操作 | 期待結果 | Pass ☐ |
| --- | --- | --- | --- |
| C5.1 | member-a が `supabase.from('posts').insert(...)` | **拒否**（policy / grant なし） | |
| C5.2 | member-a が `storage.from('post-images').upload(...)` | **拒否**（insert policy なし） | |

### C6. 適用後も変わらない運用境界

| # | 確認 | 期待 | Pass ☐ |
| --- | --- | --- | --- |
| C6.1 | `MEWRI_RUNTIME_MODE=shared_beta` | **未設定** | |
| C6.2 | production project | **未操作** | |
| C6.3 | 公開デモ（mewri-b）の挙動 | 引き続き **local demo**（この migration だけでは共有 β は開始しない） | |

---

## Part D — 証跡（秘密を含めない）

次を staging 用チケットまたは日付フォルダに保存する（**repo に secret を commit しない**）。

- Staging project 名 / ref のスクリーンショット
- 適用した migration ファイル名とタイムスタンプ
- C1–C6 の Pass/Fail 一覧
- 失敗時はエラーコード名のみ（トークン全文は不可）

**保存してはいけないもの**: service_role key、DB password、JWT secret、access/refresh token、magic link、OTP、参加者の本番メール

---

## Part E — ロールバック

| 状況 | 手順 |
| --- | --- |
| RPC 適用後に C4/C5 が失敗 | **shared mode は有効化しない**。app を staging に接続しない。関数を drop する follow-up migration または staging DB リセットを検討 |
| 案 1 修正前に草案のまま適用して問題 | 案 1 の grant 修正を **次の migration** で適用し、C1/C2 を再実行 |

---

## 適用コマンド（オーナー承認後のみ — この文書を読んだエージェントは自動実行しない）

オペレーターが手動で実行する。チャットに project ref や鍵を貼らない。

```powershell
# 1. staging に link 済みであることを確認
supabase link --project-ref <staging-project-ref>

# 2. 対象 migration のみ適用（foundation は再適用しない）
supabase db push
# または SQL Editor で 202605290001 の内容のみ実行（運用方針に合わせる）
```

**このチェックリスト作成時点では、上記コマンドは実行していない。**

---

## 次のゲート（この checklist Pass 後）

1. 実 Supabase adapter・実認証・server-side upload を **staging env 承認後** に接続
2. `POST /api/shared-beta/posts` の統合検証（shared mode はまだ off のまま可能な範囲で）
3. 招待ユーザー間の ZINE 共有確認後に closed beta 開始を検討

Pass した RPC migration だけでは **closed beta 開始不可**。
