# Mewri Documentation Index

更新日: 2026-06-02

## 現行�E正本

新しい作業を始めるとき�E、目皁E��応じて次だけを先に読む、E

| 用送E| 斁E�� | 扱ぁE|
| --- | --- | --- |
| 現在地と次の作業 | `mewri_chatgpt_handoff_current.md` | 実裁E��ライス完亁E��に更新する現衁Estatus |
| 製品原剁E��対象篁E�� | `mewri_requirements_definition_v0_3.md` | 主ループと対象外�E正本 |
| 恒乁E��な判断 | `mewri_decision_log.md` | 方針を変える場合�Eみ追記すめE|
| repository 契紁E| `mewri_repository_contract_v0_4.md` | `packages/data` の契紁E��更前に読む |
| closed shared beta | `mewri_v0_10_closed_shared_beta_foundation.md` | Auth / RLS / Storage / Supabase 墁E��の正本 |
| staging refusal verification | `mewri_supabase_staging_refusal_verification_plan_v0_10.md` | Supabase staging migration 適用前�E拒否検証計画 |
| staging RPC migration approval | `mewri_supabase_staging_rpc_migration_approval_checklist_v0_10.md` | RPC migration 適用前�Eオーナ�E承認チェチE��リスチE|
| Storage RLS local check | `mewri_storage_rls_local_read_check_instructions.md` | staging Storage read 墁E��を実ログインで確認すめElocal-only 手頁E|
| C-7 Storage upload mechanism design | `mewri_c7_storage_upload_mechanism_design.md` | Compare safe shared-beta image upload mechanisms and choose the recommended next slice |
| C-8a Storage upload broker owner approval card | `mewri_c8a_storage_upload_broker_owner_approval_card.md` | Non-technical owner approval card before code-only broker interface work |
| C-8c staging upload broker config plan | `mewri_c8c_staging_upload_broker_config_verification_plan.md` | Docs-only staging broker config and verification plan before live activation |
| Deep Research AI development reorg prompt | `mewri_deep_research_ai_development_reorg_prompt.md` | Prompt pack for researching a safer non-technical-owner AI development operating model |
| AI development operating model v2 | `mewri_ai_development_operating_model_v2.md` | Zero-capital AI development workflow for non-technical owner, Codex, Cursor, ChatGPT, and approval gates |
| AI 開発運用 | `mewri_ai_workbench_setup.md` | Codex CLI / Cline / モチE��選択�E正本 |
| PC を軽くする開発の置き場所 | `mewri_owner_local_dev_disk_setup.md` | OneDrive 外�E推奨パスと移行手頁E|
| AI 並列�Efallback 実裁E��訁E| `mewri_ai_parallel_fallback_execution_design.md` | Codex と Cursor の並列実裁E��token 枯渁E��の作業継続設訁E|
| Cursor fallback PR 斁E��E| `mewri_cursor_fallback_pr_draft.md` | `cursor/parallel-local-ui-docs` 用の PR 説明ドラフト�E�オーナ�E/Codex が開く�E編雁E��る！E|
| Cursor fallback 最終棚卸ぁE| `mewri_cursor_fallback_final_inventory.md` | 変更ファイル一覧・安�E墁E��・Codex レビュー用の事実記録 |
| ローカルチE��の確認（非技術老E��E| `runbooks/local-demo-review-guide.md` | 安�Eに触って感想を伝える手頁E��コード�E本番・秘寁E��報は触らなぁE��E|
| �F�l�����ŏ���1�T�ԃK�C�h | `mewri_friend_first_week_guide.md` | �Q�����ӌ�ɗF�l���ŏ���1�T�ԂŌ��邱�ƁE�o�����z�E������ |
| �F�l�����I���{�[�f�B���O���ҕ� | `mewri_friend_onboarding_invitation.md` | ��Z�p�҂̗F�l���AMewri�̗��R�E�ւ����E���S���E�𗝉����邽�߂̏��ҕ� |
| AI memory pack | `mewri_memory_pack.md` and `../memory/` | Compact canonical memory for selective Codex/Cursor/ChatGPT context injection |
| Obsidian memory vault | `mewri_obsidian_memory_vault_setup.md` | ローカル Obsidian vault の開き方と安�Eルール |

## 根拠・参老E��E��

`deep-research-report.md` は Codex の活用方法を検討するため�E調査賁E��として
保持する。これ�E Mewri の製品要件めE��裁Estatus の正本ではなぁE��、E
`AGENTS.md`、Skill、検証・レビュー運用を改喁E��るとき�E根拠賁E��として使ぁE��E

## 現在の実裁E��ェーズ

```text
v0.9 browser-local demo: 動作中
v0.10 closed shared beta foundation: 実裁E��備・安�E墁E��のコード化中
Supabase staging / migration 適用: 未実施
shared mode: 未有効匁E
```

直近では、shared-beta 投稿につぁE��次が追加済みである、E

- SQL 草案�E、検証済み server write / upload 経路の完�Eまで client の
  post insert と画僁Eupload を許可しなぁE��E
- `packages/data` に、未認証、なりすまし、E��メンバ�E、仁Egroup /
  inactive theme、不正また�E server 未検証の private image path を拒否する
  投稿 command service と route/application 墁E��がある、E
- HTTP request は `validatedImagePath` / `imageUrl` を受け付けず、封E��の
  server-side upload / Storage lookup が検証済み path を供給するまで
  shared-beta 投稿を実行しなぁE��E
- `apps/web` の追加 API route は、実認証・宁Eadapter の接続前は
  `503 shared_beta_route_unavailable` として閉じたままである、E

## 履歴として残す斁E��

次は完亁E��た過去スライス、β検証、検討賁E��であり、E��常の実裁E��始時には
読まなぁE��過去判断の確認や UI 回帰の背景確認に限って参�Eする、E

```text
mewri_data_model_v0_3.md
mewri_data_model_v0_4.md
mewri_database_migration_sketch_v0_5.md
mewri_mvp_v0_4_testing_plan.md
mewri_mvp_v0_5_database_readiness.md
mewri_mobile_preview_v0_5.md
mewri_mvp_v0_6_completion.md
mewri_v0_6_home_extension_brief.md
mewri_mvp_v0_7_brief.md
mewri_mvp_v0_8_beta_readiness.md
mewri_self_beta_qa_v0_8.md
mewri_nearby_beta_handoff_v0_8.md
mewri_nearby_beta_test_script_v0_8.md
mewri_url_sharing_beta_plan_v0_9.md
mewri_url_sharing_beta_readiness_v0_9.md
mewri_vercel_deployment_v0_9.md
mewri_post_first_and_host_theme_strategy.md
mewri_theme_modes_strategy_v0_9.md
mewri_personal_inbox_theme_strategy_v0_9.md
mewri_post_routing_roadmap_v0_9.md
mewri_v0_9_5_zine_progress_reward_loop.md
mewri_v0_9_6_beta_feedback_visual_posting.md
mewri_v0_9_7_cognitive_load_refinement.md
mewri_student_pack_development_setup.md
```

## 整琁E��釁E

- 正本に吸収済みで、文字化け�Eため参�E価値を失った旧初期計画は削除する、E
- モチE��選択と Cline/Codex 運用は `mewri_ai_workbench_setup.md` に一本化する、E
- Codex 活用の調査レポ�Eト�E参老E��E��として保持し、製品�E source of truth
  とは区別する、E
- 過去の読める β記録は、製品判断めE��帰確認に役立つため履歴として維持する、E

## AI Memory Pack

- `mewri_memory_pack.md` explains the Phase 1 repo-local memory pack.
- `../memory/` is the canonical compact memory source for selective
  Codex/Cursor/ChatGPT context injection.
- Do not inject all memory files by default; select only relevant files.
