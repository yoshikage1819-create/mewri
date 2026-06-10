# Mewri C-8e 非技術者向けライブ確認前ガイド

Updated: 2026-06-10

Status: docs-only pre-flight guide. この文書だけではライブ確認を実行しない。
実際の Supabase 接続、秘密情報の入力、`.env` 作成、migration、deploy、
shared mode 有効化、production 操作、beta user 連絡は行わない。

## 目的

C-8e は、将来 `mewri-staging` で画像アップロード broker を実際に確認する
危険度の高い作業である。

このガイドの目的は、オーナーが実行前に画面上で安全確認を行い、production、
秘密情報、deploy、migration、shared mode 有効化に誤って進まないようにすること。

このガイドを読んでも、まだライブ確認は始めない。

## 最初に開く画面

最初に開く画面は Supabase Dashboard のプロジェクト一覧。

1. ブラウザで Supabase Dashboard を開く。
2. プロジェクト一覧だけを見る。
3. `mewri-staging` という名前のプロジェクトを探す。
4. `mewri-staging` 以外のプロジェクトを開かない。
5. production らしい名前、見覚えのない名前、本番 URL が見える画面なら止まる。

ここでは SQL Editor、Storage、Edge Functions、Settings、API Keys にはまだ入らない。

## staging であることの確認

次のすべてが確認できるまで、C-8e ライブ確認に進まない。

- 画面上のプロジェクト名が `mewri-staging` である。
- production という名前、production URL、本番ドメインが表示されていない。
- 自分が今見ている画面を「staging」と説明できる。
- 迷いがある場合は、何もクリックせずに止まる。

安全に記録してよい証拠:

```text
Supabase project name checked: mewri-staging
Production project opened: no
Date/time:
Checked by:
```

スクリーンショットは原則不要。撮る場合も、URL、キー、トークン、メール、
参加者情報、private data が写るなら撮らない。

## 絶対に貼らないもの

次の値は Codex、Cursor、ChatGPT、GitHub、docs、スクリーンショット、
チャット、Issue、PR、Notion に貼らない。

- service-role key
- database password
- JWT secret
- anon key / publishable key の実値
- access token
- refresh token
- magic link URL
- `.env` file
- production URL
- production data
- private participant data
- Supabase API key 画面のスクリーンショット
- Vercel / hosting の Environment Variables 画面のスクリーンショット

AI に見せてよいのは、値そのものではなく「名前」だけ。

例:

```text
OK: SUPABASE_URL is configured in staging.
NG: SUPABASE_URL=https://...
OK: SUPABASE_SERVICE_ROLE_KEY exists in the secret store.
NG: SUPABASE_SERVICE_ROLE_KEY=...
```

## 止まる場所

次のどれかが出たら、その場で止まる。

- `production` と読める画面を開いた。
- `mewri-staging` かどうか確信がない。
- SQL Editor で `Run` / `Apply` / `Execute` を押しそうになった。
- Migration を適用する画面になった。
- Deploy / Redeploy / Promote / Production を押す画面になった。
- `MEWRI_RUNTIME_MODE=shared_beta` を設定する必要が出た。
- `.env` に値を書く必要が出た。
- AI に secret を貼る必要があると言われた。
- magic link、access token、service-role key、database password が見えた。
- beta user に連絡する必要が出た。
- 画面の意味がわからない。

止まった場合に記録する安全なメモ:

```text
Stopped at:
Reason:
Secret exposed: no / unclear
Production touched: no / unclear
Next safe action:
```

## ライブ確認前のオーナー承認文

ライブ確認を実行する前に、オーナーは次の文をそのまま承認する必要がある。

```text
I confirm this is the mewri-staging project, not production.
I approve a guided C-8e live staging verification using staging-only
configuration outside git.
I will not paste service-role keys, access tokens, refresh tokens, magic links,
.env files, production URLs, production data, or private participant data into
chat, docs, screenshots, or git.
I do not approve production changes, migration application, deployment, shared
mode activation in production, beta-user communication, or spending money.
Stop before any unclear credential, production screen, deploy, migration, or
secret exposure risk.
```

この承認文がない場合、Codex はライブ確認を始めない。

## 承認後に Codex が行うこと

承認後でも、Codex は秘密情報を求めない。

Codex が行うべき順番:

1. `git status --short --branch` を確認する。
2. `.env*`、secret、generated file、`.vscode/` が staged されていないことを確認する。
3. オーナーに Supabase 画面が `mewri-staging` であることを再確認してもらう。
4. production 画面を開いていないことを確認する。
5. `post-images` bucket が private であることを、値を写さずに確認してもらう。
6. migration、deploy、shared mode 有効化は行わないと再確認する。
7. 必要な staging-only config は git 外の安全な場所だけで扱う。
8. 最小の positive test を 1 回だけ行う。
9. anon、invalid token、wrong group、inactive theme、forged path、bad MIME、oversized image の negative test を行う。
10. safe evidence だけを記録する。
11. secret、token、URL の実値、private data は記録しない。
12. 終了後、route/broker gate を必要なら無効化し、shared mode は off のままにする。

Codex がしてはいけないこと:

- service-role key の入力をチャットで求める。
- `.env` ファイルに実値を書く。
- migration を作る、適用する。
- deploy する。
- production を開く、変更する。
- shared mode を本番で有効化する。
- beta user に連絡する。
- secret が写った証拠を docs や chat に残す。

## 安全に記録できる証拠

記録してよい:

- 日時
- project name が `mewri-staging` だったこと
- production を開いていないこと
- shared mode が off のままだったこと
- config 名だけ
- actor label: anon / invalid token / member A / member B
- HTTP status code
- safe error code
- pass / fail
- Storage object がある/ない、ただし object path に private data が含まれない場合のみ
- post/event が作られたかどうか
- rollback が必要かどうか

記録してはいけない:

- key values
- token values
- magic links
- `.env` contents
- private participant data
- production URL
- API key 画面のスクリーンショット
- logs containing secrets

## 証拠メモのテンプレート

```text
Date/time:
Project confirmed: mewri-staging
Production opened: no
Shared mode enabled: no
Migration applied: no
Deploy performed: no
Config names used, values omitted:
Positive test:
Negative tests:
Direct insert refusal:
Storage visibility:
Secret exposure check:
Rollback needed:
Next gate:
```

## ロールバック

問題が起きたら、次の順番で止める。

1. それ以上操作しない。
2. `MEWRI_ENABLE_STAGING_SHARED_BETA_UPLOAD_BROKER` を無効化する。
3. 必要なら `MEWRI_ENABLE_STAGING_SHARED_BETA_POST_ROUTE` も無効化する。
4. shared mode は off のままにする。
5. deploy、migration、production 操作はしない。
6. staging のテストデータ削除は、別の確認後に行う。
7. secret が漏れた疑いがある場合は、値を貼らずに「漏れた可能性がある」と記録し、rotation を次ゲートにする。

## 日本語の停止条件

次のどれかが起きたら、作業は失敗ではなく「安全停止」として扱う。

- staging か production か迷った。
- secret が見えた。
- AI に secret を貼る必要が出た。
- `.env` に実値を書く必要が出た。
- migration / deploy / production のボタンが出た。
- shared mode を有効化する必要が出た。
- beta user に連絡する必要が出た。
- テスト結果が想定と違った。
- 何をしているかわからなくなった。

安全停止したら、次の一文だけでよい。

```text
C-8e live check stopped safely. No further action taken.
```

## 現在の結論

この文書は事前チェックリストであり、ライブ確認の実行許可ではない。

次のゲートは、オーナーが承認文を明示し、Codex が `mewri-staging` だけを対象に
安全確認を進める C-8e live execution slice である。
