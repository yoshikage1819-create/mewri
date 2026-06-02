# Mewri Documentation Index

更新日: 2026-06-02

## 現行の正本

新しい作業を始めるときは、目的に応じて次だけを先に読む。

| 用途 | 文書 | 扱い |
| --- | --- | --- |
| 現在地と次の作業 | `mewri_chatgpt_handoff_current.md` | 実装スライス完了時に更新する現行 status |
| 製品原則と対象範囲 | `mewri_requirements_definition_v0_3.md` | 主ループと対象外の正本 |
| 恒久的な判断 | `mewri_decision_log.md` | 方針を変える場合のみ追記する |
| repository 契約 | `mewri_repository_contract_v0_4.md` | `packages/data` の契約変更前に読む |
| closed shared beta | `mewri_v0_10_closed_shared_beta_foundation.md` | Auth / RLS / Storage / Supabase 境界の正本 |
| staging refusal verification | `mewri_supabase_staging_refusal_verification_plan_v0_10.md` | Supabase staging migration 適用前の拒否検証計画 |
| staging RPC migration approval | `mewri_supabase_staging_rpc_migration_approval_checklist_v0_10.md` | RPC migration 適用前のオーナー承認チェックリスト |
| Storage RLS local check | `mewri_storage_rls_local_read_check_instructions.md` | staging Storage read 境界を実ログインで確認する local-only 手順 |
| AI 開発運用 | `mewri_ai_workbench_setup.md` | Codex CLI / Cline / モデル選択の正本 |
| PC を軽くする開発の置き場所 | `mewri_owner_local_dev_disk_setup.md` | OneDrive 外の推奨パスと移行手順 |
| AI 並列・fallback 実装設計 | `mewri_ai_parallel_fallback_execution_design.md` | Codex と Cursor の並列実装、token 枯渇時の作業継続設計 |

## 根拠・参考資料

`deep-research-report.md` は Codex の活用方法を検討するための調査資料として
保持する。これは Mewri の製品要件や実装 status の正本ではないが、
`AGENTS.md`、Skill、検証・レビュー運用を改善するときの根拠資料として使う。

## 現在の実装フェーズ

```text
v0.9 browser-local demo: 動作中
v0.10 closed shared beta foundation: 実装準備・安全境界のコード化中
Supabase staging / migration 適用: 未実施
shared mode: 未有効化
```

直近では、shared-beta 投稿について次が追加済みである。

- SQL 草案は、検証済み server write / upload 経路の完成まで client の
  post insert と画像 upload を許可しない。
- `packages/data` に、未認証、なりすまし、非メンバー、他 group /
  inactive theme、不正または server 未検証の private image path を拒否する
  投稿 command service と route/application 境界がある。
- HTTP request は `validatedImagePath` / `imageUrl` を受け付けず、将来の
  server-side upload / Storage lookup が検証済み path を供給するまで
  shared-beta 投稿を実行しない。
- `apps/web` の追加 API route は、実認証・実 adapter の接続前は
  `503 shared_beta_route_unavailable` として閉じたままである。

## 履歴として残す文書

次は完了した過去スライス、β検証、検討資料であり、通常の実装開始時には
読まない。過去判断の確認や UI 回帰の背景確認に限って参照する。

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

## 整理方針

- 正本に吸収済みで、文字化けのため参照価値を失った旧初期計画は削除する。
- モデル選択と Cline/Codex 運用は `mewri_ai_workbench_setup.md` に一本化する。
- Codex 活用の調査レポートは参考資料として保持し、製品の source of truth
  とは区別する。
- 過去の読める β記録は、製品判断や回帰確認に役立つため履歴として維持する。
