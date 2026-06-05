# Mewri AI Workbench Setup

更新日: 2026-05-28

## 目的

Codex CLI と Cline を、Mewri の主ループと共有ベータの安全境界を守りながら、
小さく検証可能な単位で開発を進める補助者として使う。

一万人規模は AI 設定だけで達成できる目標ではない。まず招待制の小さな
Group で同じ ZINE を作る価値、継続利用、安全性、運用コストを検証し、
証拠に基づき拡張する。

## 結論: 採用する AI 構成

```text
主実装・検証:
  Codex CLI (`codex.cmd`) + `$mewri-ship-beta`

エディタ内の探索・計画・補助:
  Cline VS Code extension + `mewri-ship-beta`

Cline の provider 優先順位:
  1. OpenAI Codex provider が利用可能なら、既存の対象 ChatGPT 利用枠で接続
  2. 利用できない場合、Cline Provider の `FREE` モデルを限定用途で利用
  3. 有料 API key / credits は費用を明示的に承認するまで設定しない
```

## Codex CLI のモデル選択

コード変更の主担当は Codex CLI とし、この Windows 環境では
`codex.cmd` を使用する。モデル名は利用可能なモデル一覧と契約によって
変わり得るため、利用可能な Codex 系の coding model を優先し、指定モデルが
利用できない場合は CLI の既定モデルにフォールバックする。

| 作業 | 推奨 |
| --- | --- |
| 文書整理、小さな UI 文言修正 | coding model、reasoning `low` または `medium` |
| 複数ファイルの通常実装、route/service の追加 | coding model、reasoning `medium` |
| Auth / RLS / Storage / migration / shared-data 境界 | 最も高性能な利用可能な Codex coding model、reasoning `high` |

安全性に影響するスライスでは、モデル名よりも `AGENTS.md` と
`mewri-ship-beta` Skill の遵守、拒否テスト、typecheck/test/build、
差分レビューを完了条件として優先する。

2026-05-28 時点で OpenAI の公式モデル案内は、`gpt-5.5` を複雑な推論と
コーディングで最初に選ぶ flagship model とし、`none`、`low`、`medium`、
`high`、`xhigh` の reasoning effort を案内している。また、この環境の
Codex CLI 設定にも `gpt-5.3-codex` から `gpt-5.5` への migration notice
がある。利用可能な場合、shared-data のセキュリティ境界には
`gpt-5.5` + `high` を第一候補にする。

## Cline 無料クラウドを主実装にしない判断

Cline 拡張自体は個人開発者向けに無料である。一方、公式 pricing は AI
inference を原則従量課金としており、Cline Provider の `FREE` モデルは
無料の選択肢として提供されるが、公式 Tasks 文書では learning /
experimentation 向けと位置付けられている。

Mewri の次段階には、認証、group membership、RLS、private Storage、
server-only secret、migration が含まれる。無料モデルの提供継続や品質に
この安全境界の実装を全面依存させることは合理的ではない。

| 作業 | Cline `FREE` | Codex CLI |
| --- | --- | --- |
| 要件整理、計画、画面文言、文書 | 適する | 適する |
| 小さく可逆な UI/CSS 変更 | 使用可。テスト必須 | 適する |
| テスト案、レビュー観点の列挙 | 使用可 | 最終確認に使う |
| 複数ファイルのデータ経路実装 | 主担当にしない | 主担当 |
| Auth / RLS / Storage / secrets | 分析・引継ぎのみ | 実装・レビュー担当 |
| migration 適用、deploy、本番設定 | 実行しない | 人の承認後のみ |

この判断は「Cline を使わない」という意味ではない。Cline は VS Code
サイドバーで方向を整理し、小さな作業を早く進め、危険度が上がる地点で
Codex CLI に明確な実装 brief を渡す担当として有効である。

## Cursor Pro の保留判断

Cursor Pro は現時点では導入しない。Codex CLI と Cline で安全な縦切りを
実装できており、現在の優先課題は AI の編集速度より共有ベータ境界の検証で
あるためである。

次のいずれかが継続的に起き、実装や検証の遅延要因になった場合にのみ、
Cursor Pro の 1 か月試験導入を検討する。

- Codex/Cline の token または利用上限により、計画済みスライスが頻繁に中断する。
- UI 改善期に入り、エディタ内補完不足が計測可能な待ち時間になる。
- 追加費用を許容でき、Privacy Mode と秘密情報除外を設定できる。

導入判断は「便利そうか」ではなく、中断回数、失われた作業時間、月額費用に
対する削減時間を記録して行う。導入しても Auth / RLS / Storage /
migration の最終レビュー担当は Codex CLI と人の承認から変更しない。

## ローカル LLM を採用しない理由

この PC は確認時点で Surface Laptop Go、RAM 7.6 GB、空きディスク
7.7 GB、専用 NVIDIA GPU なしである。Cline のローカルモデル文書は、
小型/量子化モデルでも RAM 16-32 GB、中規模コーディングモデルで RAM
32-64 GB を目安にしている。

したがって、現時点で Ollama/LM Studio と大型モデルを導入しても、
Mewri の開発を安定して進める構成にはならない。

## 導入済み

- 共通指示: `AGENTS.md`
- Codex Skill 管理元: `.codex/skills/mewri-ship-beta/`
- Codex Skill インストール先: `%USERPROFILE%/.codex/skills/mewri-ship-beta/`
- Codex CLI: `codex-cli 0.133.0`
- Cline VS Code extension: `saoudrizwan.claude-dev` v3.85.0
- Cline Skill: `.cline/skills/mewri-ship-beta/`
- Cline Rules: `.clinerules/`
- Cline Workflows: `.clinerules/workflows/`
- Cline context 除外: `.clineignore`
- VS Code 推奨拡張: `.vscode/extensions.json`

## 初回設定

### Codex CLI

この Windows 環境では PowerShell の実行ポリシーにより `codex` が
`codex.ps1` として止まるため、`codex.cmd` を使用する。

```powershell
codex.cmd --version
codex.cmd
```

Codex の利用可否と上限は、サインインしている ChatGPT プランに従う。
OpenAI は Codex が対象プランに含まれ、Free/Go への提供は期間限定であると
案内しているため、「常に無償で無制限」とは扱わない。

### Cline

1. VS Code でこのフォルダーを開き、Cline サイドバーを開く。
2. Settings で `OpenAI Codex` provider が選べ、対象 ChatGPT account で
   認証できる場合はこれを第一候補にする。Cline 公式は、この経路では
   separate API billing がなく、利用量は ChatGPT subscription に従うと
   案内している。
3. 上記が利用できない、または利用上限に達した場合のみ、`Cline`
   provider にサインインして `FREE` 表示のモデルを選ぶ。
4. `FREE` モデル利用時は `.clinerules/workflows/handoff-to-codex.md` を
   使い、安全性の高い実装を Codex CLI に渡す。
5. Settings > Features で Skills を有効にし、`mewri-ship-beta` が見える
   ことと workspace rules が有効であることを確認する。

## 日常の進め方

Codex app は司令塔、Codex CLI は作業者 + 検証者として使う。トークン節約を
優先する間は、app で長い実装相談を続けず、次の CLI スライスを短く切る。

| 目的 | 使うもの | 理由 |
| --- | --- | --- |
| 次に何を切るか、優先順位、失敗ログの短い解釈 | Codex app | 広い文脈の判断に向く |
| 1〜数ファイルの実装、validators、diff review | Codex CLI | repo の実差分と検証に集中できる |
| Auth / RLS / Storage / route security / migration | Codex CLI + review pass | 実装と独立レビューを分ける |
| UI 文言、docs、低リスク tests | Cursor / Cline / app | CLI 利用枠を温存できる |

通常の比率は次を目安にする。

```text
Normal:
Codex CLI: 70-85%
Codex app: 5-20%
Cursor / Cline: 0-15%

Parallel:
Codex CLI: 55-75%
Codex app: 5-15%
Cursor / Cline: 15-35%

Codex-token fallback:
Cursor / Cline: 80-90%
ChatGPT: 10-20%
Codex CLI: 0% until reset
Codex app: 0% until reset
```

1. Codex app で、次の一片について目的、非対象、受け入れ条件、
   セキュリティ影響を整理する。
2. app は CLI に渡す `Goal / Context / Constraints / Done when` 形式の
   最小プロンプトを作る。全文 handoff や長い履歴は貼らない。
3. UI 文言、文書、局所 CSS のような低リスク作業は Cline / Cursor で実装してよい。
4. 認証、RLS、Storage、秘密情報、migration、shared data path は Cline の
   `/handoff-to-codex.md` で brief を作り、Codex CLI に渡す。
5. Codex CLI では次の形式で開始する。

```text
Use $mewri-ship-beta to implement this reviewed slice:
<Cline で作成した brief>
```

6. 同じ作業ツリーで Cline と Codex を同時に編集させない。差分と検証結果を
   確認してから次の agent に渡す。
7. コード変更後は `npm.cmd run typecheck` と `npm.cmd test` を実行し、
   UI/runtime 変更時は `npm.cmd run build` も実行する。

### Codex app で頼むこと / 頼まないこと

app に頼む:

```text
handoff に基づいて、v0.10 の次スライスを1つだけ切って。
Codex CLI に渡す Goal / Context / Constraints / Done when 形式で出して。
```

app に頼まない:

```text
リポジトリ全体を見て、shared beta の本番接続まで進めて。
```

後者は context と判断範囲が膨らみ、token 消費と安全リスクが上がる。

## Codex CLI 実装ループ

調査資料から Mewri に採用する中心原則は、短い outcome-first の指示と、
`Review -> Repair -> Validate` の閉ループである。永続ルールを毎回の
プロンプトへ複製せず、`AGENTS.md` と `$mewri-ship-beta` に任せ、CLI
命令文には今回の差分だけを書く。

### 実装の開始

VS Code terminal やローカル PowerShell で対話セッションを開ける場合は
次を使う。

通常の複数ファイル実装:

```powershell
codex.cmd -C "C:\dev\mewri\ph" --model gpt-5.5 -c model_reasoning_effort='"medium"' -s workspace-write -a on-request
```

Auth / RLS / Storage / migration / server route / shared-data 境界:

```powershell
codex.cmd -C "C:\dev\mewri\ph" --model gpt-5.5 -c model_reasoning_effort='"high"' -s workspace-write -a on-request
```

指定モデルが利用できない場合は `--model` を外し、CLI の利用可能な既定
モデルを使う。sandbox の無効化や承認の全面迂回は行わない。

Codex App の command runner、CI、または stdin が terminal でない実行環境
では、対話コマンドは `Error: stdin is not a terminal` で開始できない。
その場合は `exec` を使い、プロンプトは PowerShell here-string で渡す。
`codex-cli 0.133.0` の `exec` は `-a` を受け付けず、非対話実行ログでは
`approval: never` として動作する。sandbox は `workspace-write` のまま
維持し、安全機構を迂回する option は使わない。

```powershell
$prompt = @'
Use $mewri-ship-beta to implement one reviewed slice.

Goal:
<今回の結果>

Context:
- <関連する既存差分と review finding>

Constraints:
- Preserve the local v0.9 demo and the Theme -> Post -> ZINE loop.
- Do not enable shared mode, apply migrations, deploy, or handle live secrets.
- Preserve unrelated changes.

Done when:
- <修正対象の acceptance checks>
- `npm.cmd run typecheck`, `npm.cmd test`, and `npm.cmd run build` pass when relevant.
- Report changed files, validation evidence, remaining risk, and next gate.
'@

codex.cmd exec -C "C:\dev\mewri\ph" --model gpt-5.5 -c model_reasoning_effort='"high"' -s workspace-write $prompt
```

### 命令文の型

各スライスの命令文は、次の短い形式を使う。

```text
Use $mewri-ship-beta to implement one reviewed slice.

Goal:
<今回、利用者または安全境界に生じさせる結果>

Context:
- <現時点で動いているもの>
- <既存の関連ファイルと既に成立している境界>

Constraints:
- Preserve the local v0.9 demo and the Theme -> Post -> ZINE loop.
- Do not enable shared mode, apply migrations, deploy, or handle live secrets.
- Keep Supabase/service-role work server-only and preserve unrelated changes.

Done when:
- <具体的な正常系または拒否ケース>
- `npm.cmd run typecheck` and `npm.cmd test` pass.
- Run `npm.cmd run build` when web/runtime behavior changes.
- Report changed files, validation evidence, remaining risk, and next gate.
```

### セキュリティ変更の独立レビュー

Auth、RLS、Storage、migration、secret、server route、shared-data path を
編集したスライスは、実装セッションの自己確認だけで完了扱いにしない。
検証が通った後、別の Codex review pass を実行する。

```powershell
codex.cmd review --uncommitted -c model='"gpt-5.5"' -c model_reasoning_effort='"high"'
```

`codex-cli 0.133.0` では `--uncommitted` と custom prompt の同時指定を
受理しないため、このコマンドでは標準 review instruction を使用する。
指摘があれば実装 CLI で修正し、validators と review を再度通す。指摘が
なければ、検証結果と「重大 findings なし」を
`docs/mewri_chatgpt_handoff_current.md` に記録してから staging 判断へ進む。
review が sandbox や CLI 実行環境の問題で完了しない場合は、
`--dangerously-bypass-approvals-and-sandbox` で迂回せず、staging 適用を
保留して `codex.cmd doctor --summary` 等で原因を切り分ける。

### 現在のレビューゲート

2026-05-28 に `codex.cmd review --uncommitted` を `gpt-5.5` /
reasoning `high` で完了した。初回タイムアウト後に延長して取得した
findings は、staging migration または実 adapter 接続より前に解消する。

- SQL policy が呼ぶ `private` helper の schema `USAGE` 権限が不足しており、
  正規メンバーの read が失敗し得る。
- migration の `uuid` ID と現行 repository/service が生成する prefixed
  string ID が不整合で、投稿や ZINE 永続化を妨げる。
- post route 成功 response が全 `MewriState` を返す契約で、将来の
  server-backed adapter で他 group 情報が漏えいし得る。
- request JSON 由来の `validatedImagePath` を信頼しており、server 側で
  upload/MIME/size 検証済みであることを保証できない。
- runtime が設定可能にする image bucket 名と migration の固定
  `post-images` policy が不整合である。

修正は、DB/RLS/storage 契約と route/upload 信頼境界を分離した小さな
Codex CLI スライスで行い、各スライスの validators 後に同じ独立 review
を再実行する。未解消 finding がある間は migration 適用、adapter 接続、
shared mode 有効化を行わない。

2026-05-28 に route/upload finding の remediation を実装した。HTTP
request body は `validatedImagePath` / `imageUrl` を受理せず、投稿 command
service は server-side upload / Storage lookup の検証結果がない正形式 path
も拒否する。外側実行環境で `npm.cmd run typecheck`、`npm.cmd test`
(`75` tests)、`npm.cmd run build` が成功し、`gpt-5.5` / reasoning
`high` の独立 review で追加 finding はなかった。shared mode の有効化と
staging / adapter 作業は、owner の次ゲート判断まで行わない。

### 今は導入しないもの

- 自動 PR review / CI 統合: v0.10 差分を整理し、通常の commit / PR
  運用を確立した後に検討する。
- 独自 eval dataset / trace 集計: shared beta の実装スライスと失敗例が
  蓄積してから作る方が評価対象を誤らない。
- MCP や cloud 自動化の追加: 外部権限と費用を増やす前に、staging の
  Auth / RLS / Storage 拒否境界を実証する。

## 次の実装スライス

現在は v0.10 の準備差分が未コミットで存在する。migration の初回
セキュリティレビューを実施し、Storage upload 保留と Group 整合性制約を
草案へ反映した。SQL の `zine_pages.group_id` 制約に合わせて DB row
mapper と拒否テストも追加済みである。加えて、shared-beta の投稿 command
service と route/application 境界を追加し、実認証・実 adapter 接続前は
API route を `503 shared_beta_route_unavailable` のまま閉じている。
request-controlled image path の除去と server-side image verification 必須化も
実装・検証・独立 review 済みである。

```text
1. route/upload remediation を含む v0.10 差分全体を commit / push するか判断する
2. Supabase staging で migration と拒否ケースを検証する
3. その後に実 auth session / repository adapter / Storage upload を一片ずつ接続する
```

## 人が承認する境界

AI は調査、設計案、実装、テスト、匿名化された指標の分析、実験案の作成を
進められる。一方、次は利用者と費用に直接影響するため、人が確認して承認する。

- 本番資格情報、migration 適用、deploy
- ユーザーへの案内、プライバシー/利用規約、モデレーション判断
- 課金が生じるサービスの契約、credit 購入、API key 設定

## 根拠資料

- Cline pricing: https://cline.bot/pricing
- Cline provider: https://docs.cline.bot/getting-started/cline-provider
- Cline tasks and free options: https://docs.cline.bot/features/tasks/understanding-tasks
- Cline model selection: https://docs.cline.bot/core-features/model-selection-guide
- Cline local models: https://docs.cline.bot/running-models-locally/ollama
- Cline skills: https://docs.cline.bot/customization/skills
- OpenAI Codex with ChatGPT plan:
  https://help.openai.com/en/articles/11369540-codex-in-chatgpt
- OpenAI models overview (`gpt-5.5` recommendation):
  https://developers.openai.com/api/docs/models
- OpenAI model comparison (`gpt-5.5`):
  https://developers.openai.com/api/docs/models/compare
- Codex use cases:
  https://developers.openai.com/codex/explore/

## 2026-06-03 Codex-Token Fallback Routing

Use these mode boundaries when coordinating AI execution:

```text
Normal mode:
Codex CLI: 70-85%
Codex app: 5-20%
Cursor / Cline: 0-15%

Parallel mode:
Codex CLI: 55-75%
Codex app: 5-15%
Cursor / Cline: 15-35%

Codex-token fallback mode:
Cursor / Cline: 80-90%
ChatGPT: 10-20%
Codex CLI: 0% until reset
Codex app: 0% until reset

Codex reset / review mode:
Codex CLI returns as implementer/verifier/reviewer for security-sensitive work.
Codex app returns as planning command center after reset.
```

Codex-token fallback means both Codex CLI and Codex app are unavailable until
reset. Cursor is the primary implementer in the dedicated Cursor worktree for
safe UI, docs, local-demo helpers/tests, local-only feedback UI, ZINE preview,
fixtures, and handoff cleanup. ChatGPT may act only as the owner command center:
choose the next safe Cursor task from the documented queue, rewrite a selected
task as a Cursor prompt, interpret short non-secret validation logs, and format
handoff summaries.

ChatGPT is not a code executor, is not a replacement for Codex diff review, and
must not approve auth, RLS, Storage, migration, API security, secrets, deploy,
staging activation, or production work as merge-ready.

During fallback, do not paste secrets, tokens, service_role keys, DB passwords,
JWT secrets, access tokens, refresh tokens, magic links, env files, or production
data into ChatGPT. If Cursor is unsure about UI, docs, or local-demo tests, ask
ChatGPT for task clarification. If Cursor is unsure about auth, RLS, Storage,
migration, server route security, secrets, deploy, staging activation,
production, or shared-beta backend code, stop and queue a handoff for Codex after
reset. Cursor may fix and rerun validation for UI/docs/local-demo failures; for
shared-beta/security/backend validation failures, Cursor stops and writes a
handoff.
