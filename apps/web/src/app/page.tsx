"use client";

import { canGenerateZine, type MewriState, type Post, type Theme } from "@mewri/core";
import { createBrowserLocalMewriAppService, createEvent, createPost, type MewriAppService } from "@mewri/data";
import { useEffect, useMemo, useState } from "react";

const appService: MewriAppService = createBrowserLocalMewriAppService();

type ActiveSection = "active" | "posts";
type PostListMode = "all" | "theme";

export default function HomePage() {
  const [state, setState] = useState<MewriState | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [postListMode, setPostListMode] = useState<PostListMode>("all");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [imageNotice, setImageNotice] = useState("");
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [postSubmitNotice, setPostSubmitNotice] = useState("");
  const [loadNotice, setLoadNotice] = useState("");
  const [activeSection, setActiveSection] = useState<ActiveSection>("active");

  useEffect(() => {
    let loaded: MewriState;
    try {
      loaded = appService.load();
    } catch {
      loaded = appService.demo.reset();
      setLoadNotice("ローカル保存の読み込みに失敗しました。デモ状態で再開しました。");
    }
    const activeThemeId = loaded.themes.find((theme) => theme.status === "active")?.id ?? loaded.themes[0]?.id ?? "";
    setState(loaded);
    setSelectedThemeId(activeThemeId);
  }, []);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY + 140;
      const active = document.getElementById("active-zine")?.offsetTop ?? 0;
      const posts = document.getElementById("zine-contents")?.offsetTop ?? 0;
      if (y >= posts) setActiveSection("posts");
      else if (y >= active) setActiveSection("active");
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeGroup = state?.groups[0];
  const activeUser = state?.users[0];
  const activeCycle = state?.zineCycles[0];

  const cycleThemes = useMemo(() => {
    if (!activeCycle) return [];
    return (state?.themes ?? []).filter((theme) => theme.zineCycleId === activeCycle.id);
  }, [activeCycle, state?.themes]);

  const visibleZineThemes = useMemo(
    () => cycleThemes.filter((theme) => theme.status === "active" || theme.status === "closed"),
    [cycleThemes]
  );
  const cyclePosts = useMemo(() => {
    const themeIds = new Set(cycleThemes.map((theme) => theme.id));
    return (state?.posts ?? []).filter((post) => themeIds.has(post.themeId));
  }, [cycleThemes, state?.posts]);

  const publishedZine = state?.zines.find((zine) => zine.zineCycleId === activeCycle?.id);
  const publishedPages = useMemo(() => {
    if (!publishedZine || !state) return [];
    return state.zinePages.filter((page) => page.zineId === publishedZine.id).sort((a, b) => a.pageNumber - b.pageNumber);
  }, [publishedZine, state]);

  const activeTheme = cycleThemes.find((theme) => theme.status === "active") ?? cycleThemes[0];
  const effectiveSelectedThemeId =
    selectedThemeId && visibleZineThemes.some((theme) => theme.id === selectedThemeId)
      ? selectedThemeId
      : activeTheme?.id ?? visibleZineThemes[0]?.id ?? "";
  const selectedTheme = state?.themes.find((theme) => theme.id === effectiveSelectedThemeId) ?? activeTheme;
  const selectedThemePosts = cyclePosts.filter((post) => post.themeId === effectiveSelectedThemeId);
  const visiblePosts = postListMode === "all" ? cyclePosts : selectedThemePosts;
  const zineReady = canGenerateZine(cyclePosts);
  const targetPostCount = Math.max(4, visibleZineThemes.length * 2);

  function persist(nextState: MewriState) {
    setState(appService.demo.replaceState(nextState));
  }

  async function handleSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFileName("");
      setImageNotice("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setImageNotice("画像ファイルを選んでください。");
      return;
    }

    setImageNotice("写真を準備しています...");
    try {
      const optimizedImage = await optimizeLocalImage(file);
      setImageUrl(optimizedImage);
      setSelectedFileName(file.name);
      setPostSubmitNotice("");
      setImageNotice("この写真を投稿できます。");
    } catch {
      setImageUrl("");
      setSelectedFileName("");
      setImageNotice("写真を読み込めませんでした。別の画像を試してください。");
    }
  }

  function handleSubmitPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const todayThemeId = activeTheme?.id ?? "";
    if (!activeUser || !activeGroup || !todayThemeId || !imageUrl || !activeCycle) return;

    const nextState = appService.commands.submitPost({
      context: {
        currentUserId: activeUser.id,
        requestSource: "browser_demo"
      },
      input: {
        userId: activeUser.id,
        groupId: activeGroup.id,
        themeId: todayThemeId,
        imageUrl,
        caption
      }
    });

    const nextCycleThemeIds = new Set(nextState.themes.filter((theme) => theme.zineCycleId === activeCycle.id).map((theme) => theme.id));
    const nextCyclePostCount = nextState.posts.filter((post) => nextCycleThemeIds.has(post.themeId)).length;

    setState(nextState);
    setCaption("");
    setImageUrl("");
    setSelectedFileName("");
    setImageNotice("");
    setSelectedThemeId(todayThemeId);
    setPostListMode("all");
    setPostSubmitNotice(`投稿しました。進行 ${nextCyclePostCount}/${targetPostCount}`);
  }

  function handleGenerateZine() {
    if (!activeCycle || !activeGroup || !zineReady) return;

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
  }

  function handleReset() {
    const nextState = appService.demo.reset();
    setState(nextState);
    setSelectedThemeId(nextState.themes.find((theme) => theme.status === "active")?.id ?? nextState.themes[0]?.id ?? "");
    setPostListMode("all");
    setCaption("");
    setImageUrl("");
    setSelectedFileName("");
    setImageNotice("");
    setPostSubmitNotice("");
  }

  function addSamplePosts() {
    if (!state || !activeGroup || !activeUser) return;
    const now = new Date();
    const samples = visibleZineThemes.flatMap((theme, themeIndex) =>
      [0, 1].map((itemIndex) =>
        createPost({
          userId: activeUser.id,
          groupId: activeGroup.id,
          themeId: theme.id,
          imageUrl: createSampleImage(theme.title, themeIndex, itemIndex),
          caption: `${theme.title} のサンプル ${itemIndex + 1}`,
          now: new Date(now.getTime() + (themeIndex * 2 + itemIndex) * 1000)
        })
      )
    );

    persist({
      ...state,
      posts: [...samples, ...state.posts],
      eventLogs: [
        createEvent({
          userId: activeUser.id,
          groupId: activeGroup.id,
          eventName: "sample_posts_created",
          entityType: "zine_cycle",
          entityId: activeCycle?.id,
          metadata: { count: samples.length },
          now
        }),
        ...state.eventLogs
      ]
    });
  }

  function useSampleImageForPost() {
    if (!activeTheme) return;
    setImageUrl(createSampleImage(activeTheme.title, Math.max(0, cycleThemes.indexOf(activeTheme)), 0));
    setSelectedFileName("サンプル画像");
    setImageNotice("サンプル画像を選択しました。");
    setCaption((current) => current || `${activeTheme.title} のサンプル`);
  }

  if (!state || !activeGroup || !activeCycle) {
    return (
      <main className="shell">
        <section className="loadPanel">
          <p className="kicker">Mewri MVP</p>
          <h1>読み込み中</h1>
          <p>{loadNotice || "ローカル状態を読み込んでいます。"}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="masthead" role="banner">
        <div className="mastLeft">
          <p className="kicker">{activeGroup.name}</p>
          <div className="brandRow">
            <h1 className="brand">Mewri</h1>
            <span className="brandMeta">{formatFullDate(new Date())}</span>
          </div>
        </div>
        <div className="mastRight">
          <button className="ghostButton compactOnly" type="button" onClick={addSamplePosts}>
            サンプル投入
          </button>
          <button className="ghostButton" type="button" onClick={handleReset}>
            リセット
          </button>
        </div>
      </header>

      <aside className="demoNotice" aria-label="beta notice">
        <p>
          <strong>β / 端末内のみ</strong>
          保存先: このブラウザのlocalStorage
        </p>
      </aside>

      <section className="homeGrid" aria-label="ホーム">
        <div className="mainCol">
          <HomeSection
            id="active-zine"
            number="1"
            title="参加中のZINE"
            subtitle={`${activeCycle.title} / 今日の投稿`}
            chipClass="chipEssential"
            chipLabel="実装中"
            toneClass="sectionEssential"
          >
            <div className="todayLayout">
              <div className="heroPrimary">
                <p className="kicker">今日のテーマ</p>
                <h3 className="heroTitle">{activeTheme?.title ?? "今日のテーマ"}</h3>
                <p className="heroBody">{activeTheme?.description ?? "このテーマで1投稿"}</p>

                <a className="primaryCta strongAction" href="#post-form">
                  今日の写真を投稿する
                  <span className="ctaMeta">{formatRemainingToday()}</span>
                </a>

                {cyclePosts.length > 0 && (
                  <ActiveZineProgressCard postCount={cyclePosts.length} targetPostCount={targetPostCount} />
                )}

                <form id="post-form" className="postForm editorialForm quickPostForm" onSubmit={handleSubmitPost}>
                  <label className="photoUpload">
                    <span>写真を選ぶ</span>
                    <small>スマホやPCから、今日の1枚を選択</small>
                    <input className="fileInput" type="file" accept="image/*" onChange={handleSelectFile} />
                  </label>
                  {imageNotice && <p className="imageNotice">{imageNotice}</p>}

                  {imageUrl && (
                    <div className="localPreview">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="選択画像プレビュー" />
                      <p className="fieldHint">{selectedFileName || "画像を選択済み"}</p>
                    </div>
                  )}

                  <button className="ghostButton inlineToggle advancedAction" type="button" onClick={() => setShowUrlFallback((current) => !current)}>
                    {showUrlFallback ? "URL入力を閉じる" : "URL入力（上級）"}
                  </button>

                  {showUrlFallback && (
                    <label>
                      画像URL
                      <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." />
                      <span className="fieldHint">サーバーアップロードは行いません</span>
                    </label>
                  )}

                  <label>
                    キャプション
                    <textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="ひとこと" />
                  </label>

                  {postSubmitNotice && <p className="postSubmitNotice">{postSubmitNotice}</p>}

                  <div className="formActions editorialActions">
                    <button className="submitButton" type="submit" disabled={!imageUrl || !activeTheme?.id}>
                      投稿
                    </button>
                    <button className="ghostButton formGhost" type="button" onClick={useSampleImageForPost}>
                      サンプル画像を使う
                    </button>
                    <button className="ghostButton formGhost" type="button" onClick={addSamplePosts}>
                      サンプル投稿を追加
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </HomeSection>

          <HomeSection
            id="zine-contents"
            number="2"
            title="このZINEの中身"
            subtitle="投稿と生成ZINE"
            chipClass="chipSupport"
            chipLabel="閲覧"
            toneClass="sectionSupport"
          >
            <div className="zinePostsBlock">
              <div className="zineSubhead">
                <p className="kicker">投稿アーカイブ</p>
                <h3>投稿一覧</h3>
              </div>

              <div className="themeFilterRail" role="tablist" aria-label="テーマフィルター">
                {visibleZineThemes.map((theme, index) => {
                  const count = cyclePosts.filter((post) => post.themeId === theme.id).length;
                  return (
                    <button
                      key={theme.id}
                      className={theme.id === effectiveSelectedThemeId ? "themePill active" : "themePill"}
                      type="button"
                      onClick={() => {
                        setSelectedThemeId(theme.id);
                        setPostListMode("theme");
                      }}
                      role="tab"
                      aria-selected={theme.id === effectiveSelectedThemeId}
                    >
                      <span>{index + 1}日目</span>
                      <strong>{theme.title}</strong>
                      <em>{count}件</em>
                    </button>
                  );
                })}
              </div>

              <div className="postGrid editorialGrid sameThemeGrid">
                <div className="postListHeader">
                  <p className="kicker">{postListMode === "all" ? "全投稿" : `テーマ: ${selectedTheme?.title ?? "未設定"}`}</p>
                  {postListMode === "theme" && (
                    <button className="ghostButton formGhost" type="button" onClick={() => setPostListMode("all")}>
                      全投稿に戻る
                    </button>
                  )}
                </div>
                {visiblePosts.length === 0 ? (
                  <p className="emptyText">投稿がまだありません。</p>
                ) : (
                  visiblePosts.map((post) => (
                    <PostCard key={post.id} post={post} theme={state.themes.find((theme) => theme.id === post.themeId)} cycleTitle={activeCycle.title} />
                  ))
                )}
              </div>
            </div>

            <div className="zineMakeBlock">
              <div className="zineSubhead zineRewardHead">
                <p className="kicker">ZINE生成</p>
                <h3>投稿を1冊にする</h3>
              </div>
              <CycleProgressCard
                cycleTitle={activeCycle.title}
                dateRange={`${activeCycle.startDate} - ${activeCycle.endDate}`}
                themes={visibleZineThemes}
                posts={state.posts}
                totalPostCount={cyclePosts.length}
                targetPostCount={targetPostCount}
                zineReady={zineReady}
                onGenerateZine={handleGenerateZine}
              />
            </div>

            {publishedZine ? (
              <section className="zineBook" aria-label="生成済みZINE">
                <article className="zineCover zinePaperPage coverPage">
                  <p className="kicker">COVER</p>
                  <h3>{publishedZine.title}</h3>
                  <p>{publishedZine.intro || "このサイクルの投稿をまとめたZINE"}</p>
                  <span className="pageNumber">p.0</span>
                </article>
                <div className="zinePages">
                  {publishedPages.length === 0 ? (
                    <div className="zineEmpty">
                      <p className="kicker">PAGES</p>
                      <p className="hintText">ページがまだありません。</p>
                    </div>
                  ) : (
                    publishedPages.map((page) => {
                      const post = state.posts.find((item) => item.id === page.postId);
                      const theme = post ? state.themes.find((item) => item.id === post.themeId) : undefined;
                      return (
                        <article className="zinePaperPage zinePage" key={page.id}>
                          <header className="zinePageHead">
                            <span>{theme?.title || "テーマ未設定"}</span>
                            <span className="pageNumber">p.{page.pageNumber}</span>
                          </header>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post?.imageUrl || createSampleImage("ZINE", 0, 0)} alt={post?.caption || "ZINEページ"} />
                          <p>{post?.caption || page.aiCaption || "キャプションなし"}</p>
                        </article>
                      );
                    })
                  )}
                </div>
                <article className="zinePaperPage zineClosingPage">
                  <p className="kicker">END</p>
                  <p className="zineClosingLine">このZINEはここで終了です。</p>
                </article>
              </section>
            ) : (
              <div className="zineEmpty">
                <p className="kicker">生成済みZINE</p>
                <p className="hintText">投稿をためると、ここにZINEを表示します。</p>
              </div>
            )}
          </HomeSection>

          <details className="futureModules">
            <summary>
              今後追加予定の機能
              <span>未実装</span>
            </summary>
            <div className="futureModulesContent">
              <HomeSection
                id="relevant-updates"
                number="3"
                title="フォロー中ユーザーの投稿"
                subtitle="未実装プレースホルダー"
                chipClass="chipSupport"
                chipLabel="未実装"
                toneClass="sectionSupport"
              >
                <div className="followPostGrid">
                  <PlaceholderModule label="未実装" title="フォロー中ユーザーの新着投稿" note="フォロー機能はMVP範囲外です" />
                  <PlaceholderModule label="未実装" title="このZINEに関連する話題" note="コメント・リアクションはMVP範囲外です" />
                  <PlaceholderModule label="未実装" title="参加したZINEへの導線" note="実ユーザー連携はMVP範囲外です" />
                </div>
              </HomeSection>

              <HomeSection
                id="discovery-circulation"
                number="4"
                title="発見と回遊"
                subtitle="未実装プレースホルダー"
                chipClass="chipDiscovery"
                chipLabel="検討中"
                toneClass="sectionDiscovery"
              >
                <div className="placeholderGrid" aria-label="プレースホルダーモジュール">
                  <PlaceholderModule label="未実装" title="話題のZINE" note="公開ディスカバリーはMVP範囲外です" />
                  <PlaceholderModule label="未実装" title="フォロー中のおすすめ" note="フォロー関係はMVP範囲外です" />
                  <PlaceholderModule label="未実装" title="おすすめ参加先" note="レコメンドはMVP範囲外です" />
                </div>
              </HomeSection>
            </div>
          </details>
        </div>
      </section>

      <nav className="bottomNav" aria-label="セクションナビ">
        <a className={activeSection === "active" ? "active" : ""} href="#active-zine">
          参加中
        </a>
        <a className={activeSection === "posts" ? "active" : ""} href="#zine-contents">
          中身
        </a>
      </nav>
    </main>
  );
}

function HomeSection({
  id,
  number,
  title,
  subtitle,
  toneClass,
  chipClass,
  chipLabel,
  children
}: {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  toneClass: string;
  chipClass: string;
  chipLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`sectionPanel ${toneClass}`}>
      <div className="sectionInner">
        <div className="sectionHeader">
          <div className="sectionTitleBlock">
            <p className="sectionNum">{number}</p>
            <div>
              <h2>{title}</h2>
              <p className="sectionSub">{subtitle}</p>
            </div>
          </div>
          <div className="sectionChips" aria-label="セクションタグ">
            <span className={`chip ${chipClass}`}>{chipLabel}</span>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function PlaceholderModule({ label, title, note }: { label: string; title: string; note: string }) {
  return (
    <div className="placeholderCard">
      <p className="kicker">{label}</p>
      <p className="placeholderTitle">{title}</p>
      <p className="hintText">{note}</p>
    </div>
  );
}

function ActiveZineProgressCard({
  postCount,
  targetPostCount
}: {
  postCount: number;
  targetPostCount: number;
}) {
  const remainingPosts = Math.max(0, targetPostCount - postCount);

  return (
    <section className="activeProgressCard" aria-label="参加中ZINEの進行">
      <p>
        <strong>{remainingPosts === 0 ? "ZINEを作れます" : `あと${remainingPosts}枚でZINEを作れます`}</strong>
        <span>{postCount}/{targetPostCount}</span>
      </p>
    </section>
  );
}

function CycleProgressCard({
  cycleTitle,
  dateRange,
  themes,
  posts,
  totalPostCount,
  targetPostCount,
  zineReady,
  onGenerateZine
}: {
  cycleTitle: string;
  dateRange: string;
  themes: Theme[];
  posts: Post[];
  totalPostCount: number;
  targetPostCount: number;
  zineReady: boolean;
  onGenerateZine: () => void;
}) {
  const postedThemeCount = themes.filter((theme) => posts.some((post) => post.themeId === theme.id)).length;
  const remainingPosts = Math.max(0, targetPostCount - totalPostCount);
  const readinessPercent = calcReadinessPercent(totalPostCount, targetPostCount);

  return (
    <section className="cycleCard">
      <div className="cycleHeader">
        <div>
          <p className="kicker">3日サイクル</p>
          <h4 className="cycleTitle">{cycleTitle}</h4>
          <span className="cycleMeta">{dateRange}</span>
        </div>
        <strong className="cycleCount">
          {postedThemeCount}/{themes.length}
        </strong>
      </div>
      <div className="cycleSteps">
        {themes.map((theme, index) => {
          const themePosts = posts.filter((post) => post.themeId === theme.id);
          return (
            <div className={theme.status === "active" ? "cycleStep active" : "cycleStep"} key={theme.id}>
              <span className="monoCaps">{index + 1}日目</span>
              <strong>{theme.title}</strong>
              <em>{themePosts.length}件の投稿</em>
            </div>
          );
        })}
      </div>
      <div className="cycleProgressSummary">
        <p>{zineReady ? "ZINEを作れる枚数が集まりました" : `あと${remainingPosts}枚でZINEを作れます`}</p>
        <div className="progressTrack" role="progressbar" aria-label="ZINEの完成進捗" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readinessPercent}>
          <span style={{ width: `${readinessPercent}%` }} />
        </div>
        <small>{totalPostCount}/{targetPostCount}枚</small>
      </div>
      <div className="cycleGenerate">
        <button type="button" disabled={!zineReady} onClick={onGenerateZine}>
          ZINEを作る
        </button>
      </div>
    </section>
  );
}

function PostCard({ post, theme, cycleTitle }: { post: Post; theme?: Theme; cycleTitle: string }) {
  return (
    <article className="postCard">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.imageUrl} alt={post.caption || theme?.title || "Mewriの投稿"} />
      <div>
        <span>ZINE: {cycleTitle}</span>
        <span>テーマ: {theme?.title ?? "テーマ未設定"}</span>
        <p>{post.caption || "キャプションなし"}</p>
      </div>
    </article>
  );
}

function createSampleImage(title: string, themeIndex: number, itemIndex: number): string {
  const palettes = [
    ["#2563eb", "#f59e0b"],
    ["#0f766e", "#8b5cf6"],
    ["#be123c", "#38bdf8"]
  ];
  const [a, b] = palettes[themeIndex % palettes.length];
  const text = escapeSvgText(title);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${a}"/>
          <stop offset="100%" stop-color="${b}"/>
        </linearGradient>
      </defs>
      <rect width="900" height="1200" fill="url(#g)"/>
      <circle cx="${240 + itemIndex * 260}" cy="${360 + themeIndex * 80}" r="180" fill="rgba(255,255,255,0.20)"/>
      <rect x="96" y="760" width="708" height="220" rx="24" fill="rgba(255,255,255,0.86)"/>
      <text x="132" y="850" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#171717">${text}</text>
      <text x="132" y="920" font-family="Arial, sans-serif" font-size="28" fill="#404040">Mewri sample ${itemIndex + 1}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function optimizeLocalImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const maxEdge = 1280;
        const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable.");
        context.fillStyle = "#fffdf8";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.76));
      } catch {
        reject(new Error("Unable to prepare image."));
      } finally {
        URL.revokeObjectURL(sourceUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("Unable to read image."));
    };
    image.src = sourceUrl;
  });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("ja-JP", { weekday: "short", month: "short", day: "2-digit", year: "numeric" });
}

function formatRemainingToday(now: Date = new Date()): string {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const ms = Math.max(0, end.getTime() - now.getTime());
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours <= 0) return `残り${minutes}分`;
  return `残り${hours}時間${minutes}分`;
}

function calcReadinessPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}
