# Mewri Storage RLS Local Read Check Instructions

更新日: 2026-05-28

この手順は、Supabase staging の `post-images` Storage RLS を、実際の member-a / member-b ログインで確認するためのローカル専用チェックです。

この checker はファイル本体の download ではなく、Storage の list API で object metadata が見えるかを確認します。staging 検証用 object が `storage.objects` に metadata-only row として入っていて、物理ファイル本体がない場合でも確認できます。

2026-05-28 の `mewri-staging` 検証では、この metadata visibility checker により次を確認済みです。

- anon は group_staging_a / group_staging_b のどちらの object metadata も見えない。
- member-a は group_staging_a の object metadata だけ見える。
- member-b は group_staging_b の object metadata だけ見える。
- service_role key は使っていない。
- shared mode は有効化していない。

この手順では次を行いません。

- service_role key の使用
- shared mode の有効化
- production project の変更
- Storage upload
- Storage delete
- Storage download
- policy 変更
- deploy

## 貼ってよい値

Supabase dashboard の staging project から、次だけをコピーします。

1. Project URL
2. public anon key
3. `post-images` bucket 内の group_staging_a 側 object path
4. `post-images` bucket 内の group_staging_b 側 object path

public anon key は、ブラウザアプリで使うための公開 key です。RLS を回避できません。

## 絶対に貼らない値

次はこの画面、チャット、docs、`.env` に貼りません。

- service_role key
- access token
- refresh token
- magic link URL
- OTP code
- staging test user password
- 本番 project の key

特に `service_role` と書かれた key は、RLS を回避できる管理用 key です。今回の確認には不要です。

## 起動方法

PowerShell で repo root を開き、次を実行します。

```powershell
node tools/serve-storage-rls-check.mjs
```

表示された URL をブラウザで開きます。

```text
http://127.0.0.1:4173/
```

この page は local-only です。deploy しません。

## 画面に入力するもの

Supabase dashboard で staging project を開きます。production project ではないことを先に確認してください。

Settings -> API で確認するもの:

- Project URL: `https://...supabase.co`
- Project API keys の `anon` / `public` key

ここで `service_role` key は見ない、コピーしない、貼らないでください。

Storage -> `post-images` で確認するもの:

- group_staging_a 側の object path
- group_staging_b 側の object path

例:

```text
group_staging_a/<member-a-uuid>/alpha.webp
group_staging_b/<member-b-uuid>/beta.webp
```

Supabase Storage API の object path は bucket 名を含めません。画面の bucket は `post-images` のままにし、path 欄は `group_staging_a/...` のように group から始めます。

この path は Storage の metadata visibility 確認に使います。ファイル本体を download するためのものではありません。

## 確認手順

1. staging Project URL、public anon key、bucket、2つの object path を入力します。
2. 「このブラウザだけに設定」を押します。
3. まだログインしない状態で「anon check」を押します。
4. `anon cannot see group_staging_a object` が OK であることを確認します。
5. `anon cannot see group_staging_b object` が OK であることを確認します。
6. member-a の staging email と staging password を入力します。
7. 「password でログイン」を押します。
8. ログイン状態が member-a になったことを確認します。
9. 「member-a check」を押します。
10. 次が OK であることを確認します。

```text
member-a can see group_staging_a object
member-a cannot see group_staging_b object
```

11. 「Sign out」を押します。
12. member-b の staging email と staging password で同じようにログインします。
13. 「member-b check」を押します。
14. 次が OK であることを確認します。

```text
member-b can see group_staging_b object
member-b cannot see group_staging_a object
```

## 結果の判断

成功:

```text
anon check: 2つとも OK
member-a check: 2つとも OK
member-b check: 2つとも OK
```

止めるべき結果:

- anon がどちらかの metadata を見える
- member-a が group_staging_b の metadata を見える
- member-b が group_staging_a の metadata を見える
- member-a が group_staging_a の metadata を見えない
- member-b が group_staging_b の metadata を見えない

見えてはいけない object metadata が見えた場合は、shared mode に進まず、Storage policy / path / membership seed を見直します。

## 後片付け

確認が終わったら、ローカルサーバーを止めます。

PowerShell で `Ctrl+C` を押します。

画面の「このブラウザの設定を消す」を押すと、Project URL と public anon key をブラウザの一時保存から消せます。

## 注意

この確認で使うのは public anon key だけです。public anon key で想定通り拒否されることが、RLS 検証の目的です。

service_role key を使う確認は、この page では絶対に行いません。

password は Supabase Auth のログイン処理に渡すだけです。この repo、docs、チャット、ブラウザの sessionStorage には保存しません。ログインボタンを押した後、画面の password 欄は空になります。
