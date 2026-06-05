# Mewri Obsidian Memory Vault Setup

更新日: 2026-06-05

## 目的

Obsidian は Mewri 開発用 memory を人間が読み、整理し、編集しやすくする
ローカル Markdown UI として使う。

Obsidian は Mewri アプリ本体ではない。Supabase、Storage、auth、deploy、
production には接続しない。

## 採用方針

```text
repo memory/       canonical source for agent-readable memory
Obsidian vault     human editing / reading UI
Mem0               optional future search index, not introduced yet
```

最初は Obsidian vault だけを作る。Mem0、vector store、同期サーバー、外部 API
連携はまだ入れない。

## ローカル配置

```text
C:\dev\mewri\memory-vault
```

この vault は OneDrive の外に置く。同期による重さ、誤削除、秘密情報の混入を
避けるためである。

## 開き方

1. Obsidian を起動する。
2. `Open folder as vault` を選ぶ。
3. `C:\dev\mewri\memory-vault` を選ぶ。
4. `mewri/00-start-here.md` を開く。

Obsidian Sync や外部同期は使わない。必要になるまではローカルだけで運用する。

## 絶対に置かないもの

- `.env` files
- service role keys
- DB passwords
- JWT secrets
- access tokens / refresh tokens
- magic link URLs
- production data
- private beta participant data
- real user personal information

もし秘密情報を貼ってしまった場合は、Obsidian から消すだけでなく、Git 管理下に
入っていないか、スクリーンショットや共有先に残っていないかも確認する。

## 編集ルール

- durable な正本は repo の `memory/` に置く。
- Obsidian vault は読みやすくするための UI と作業メモ置き場として使う。
- shared-beta / security に関わる memory は、古い情報をそのまま信じない。
  必ず `docs/mewri_chatgpt_handoff_current.md` と関連 source-of-truth を確認する。
- archived note は Codex / Cursor / ChatGPT に注入しない。

## 初期 vault の内容

```text
memory-vault/
  README.md
  mewri/
    00-start-here.md
    obsidian-rules.md
    memory-pack-sync.md
    chatgpt-fallback-command-center.md
    archived/
  .obsidian/
    app.json
```

## 次の段階

1. repo に `memory/` pack を追加する。
2. `memory/` を canonical として Obsidian から参照・編集する。
3. 必要になったら `tools/select-memory.mjs` を追加する。
4. さらに必要になった場合だけ Mem0 を optional index として検討する。

## 現時点でやらないこと

- Obsidian plugin の追加
- Obsidian Sync
- Mem0
- 外部 vector DB
- app runtime から Obsidian を読むこと
- Git hook による自動同期
- secrets を扱う note
