"use client";

import { canGenerateZine, type MewriState, type Post, type Theme } from "@mewri/core";
import { createBrowserLocalMewriAppService, createEvent, createPost, type MewriAppService } from "@mewri/data";
import { useEffect, useMemo, useState } from "react";

const appService: MewriAppService = createBrowserLocalMewriAppService();

type ActiveSection = "active" | "posts" | "updates" | "discovery";
type PostListMode = "all" | "theme";

export default function HomePage() {
  const [state, setState] = useState<MewriState | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [postListMode, setPostListMode] = useState<PostListMode>("all");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [postSubmitNotice, setPostSubmitNotice] = useState("");
  const [loadNotice, setLoadNotice] = useState("");
  const [activeSection, setActiveSection] = useState<ActiveSection>("active");

  useEffect(() => {
    let loaded: MewriState;
    try {
      loaded = appService.load();
    } catch {
      loaded = appService.demo.reset();
      setLoadNotice("ローカルデータの読み込みに失敗したため、デモ状態を再作成しました。");
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
      const updates = document.getElementById("relevant-updates")?.offsetTop ?? 0;
      const discovery = document.getElementById("discovery-circulation")?.offsetTop ?? 0;

      if (y >= discovery) setActiveSection("discovery");
      else if (y >= updates) setActiveSection("updates");
      else if (y >= posts) setActiveSection("posts");
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
  const scheduledThemes = useMemo(() => cycleThemes.filter((theme) => theme.status === "scheduled"), [cycleThemes]);

  const cyclePosts = useMemo(() => {
    const themeIds = new Set(cycleThemes.map((theme) => theme.id));
    return (state?.posts ?? []).filter((post) => themeIds.has(post.themeId));
  }, [cycleThemes, state?.posts]);

  const publishedZine = state?.zines.find((zine) => zine.zineCycleId === activeCycle?.id);
  const publishedPages = useMemo(() => {
    if (!publishedZine || !state) return [];
    return state.zinePages
      .filter((page) => page.zineId === publishedZine.id)
      .sort((a, b) => a.pageNumber - b.pageNumber);
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
    setSelectedThemeId(todayThemeId);
    setPostListMode("all");
    setPostSubmitNotice(`あなたの投稿がZINEに追加されました（進捗 ${nextCyclePostCount}/${targetPostCount}）`);
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
    setCaption((current) => current || `${activeTheme.title} のサンプル`);
  }

  if (!state || !activeGroup || !activeCycle) {
    return (
      <main className="shell">
        <section className="loadPanel">
          <p className="kicker">Mewri MVP</p>
          <h1>Mewriを読み込み中...</h1>
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
            サンプル投稿を追加
          </button>
          <button className="ghostButton" type="button" onClick={handleReset}>
            デモをリセット
          </button>
        </div>
      </header>

      <aside className="demoNotice" aria-label="URL共有デモについて">
        <div>
          <p className="kicker">URL共有デモ</p>
          <strong>このURLは、同じブラウザ内のローカルデモ状態を再表示するためのものです。</strong>
        </div>
        <p>
          投稿・ZINE生成・閲覧はこのブラウザの localStorage にだけ保存されます。別端末や別ユーザーには共有されません。
          ログイン、フォロー、通知、公開フィード、共有DB連携は未実装です。
        </p>
      </aside>

      <section className="homeGrid" aria-label="ホーム">
        <div className="mainCol">
          <HomeSection
            id="active-zine"
            number="1"
            title="参加中のZINE"
            subtitle={`${activeCycle.title} の今日の投稿`}
            chipClass="chipEssential"
            chipLabel="主導線"
            toneClass="sectionEssential"
          >
            <div className="todayLayout">
              <div className="heroPrimary">
                <p className="kicker">今日のテーマ</p>
                <h3 className="heroTitle">{activeTheme?.title ?? "今日のテーマ"}</h3>
                <p className="heroBody">
                  {activeTheme?.description ?? "今日のテーマに合わせて投稿します。投稿は現在進行中のZINEに積み上がります。"}
                </p>
                {scheduledThemes.length > 0 && (
                  <div className="lockedTheme">
                    <strong>次のテーマはまだ投稿できません</strong>
                    <em>予定テーマ: {scheduledThemes.map((theme) => theme.title).join(" / ")}（当日まで閲覧のみ）</em>
                  </div>
                )}
                <a className="primaryCta strongAction" href="#post-form">
                  今日の投稿をする
                  <span className="ctaMeta">{formatRemainingToday()}</span>
                </a>

                <ActiveZineProgressCard
                  postCount={cyclePosts.length}
                  targetPostCount={targetPostCount}
                  remainingLabel={formatRemainingInCycle(activeCycle.endDate)}
                  readinessPercent={calcReadinessPercent(cyclePosts.length, targetPostCount)}
                />

                <a
                  className="postStackLink"
                  href="#zine-contents"
                  onClick={() => {
                    if (activeTheme) setSelectedThemeId(activeTheme.id);
                    setPostListMode("all");
                  }}
                >
                  <span>
                    <strong>みんなの投稿</strong>
                    <em>このZINEの投稿一覧を見る（今日のテーマ + クローズ済みテーマ）</em>
                  </span>
                  <span className="photoStack" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                </a>

                <form id="post-form" className="postForm editorialForm quickPostForm" onSubmit={handleSubmitPost}>
                  <p className="postHelperCopy">
                    今日の投稿は、この期間の投稿として小さなZINEにまとまります。1枚ずつ積み上げていきましょう。
                  </p>
                  <label>
                    投稿先テーマ
                    <select value={activeTheme?.id ?? ""} disabled aria-disabled="true">
                      <option value={activeTheme?.id ?? ""}>{activeTheme?.title ?? "今日のテーマ"}</option>
                    </select>
                  </label>
                  <label>
                    画像URL
                    <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." />
                    <span className="fieldHint">
                      画像アップロードは未実装です。MVPでは画像URLで投稿します。試す場合はサンプル画像ボタンを使ってください。
                    </span>
                  </label>
                  <label>
                    キャプション
                    <textarea
                      value={caption}
                      onChange={(event) => setCaption(event.target.value)}
                      placeholder="感じたことを短く書いてください。"
                    />
                  </label>
                  {postSubmitNotice && <p className="postSubmitNotice">{postSubmitNotice}</p>}
                  <div className="formActions editorialActions">
                    <button className="submitButton" type="submit" disabled={!imageUrl || !activeTheme?.id}>
                      投稿する
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
            subtitle="このサイクルの投稿・クローズ済みテーマ投稿・生成プレビューを表示"
            chipClass="chipSupport"
            chipLabel="確認"
            toneClass="sectionSupport"
          >
            <div className="zinePostsBlock">
              <div className="zineSubhead">
                <p className="kicker">投稿アーカイブ</p>
                <h3>このZINEに含まれる投稿</h3>
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
                  <p className="kicker">{postListMode === "all" ? "このZINEの全投稿" : `テーマ: ${selectedTheme?.title ?? "テーマ"}`}</p>
                  {postListMode === "theme" && (
                    <button className="ghostButton formGhost" type="button" onClick={() => setPostListMode("all")}>
                      みんなの投稿に戻る
                    </button>
                  )}
                </div>
                {visiblePosts.length === 0 ? (
                  <p className="emptyText">
                    {postListMode === "all" ? "このZINEにはまだ投稿がありません。" : "このテーマにはまだ投稿がありません。"}
                  </p>
                ) : (
                  visiblePosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      theme={state.themes.find((theme) => theme.id === post.themeId)}
                      cycleTitle={activeCycle.title}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="zineMakeBlock">
              <div className="zineSubhead zineRewardHead">
                <p className="kicker">ZINE生成</p>
                <h3>投稿をまとめて1冊にする</h3>
              </div>
              <CycleProgressCard
                cycleTitle={activeCycle.title}
                dateRange={`${activeCycle.startDate} - ${activeCycle.endDate}`}
                cycleEndDate={activeCycle.endDate}
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
                <div className="zineCover">
                  <p className="kicker">完成した小さなZINE</p>
                  <h3>{publishedZine.title}</h3>
                  <p>{publishedZine.intro || "このサイクルの投稿をまとめたZINEです。"}</p>
                </div>
                <div className="zinePages">
                  {publishedPages.length === 0 ? (
                    <div className="zineEmpty">
                      <p className="kicker">ページ</p>
                      <p className="hintText">現在はページがありません。</p>
                    </div>
                  ) : (
                    publishedPages.map((page) => {
                      const post = state.posts.find((item) => item.id === page.postId);
                      const theme = post ? state.themes.find((item) => item.id === post.themeId) : undefined;
                      return (
                        <figure className="zinePage" key={page.id}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post?.imageUrl || createSampleImage("ZINE", 0, 0)} alt={post?.caption || "ZINEページ"} />
                          <figcaption>
                            <span>{theme?.title || "テーマ未設定"}</span>
                            <p>{post?.caption || page.aiCaption || "キャプションなし"}</p>
                          </figcaption>
                        </figure>
                      );
                    })
                  )}
                </div>
                <p className="zineClosingLine">このZINEは、この期間に集まった投稿でできています。次のテーマでもう1冊つくりましょう。</p>
              </section>
            ) : (
              <div className="zineEmpty">
                <p className="kicker">生成済みZINE</p>
                <p className="hintText">条件を満たすと、この場所に生成後のZINEプレビューが表示されます。</p>
              </div>
            )}
          </HomeSection>

          <HomeSection
            id="relevant-updates"
            number="3"
            title="フォロー中ユーザーの投稿"
            subtitle="フォロー投稿表示は未実装です。将来機能のプレースホルダーです。"
            chipClass="chipSupport"
            chipLabel="未実装"
            toneClass="sectionSupport"
          >
            <div className="followPostGrid">
              <PlaceholderModule
                label="未実装"
                title="フォロー中ユーザーの新着投稿"
                note="将来の機能です。現在はローカル表示のみで、データ連携はありません。"
              />
              <PlaceholderModule
                label="未実装"
                title="このZINEに関連する話題"
                note="将来の機能です。現在は投稿とZINE生成の基本導線に集中しています。"
              />
              <PlaceholderModule
                label="未実装"
                title="参加したZINEへの通知"
                note="将来の機能です。通知機能はMVP範囲外です。"
              />
            </div>
          </HomeSection>

          <HomeSection
            id="discovery-circulation"
            number="4"
            title="発見と回遊"
            subtitle="公開探索は未実装です。将来機能のプレースホルダーです。"
            chipClass="chipDiscovery"
            chipLabel="検討中"
            toneClass="sectionDiscovery"
          >
            <div className="placeholderGrid" aria-label="プレースホルダーモジュール">
              <PlaceholderModule
                label="未実装"
                title="外部で話題のZINE"
                note="公開ディスカバリーは未実装です。ローカルデモ用途として表示しています。"
              />
              <PlaceholderModule
                label="未実装"
                title="フォロー中ユーザーの注目ZINE"
                note="将来の機能です。フォロー関係と公開探索はMVP範囲外です。"
              />
              <PlaceholderModule
                label="おすすめ"
                title="おすすめ参加先"
                note="UI確認用の仮表示です。推薦ロジックは未実装です。"
              />
            </div>
          </HomeSection>
        </div>
      </section>

      <nav className="bottomNav" aria-label="主要ナビゲーション">
        <a className={activeSection === "active" ? "active" : ""} href="#active-zine">
          参加中
        </a>
        <a className={activeSection === "posts" ? "active" : ""} href="#zine-contents">
          中身
        </a>
        <a className={activeSection === "updates" ? "active" : ""} href="#relevant-updates">
          フォロー
        </a>
        <a className={activeSection === "discovery" ? "active" : ""} href="#discovery-circulation">
          発見
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
  targetPostCount,
  remainingLabel,
  readinessPercent
}: {
  postCount: number;
  targetPostCount: number;
  remainingLabel: string;
  readinessPercent: number;
}) {
  return (
    <section className="activeProgressCard" aria-label="進行中ZINEの進捗">
      <p>
        <strong>投稿数</strong>
        <span>{postCount}/{targetPostCount}</span>
      </p>
      <p>
        <strong>残り時間</strong>
        <span>{remainingLabel}</span>
      </p>
      <p>
        <strong>完成まで</strong>
        <span>{readinessPercent}%</span>
      </p>
    </section>
  );
}

function CycleProgressCard({
  cycleTitle,
  dateRange,
  cycleEndDate,
  themes,
  posts,
  totalPostCount,
  targetPostCount,
  zineReady,
  onGenerateZine
}: {
  cycleTitle: string;
  dateRange: string;
  cycleEndDate: string;
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
      <div className="cycleMetrics">
        <p>
          <strong>投稿数</strong>
          <span>{totalPostCount}/{targetPostCount}</span>
        </p>
        <p>
          <strong>残り時間</strong>
          <span>{formatRemainingInCycle(cycleEndDate)}</span>
        </p>
        <p>
          <strong>完成まで</strong>
          <span>{readinessPercent}%</span>
        </p>
      </div>
      <div className="cycleGenerate">
        <p className="cycleFoot">
          {zineReady ? "このサイクルはZINE生成の準備ができました。" : `ZINE生成まであと ${remainingPosts} 投稿です。`}
        </p>
        <button type="button" disabled={!zineReady} onClick={onGenerateZine}>
          ZINEを生成
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
      <text x="132" y="920" font-family="Arial, sans-serif" font-size="28" fill="#404040">Mewri sample ${
        itemIndex + 1
      }</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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

function formatRemainingInCycle(endDate: string, now: Date = new Date()): string {
  const end = new Date(`${endDate}T23:59:59`);
  if (Number.isNaN(end.getTime())) return "期間情報なし";
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return "このサイクルは終了";
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  if (days > 0) return `あと${days}日${remainHours}時間`;
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `あと${Math.max(0, remainHours)}時間${Math.max(0, minutes)}分`;
}

function calcReadinessPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}
