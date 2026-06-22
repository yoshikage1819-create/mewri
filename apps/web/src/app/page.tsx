"use client";

import { type MewriState } from "@mewri/core";
import { createBrowserLocalMewriAppService, createEvent, createPost, type MewriAppService } from "@mewri/data";
import { useEffect, useMemo, useRef, useState } from "react";
import { LocalDemoFeedbackNote } from "./local-demo-feedback-note";
import { LocalDemoSafetyNotice } from "./local-demo-safety-notice";
import {
  buildAddSamplePostsConfirmMessage,
  clampCaption,
  createSampleImageDataUrl,
  formatPostSubmitSuccessMessage,
  isCaptionWithinLimit,
  LOCAL_DEMO_CAMERA_FAILED_MESSAGE,
  LOCAL_DEMO_IMAGE_LOAD_FAILED_MESSAGE,
  LOCAL_DEMO_RESET_CONFIRM_MESSAGE,
  optimizeLocalImage,
  revokeObjectUrl,
  SEVEN_BAM_BRAND,
  type PhotoPickerSource,
  validateLocalImageFile
} from "./local-demo-ui";
import { buildGenerateZineHandler, isZineReadyForCycle, ZineToolsPanel } from "./seven-bam-zine-tools";
import { PhotoComposer, PhotoSourceSheet, TodayFeed, type TodayFeedItem, TodayScreen } from "./seven-bam-ui";

const appService: MewriAppService = createBrowserLocalMewriAppService();

type AppView = "today" | "feed";

export default function HomePage() {
  const [state, setState] = useState<MewriState | null>(null);
  const [view, setView] = useState<AppView>("today");
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [photoSource, setPhotoSource] = useState<PhotoPickerSource | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [imageError, setImageError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState("");
  const [loadNotice, setLoadNotice] = useState("");
  const [zineGenerateNotice, setZineGenerateNotice] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [postListMode, setPostListMode] = useState<"all" | "theme">("all");

  const cameraButtonRef = useRef<HTMLButtonElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

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
    return () => revokeObjectUrl(previewUrl);
  }, [previewUrl]);

  const activeGroup = state?.groups[0];
  const activeUser = state?.users[0];
  const activeCycle = state?.zineCycles[0];
  const publishedZine = state?.zines.find((zine) => zine.zineCycleId === activeCycle?.id);

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
  const zineReady = isZineReadyForCycle(cyclePosts);
  const targetPostCount = Math.max(4, visibleZineThemes.length * 2);

  const groupMembers = useMemo(() => {
    if (!state || !activeGroup) return [];
    const memberIds = new Set(state.groupMembers.filter((member) => member.groupId === activeGroup.id).map((member) => member.userId));
    return state.users.filter((user) => memberIds.has(user.id));
  }, [activeGroup, state]);

  const todayFeedItems = useMemo((): TodayFeedItem[] => {
    if (!state || !activeTheme) return [];
    return state.posts
      .filter((post) => post.themeId === activeTheme.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((post) => ({
        post,
        user: state.users.find((user) => user.id === post.userId)
      }));
  }, [activeTheme, state]);

  function persist(nextState: MewriState) {
    setState(appService.demo.replaceState(nextState));
  }

  function clearComposerState() {
    revokeObjectUrl(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setPhotoSource(null);
    setCaption("");
    setImageError("");
    setComposerOpen(false);
    cameraInputRef.current && (cameraInputRef.current.value = "");
    libraryInputRef.current && (libraryInputRef.current.value = "");
  }

  function openSourceSheet() {
    setSourceSheetOpen(true);
  }

  function closeSourceSheet() {
    setSourceSheetOpen(false);
  }

  function triggerCameraInput() {
    setPhotoSource("camera");
    closeSourceSheet();
    cameraInputRef.current?.click();
  }

  function triggerLibraryInput() {
    setPhotoSource("library");
    closeSourceSheet();
    libraryInputRef.current?.click();
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>, source: PhotoPickerSource) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const validation = validateLocalImageFile(file);
    if (!validation.ok) {
      setImageError(validation.message);
      if (source === "camera" && validation.code === "missing") {
        setImageError(LOCAL_DEMO_CAMERA_FAILED_MESSAGE);
      }
      return;
    }

    revokeObjectUrl(previewUrl);
    const nextPreviewUrl = URL.createObjectURL(file!);
    setSelectedFile(file!);
    setPreviewUrl(nextPreviewUrl);
    setPhotoSource(source);
    setCaption("");
    setImageError("");
    setComposerOpen(true);
    setView("today");
  }

  async function handleSubmitPost() {
    if (!selectedFile || !activeUser || !activeGroup || !activeTheme || !activeCycle) return;
    if (!isCaptionWithinLimit(caption)) {
      setImageError("キャプションは80文字までです。");
      return;
    }

    setSubmitting(true);
    setImageError("");
    try {
      const imageUrl = await optimizeLocalImage(selectedFile);
      const nextState = appService.commands.submitPost({
        context: {
          currentUserId: activeUser.id,
          requestSource: "browser_demo"
        },
        input: {
          userId: activeUser.id,
          groupId: activeGroup.id,
          themeId: activeTheme.id,
          imageUrl,
          caption: clampCaption(caption)
        }
      });

      setState(nextState);
      clearComposerState();
      setView("today");
      setSubmitNotice(formatPostSubmitSuccessMessage());
    } catch {
      setImageError(LOCAL_DEMO_IMAGE_LOAD_FAILED_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetake() {
    clearComposerState();
    if (photoSource === "camera") {
      triggerCameraInput();
    } else {
      triggerLibraryInput();
    }
  }

  function handleReset() {
    if (!window.confirm(LOCAL_DEMO_RESET_CONFIRM_MESSAGE)) return;
    clearComposerState();
    closeSourceSheet();
    const nextState = appService.demo.reset();
    setState(nextState);
    setSelectedThemeId(nextState.themes.find((theme) => theme.status === "active")?.id ?? nextState.themes[0]?.id ?? "");
    setPostListMode("all");
    setSubmitNotice("");
    setZineGenerateNotice("");
    setView("today");
  }

  function addSamplePosts() {
    if (!state || !activeGroup || !activeUser) return;
    if (!window.confirm(buildAddSamplePostsConfirmMessage(visibleZineThemes.length))) return;

    const now = new Date();
    const samples = visibleZineThemes.flatMap((theme, themeIndex) =>
      [0, 1].map((itemIndex) =>
        createPost({
          userId: activeUser.id,
          groupId: activeGroup.id,
          themeId: theme.id,
          imageUrl: createSampleImageDataUrl(theme.title, themeIndex, itemIndex),
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

  const handleGenerateZine = buildGenerateZineHandler(
    activeCycle!,
    activeGroup!,
    activeUser,
    zineReady,
    publishedZine,
    appService,
    setState,
    setZineGenerateNotice
  );

  if (!state || !activeGroup || !activeCycle || !activeTheme) {
    return (
      <main className="sevenBamShell">
        <section className="sevenBamLoadPanel">
          <p className="sevenBamBrand">{SEVEN_BAM_BRAND}</p>
          <h1>読み込み中</h1>
          <p role={loadNotice ? "alert" : "status"} aria-live={loadNotice ? "assertive" : "polite"}>
            {loadNotice || "ローカル状態を読み込んでいます。"}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="sevenBamShell">
      <a className="skipLink" href="#seven-bam-main">
        メインコンテンツへスキップ
      </a>

      <header className="sevenBamTopBar" role="banner">
        <span className="sevenBamBrandCompact">{SEVEN_BAM_BRAND}</span>
        <div className="sevenBamTopTools">
          <button className="sevenBamGhostButton compactOnly" type="button" aria-label="各テーマにサンプル投稿を追加" onClick={addSamplePosts}>
            サンプル投入
          </button>
          <button className="sevenBamGhostButton" type="button" aria-label="デモを初期状態に戻す" onClick={handleReset}>
            リセット
          </button>
        </div>
      </header>

      <div id="seven-bam-main" className={`sevenBamView sevenBamView--${view}`}>
        {view === "today" && !composerOpen ? (
          <TodayScreen
            groupName={activeGroup.name}
            members={groupMembers}
            themeTitle={activeTheme.title}
            themeDescription={activeTheme.description}
            submitNotice={submitNotice}
            onOpenPhotoSource={openSourceSheet}
            onOpenFeed={() => setView("feed")}
            cameraButtonRef={cameraButtonRef}
          />
        ) : null}

        {view === "feed" ? <TodayFeed items={todayFeedItems} onBackToToday={() => setView("today")} /> : null}

        {composerOpen && previewUrl && photoSource ? (
          <PhotoComposer
            open={composerOpen}
            themeTitle={activeTheme.title}
            previewUrl={previewUrl}
            source={photoSource}
            caption={caption}
            errorMessage={imageError}
            submitting={submitting}
            onCaptionChange={setCaption}
            onSubmit={handleSubmitPost}
            onRetake={handleRetake}
            onCancel={() => {
              clearComposerState();
              setView("today");
              cameraButtonRef.current?.focus();
            }}
          />
        ) : null}
      </div>

      <input
        ref={cameraInputRef}
        className="sevenBamHiddenInput"
        type="file"
        accept="image/*"
        capture="environment"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => void handleFileSelected(event, "camera")}
      />
      <input
        ref={libraryInputRef}
        className="sevenBamHiddenInput"
        type="file"
        accept="image/*"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => void handleFileSelected(event, "library")}
      />

      <PhotoSourceSheet
        open={sourceSheetOpen}
        onClose={closeSourceSheet}
        onPickCamera={triggerCameraInput}
        onPickLibrary={triggerLibraryInput}
        returnFocusRef={cameraButtonRef}
      />

      <footer className="sevenBamFooter">
        <ZineToolsPanel
          state={state}
          activeCycle={activeCycle}
          activeGroup={activeGroup}
          cycleThemes={cycleThemes}
          visibleZineThemes={visibleZineThemes}
          cyclePosts={cyclePosts}
          visiblePosts={visiblePosts}
          postListMode={postListMode}
          effectiveSelectedThemeId={effectiveSelectedThemeId}
          selectedTheme={selectedTheme}
          targetPostCount={targetPostCount}
          zineReady={zineReady}
          publishedZine={publishedZine}
          publishedPages={publishedPages}
          zineGenerateNotice={zineGenerateNotice}
          onSelectTheme={(themeId) => {
            setSelectedThemeId(themeId);
            setPostListMode("theme");
          }}
          onShowAllPosts={() => setPostListMode("all")}
          onGenerateZine={handleGenerateZine}
        />
        <LocalDemoSafetyNotice />
        <LocalDemoFeedbackNote />
      </footer>
    </main>
  );
}
