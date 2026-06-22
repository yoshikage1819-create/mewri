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
  formatFeedPanelAnnouncement,
  formatPanelAnnouncement,
  formatPostSubmitSuccessMessage,
  formatTodayPanelAnnouncement,
  FUTURE_FEATURES_SECTION_LABEL,
  isCaptionWithinLimit,
  isSwipeBlockedStartTarget,
  isSwipeStartNearHorizontalEdge,
  LOCAL_DEMO_CAMERA_FAILED_MESSAGE,
  LOCAL_DEMO_GROUP_SWITCH_UNAVAILABLE,
  LOCAL_DEMO_IMAGE_LOAD_FAILED_MESSAGE,
  LOCAL_DEMO_RESET_CONFIRM_MESSAGE,
  LOCAL_DEMO_UNAVAILABLE_FEATURE_NOTICE,
  optimizeLocalImage,
  prefersReducedMotion,
  resolvePanelTransitionMs,
  resolveSwipeGesture,
  resolveSwipeTargetPanel,
  revokeObjectUrl,
  SEVEN_BAM_BRAND,
  UNIMPLEMENTED_FEATURES_SECTION_LABEL,
  type AppPanel,
  type PhotoPickerSource,
  validateLocalImageFile
} from "./local-demo-ui";
import { buildGenerateZineHandler, isZineReadyForCycle, ZineToolsPanel } from "./seven-bam-zine-tools";
import {
  FeedPanelTopBar,
  GestureGuide,
  GroupsPanel,
  PhotoComposer,
  PhotoSourceSheet,
  ProfilePanel,
  TodayFeed,
  type TodayFeedItem,
  TodayScreen,
  useGestureGuideVisible
} from "./seven-bam-ui";

const appService: MewriAppService = createBrowserLocalMewriAppService();

export default function HomePage() {
  const [state, setState] = useState<MewriState | null>(null);
  const [appPanel, setAppPanel] = useState<AppPanel>("today");
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
  const [panelAnimating, setPanelAnimating] = useState(false);
  const [panelAnnouncement, setPanelAnnouncement] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [groupsSwitchNotice, setGroupsSwitchNotice] = useState("");
  const [gestureGuideVisible, dismissGestureGuide] = useGestureGuideVisible();

  const cameraButtonRef = useRef<HTMLButtonElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const profileBackRef = useRef<HTMLButtonElement>(null);
  const groupsBackRef = useRef<HTMLButtonElement>(null);
  const feedBackRef = useRef<HTMLButtonElement>(null);
  const feedPanelRef = useRef<HTMLDivElement>(null);
  const hasNavigatedRef = useRef(false);
  const swipePointerIdRef = useRef<number | null>(null);
  const swipeStartRef = useRef({ x: 0, y: 0 });
  const swipeStartBlockedRef = useRef(false);
  const panelTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (panelTransitionTimerRef.current) clearTimeout(panelTransitionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasNavigatedRef.current) {
      if (appPanel !== "today") hasNavigatedRef.current = true;
      return;
    }

    setPanelAnnouncement(formatPanelAnnouncement(appPanel));
    if (appPanel === "profile") profileBackRef.current?.focus();
    else if (appPanel === "groups") groupsBackRef.current?.focus();
    else if (appPanel === "feed") feedBackRef.current?.focus({ preventScroll: true });
    else if (appPanel === "today") cameraButtonRef.current?.focus();
  }, [appPanel]);

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

  const ownPosts = useMemo(() => {
    if (!state || !activeUser) return [];
    return state.posts
      .filter((post) => post.userId === activeUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeUser, state]);

  const gestureBlocked = sourceSheetOpen || composerOpen || panelAnimating;

  function navigateTo(nextPanel: AppPanel) {
    if (gestureBlocked || nextPanel === appPanel) return;
    hasNavigatedRef.current = true;
    setProfileNotice("");
    setGroupsSwitchNotice("");
    setPanelAnimating(true);
    setAppPanel(nextPanel);
    if (panelTransitionTimerRef.current) clearTimeout(panelTransitionTimerRef.current);
    panelTransitionTimerRef.current = setTimeout(() => {
      setPanelAnimating(false);
    }, resolvePanelTransitionMs(prefersReducedMotion()));
  }

  function goToToday() {
    navigateTo("today");
    setPanelAnnouncement(formatTodayPanelAnnouncement());
  }

  function openFeedPanel() {
    navigateTo("feed");
    setPanelAnnouncement(formatFeedPanelAnnouncement());
    requestAnimationFrame(() => {
      feedPanelRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  function beginSwipePointer(event: React.PointerEvent<HTMLElement>) {
    if (gestureBlocked) return;
    if (isSwipeBlockedStartTarget(event.target)) {
      swipeStartBlockedRef.current = true;
      return;
    }
    swipeStartBlockedRef.current = false;
    swipePointerIdRef.current = event.pointerId;
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveSwipePointer(event: React.PointerEvent<HTMLElement>) {
    if (swipePointerIdRef.current !== event.pointerId) return;
  }

  function finishSwipePointer(event: React.PointerEvent<HTMLElement>, panel: AppPanel) {
    if (swipePointerIdRef.current !== event.pointerId) return;
    if (gestureBlocked || swipeStartBlockedRef.current) {
      swipePointerIdRef.current = null;
      return;
    }

    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    const direction = resolveSwipeGesture(
      {
        startX: swipeStartRef.current.x,
        startY: swipeStartRef.current.y,
        endX: event.clientX,
        endY: event.clientY,
        viewportWidth
      },
      {
        nearHorizontalEdge: isSwipeStartNearHorizontalEdge(swipeStartRef.current.x, viewportWidth)
      }
    );
    swipePointerIdRef.current = null;

    if (panel === "feed" && direction === "down" && (feedPanelRef.current?.scrollTop ?? 0) > 0) {
      return;
    }

    const nextPanel = resolveSwipeTargetPanel(panel, direction);
    if (!nextPanel) return;

    if (nextPanel === "feed") {
      openFeedPanel();
      return;
    }
    if (nextPanel === "today" && panel === "feed") {
      goToToday();
      return;
    }
    navigateTo(nextPanel);
  }

  function endSwipePointer(event: React.PointerEvent<HTMLElement>, panel: AppPanel) {
    finishSwipePointer(event, panel);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function cancelSwipePointer(event: React.PointerEvent<HTMLElement>) {
    swipePointerIdRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const todayGestureHandlers = {
    onPointerDown: beginSwipePointer,
    onPointerMove: moveSwipePointer,
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => endSwipePointer(event, "today"),
    onPointerCancel: cancelSwipePointer
  };

  const feedGestureHandlers = {
    onPointerDown: beginSwipePointer,
    onPointerMove: moveSwipePointer,
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => endSwipePointer(event, "feed"),
    onPointerCancel: cancelSwipePointer
  };

  const profileGestureHandlers = {
    onPointerDown: beginSwipePointer,
    onPointerMove: moveSwipePointer,
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => endSwipePointer(event, "profile"),
    onPointerCancel: cancelSwipePointer
  };

  const groupsGestureHandlers = {
    onPointerDown: beginSwipePointer,
    onPointerMove: moveSwipePointer,
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => endSwipePointer(event, "groups"),
    onPointerCancel: cancelSwipePointer
  };

  function showProfileUnavailableNotice() {
    setProfileNotice(LOCAL_DEMO_UNAVAILABLE_FEATURE_NOTICE);
  }

  function showGroupsUnavailableNotice() {
    setGroupsSwitchNotice(LOCAL_DEMO_UNAVAILABLE_FEATURE_NOTICE);
  }

  function showGroupSwitchUnavailableNotice() {
    setGroupsSwitchNotice(LOCAL_DEMO_GROUP_SWITCH_UNAVAILABLE);
  }

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
    setAppPanel("today");
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
      setAppPanel("today");
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
    setProfileNotice("");
    setGroupsSwitchNotice("");
    setAppPanel("today");
    requestAnimationFrame(() => {
      feedPanelRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
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

  if (!state || !activeGroup || !activeCycle || !activeTheme || !activeUser) {
    return (
      <main className="appShell sevenBamShell">
        <section className="appPanel sevenBamLoadPanel">
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
    <main className="appShell sevenBamShell">
      <a className="skipLink" href="#seven-bam-main">
        メインコンテンツへスキップ
      </a>

      <p className="srOnly" role="status" aria-live="polite">
        {panelAnnouncement}
      </p>

      <div
        id="seven-bam-main"
        className={`sevenBamViewPort sevenBamViewPort--${appPanel}${panelAnimating ? " sevenBamViewPort--animating" : ""}`}
      >
        <div
          className="sevenBamViewPanel sevenBamViewPanel--today"
          hidden={appPanel !== "today" || composerOpen}
          inert={appPanel !== "today" || composerOpen || undefined}
          aria-hidden={appPanel !== "today" || composerOpen}
        >
          {appPanel === "today" && !composerOpen ? (
            <>
              {gestureGuideVisible ? <GestureGuide onDismiss={dismissGestureGuide} /> : null}
              <TodayScreen
                currentUser={activeUser}
                groupName={activeGroup.name}
                members={groupMembers}
                themeTitle={activeTheme.title}
                themeDescription={activeTheme.description}
                submitNotice={submitNotice}
                onOpenPhotoSource={openSourceSheet}
                onOpenFeed={openFeedPanel}
                onOpenProfile={() => navigateTo("profile")}
                onOpenGroups={() => navigateTo("groups")}
                gestureDisabled={gestureBlocked}
                gestureHandlers={todayGestureHandlers}
                cameraButtonRef={cameraButtonRef}
              />
            </>
          ) : null}
        </div>

        <div
          ref={feedPanelRef}
          className="sevenBamViewPanel feedPanel appPanel--feed"
          hidden={appPanel !== "feed"}
          inert={appPanel !== "feed" || undefined}
          aria-hidden={appPanel !== "feed"}
          onPointerDown={feedGestureHandlers.onPointerDown}
          onPointerMove={feedGestureHandlers.onPointerMove}
          onPointerUp={feedGestureHandlers.onPointerUp}
          onPointerCancel={feedGestureHandlers.onPointerCancel}
        >
          {appPanel === "feed" ? (
            <>
              <FeedPanelTopBar onReset={handleReset} onAddSamplePosts={addSamplePosts} />
              <TodayFeed
                items={todayFeedItems}
                onBackToToday={goToToday}
                backButtonRef={feedBackRef}
                gestureDisabled={gestureBlocked}
              />
              <details className="sevenBamFutureFeatures">
                <summary>{UNIMPLEMENTED_FEATURES_SECTION_LABEL}</summary>
                <div className="sevenBamFutureFeaturesBody">
                  <LocalDemoSafetyNotice />
                </div>
              </details>
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
              <LocalDemoFeedbackNote />
            </>
          ) : null}
        </div>

        <div
          className="sevenBamViewPanel sevenBamViewPanel--profile"
          hidden={appPanel !== "profile"}
          inert={appPanel !== "profile" || undefined}
          aria-hidden={appPanel !== "profile"}
        >
          {appPanel === "profile" ? (
            <ProfilePanel
              user={activeUser}
              posts={ownPosts}
              unavailableNotice={profileNotice}
              onUnavailableAction={showProfileUnavailableNotice}
              onBackToToday={goToToday}
              backButtonRef={profileBackRef}
              gestureHandlers={profileGestureHandlers}
              gestureDisabled={gestureBlocked}
            />
          ) : null}
        </div>

        <div
          className="sevenBamViewPanel sevenBamViewPanel--groups"
          hidden={appPanel !== "groups"}
          inert={appPanel !== "groups" || undefined}
          aria-hidden={appPanel !== "groups"}
        >
          {appPanel === "groups" ? (
            <GroupsPanel
              currentGroup={activeGroup}
              currentMemberCount={groupMembers.length}
              switchNotice={groupsSwitchNotice}
              onDemoGroupTap={showGroupSwitchUnavailableNotice}
              onUnavailableAction={showGroupsUnavailableNotice}
              onBackToToday={goToToday}
              backButtonRef={groupsBackRef}
              gestureHandlers={groupsGestureHandlers}
              gestureDisabled={gestureBlocked}
            />
          ) : null}
        </div>

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
              setAppPanel("today");
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
    </main>
  );
}
