"use client";

import { canGenerateZine, type MewriState, type Post, type Theme } from "@mewri/core";
import type { MewriAppService } from "@mewri/data";
import {
  buildGenerateZineConfirmMessage,
  createSampleImageDataUrl,
  formatEmptyPostListHint,
  formatEmptyPostListTitle,
  formatPostListKicker,
  formatThemePostCount,
  formatZineGenerateBlockedHint,
  formatZineRemainingHeadline,
  ZINE_EMPTY_HINT,
  ZINE_EMPTY_TITLE,
  type PostListMode
} from "./local-demo-ui";

type ZineToolsPanelProps = {
  state: MewriState;
  activeCycle: NonNullable<MewriState["zineCycles"][number]>;
  activeGroup: NonNullable<MewriState["groups"][number]>;
  cycleThemes: Theme[];
  visibleZineThemes: Theme[];
  cyclePosts: Post[];
  visiblePosts: Post[];
  postListMode: PostListMode;
  effectiveSelectedThemeId: string;
  selectedTheme?: Theme;
  targetPostCount: number;
  zineReady: boolean;
  publishedZine?: MewriState["zines"][number];
  publishedPages: MewriState["zinePages"];
  zineGenerateNotice: string;
  onSelectTheme: (themeId: string) => void;
  onShowAllPosts: () => void;
  onGenerateZine: () => void;
};

export function ZineToolsPanel({
  state,
  activeCycle,
  cycleThemes,
  visibleZineThemes,
  cyclePosts,
  visiblePosts,
  postListMode,
  effectiveSelectedThemeId,
  selectedTheme,
  targetPostCount,
  zineReady,
  publishedZine,
  publishedPages,
  zineGenerateNotice,
  onSelectTheme,
  onShowAllPosts,
  onGenerateZine
}: ZineToolsPanelProps) {
  const remainingPosts = Math.max(0, targetPostCount - cyclePosts.length);
  const generateBlockedHint = formatZineGenerateBlockedHint(remainingPosts, zineReady);
  const postedThemeCount = visibleZineThemes.filter((theme) => cyclePosts.some((post) => post.themeId === theme.id)).length;

  return (
    <details className="sevenBamZineTools">
      <summary>ZINE（開発用）</summary>
      <div className="sevenBamZineToolsBody">
        <section aria-labelledby="zine-proof-title">
          <h2 id="zine-proof-title">集まった写真</h2>
          <p className="sevenBamZineHint">いいねもコメントもありません。ZINE生成の確認用です。</p>

          <nav className="sevenBamZineIndex" role="tablist" aria-label="テーマ索引">
            {visibleZineThemes.map((theme, index) => {
              const count = cyclePosts.filter((post) => post.themeId === theme.id).length;
              return (
                <button
                  key={theme.id}
                  className={theme.id === effectiveSelectedThemeId ? "active" : ""}
                  type="button"
                  onClick={() => onSelectTheme(theme.id)}
                  role="tab"
                  aria-selected={theme.id === effectiveSelectedThemeId}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{theme.title}</strong>
                  <em>{formatThemePostCount(count)}</em>
                </button>
              );
            })}
          </nav>

          <div className="sevenBamZineSheetLead">
            <p>{formatPostListKicker(postListMode, selectedTheme?.title)}</p>
            {postListMode === "theme" ? (
              <button type="button" className="sevenBamGhostButton" onClick={onShowAllPosts}>
                全枚に戻る
              </button>
            ) : null}
          </div>

          {visiblePosts.length === 0 ? (
            <div className="sevenBamZineEmpty" role="status">
              <p>{formatEmptyPostListTitle(postListMode, selectedTheme?.title)}</p>
              <p>{formatEmptyPostListHint(postListMode)}</p>
            </div>
          ) : (
            <div className="sevenBamZineGrid">
              {visiblePosts.map((post) => (
                <figure key={post.id} className="sevenBamZineCell">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.imageUrl} alt={post.caption || selectedTheme?.title || "投稿"} />
                  <figcaption>{state.themes.find((theme) => theme.id === post.themeId)?.title}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>

        <section className="sevenBamBindRite" aria-label="ZINE製本">
          <h3>この号を製本する</h3>
          <p>
            {zineReady
              ? `${cyclePosts.length}枚が並びました。一冊のZINEとして読み返せます。`
              : formatZineRemainingHeadline(remainingPosts)}
          </p>
          <p className="sevenBamZineMeta">
            {activeCycle.startDate} – {activeCycle.endDate} · {postedThemeCount}/{visibleZineThemes.length}日 ·{" "}
            {cyclePosts.length}/{targetPostCount}枚
          </p>
          <button
            type="button"
            className="sevenBamPrimaryButton"
            disabled={!zineReady}
            aria-describedby={generateBlockedHint ? "zine-generate-hint" : undefined}
            onClick={onGenerateZine}
          >
            製本する
          </button>
          {generateBlockedHint ? (
            <p id="zine-generate-hint" className="sevenBamZineHint">
              {generateBlockedHint}
            </p>
          ) : null}
          {zineGenerateNotice ? (
            <p className="sevenBamSubmitNotice" role="status" aria-live="polite">
              {zineGenerateNotice}
            </p>
          ) : null}
        </section>

        {publishedZine ? (
          <section className="sevenBamFolioReader" id="generated-zine" aria-label="生成済みZINE">
            <h3>{publishedZine.title}</h3>
            <p>{publishedZine.intro || "この号の投稿をまとめたZINE"}</p>
            <div className="sevenBamFolioPages">
              {publishedPages.length === 0 ? (
                <p>ページがまだありません。</p>
              ) : (
                publishedPages.map((page) => {
                  const post = state.posts.find((item) => item.id === page.postId);
                  const theme = post ? state.themes.find((item) => item.id === post.themeId) : undefined;
                  return (
                    <article key={page.id} className="sevenBamFolioPage">
                      <header>
                        <span>{theme?.title || "—"}</span>
                        <span>p.{page.pageNumber}</span>
                      </header>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post?.imageUrl || createSampleImageDataUrl("ZINE", 0, 0)} alt={post?.caption || "ZINEページ"} />
                      <p>{post?.caption || page.aiCaption || ""}</p>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        ) : (
          <div className="sevenBamZineEmpty" role="status">
            <p>{ZINE_EMPTY_TITLE}</p>
            <p>{ZINE_EMPTY_HINT}</p>
          </div>
        )}
      </div>
    </details>
  );
}

export function buildGenerateZineHandler(
  activeCycle: NonNullable<MewriState["zineCycles"][number]>,
  activeGroup: NonNullable<MewriState["groups"][number]>,
  activeUser: MewriState["users"][number] | undefined,
  zineReady: boolean,
  publishedZine: MewriState["zines"][number] | undefined,
  appService: MewriAppService,
  setState: (state: MewriState) => void,
  setZineGenerateNotice: (notice: string) => void
) {
  return () => {
    if (!zineReady) return;
    if (!window.confirm(buildGenerateZineConfirmMessage(activeCycle.title, Boolean(publishedZine)))) return;

    setState(
      appService.commands.publishZineForCycle({
        context: {
          currentUserId: activeUser?.id,
          requestSource: "browser_demo"
        },
        input: {
          userId: activeUser?.id,
          groupId: activeGroup.id,
          zineCycleId: activeCycle.id
        }
      })
    );
    setZineGenerateNotice("この号を製本しました。下のリーダーで読めます。");
  };
}

export function isZineReadyForCycle(cyclePosts: Post[]): boolean {
  return canGenerateZine(cyclePosts);
}
