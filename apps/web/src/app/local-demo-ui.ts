export const LOCAL_DEMO_RESET_CONFIRM_MESSAGE = "デモデータを初期状態に戻します。よろしいですか？";

export const SEVEN_BAM_BRAND = "7bam";

export const LOCAL_DEMO_NOTICE_TITLE = "LOCAL DEMO";

export const LOCAL_DEMO_NOTICE_BODY = "この端末内だけに保存されます";

export const LOCAL_DEMO_BANNER_TITLE = LOCAL_DEMO_NOTICE_TITLE;

export const LOCAL_DEMO_BANNER_BODY = LOCAL_DEMO_NOTICE_BODY;

export const LOCAL_DEMO_FEED_NOTICE =
  "ここに表示される投稿は、この端末内のサンプルと投稿です。";

export const LOCAL_DEMO_COMPOSER_NOTICE = "この端末内だけに保存されます";

export const SEVEN_BAM_CAPTION_MAX_CHARS = 80;

export const LOCAL_DEMO_MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const LOCAL_DEMO_IMAGE_UNSUPPORTED_MESSAGE =
  "この形式の写真は使えません。別の写真を選んでください。";

export const LOCAL_DEMO_IMAGE_TOO_LARGE_MESSAGE =
  "写真が大きすぎます。別の写真を選んでください。";

export const LOCAL_DEMO_IMAGE_LOAD_FAILED_MESSAGE =
  "写真を読み込めませんでした。別の写真を選んでください。";

export const LOCAL_DEMO_CAMERA_FAILED_MESSAGE =
  "カメラを開けませんでした。ライブラリから写真を選べます。";

export const LOCAL_DEMO_POST_SUCCESS_MESSAGE =
  "今日を追加しました。この端末内に保存されています。";

export const TODAY_FEED_TITLE = "みんなの今日";

export const TODAY_FEED_EMPTY_TITLE = "まだ今日の投稿はありません。";

export const TODAY_FEED_EMPTY_HINT = "最初の一枚を追加してみましょう。";

export const TODAY_THEME_LABEL = "今日のテーマ";

export const PHOTO_SOURCE_SHEET_TITLE = "写真を追加";

export const PHOTO_SOURCE_CAMERA_LABEL = "カメラで撮影";

export const PHOTO_SOURCE_LIBRARY_LABEL = "ライブラリから選ぶ";

export const PHOTO_SOURCE_CANCEL_LABEL = "キャンセル";

export const PHOTO_COMPOSER_SUBMIT_LABEL = "今日を追加する";

export const PHOTO_COMPOSER_RETAKE_CAMERA_LABEL = "撮り直す";

export const PHOTO_COMPOSER_RESELECT_LIBRARY_LABEL = "選び直す";

export const PHOTO_COMPOSER_CANCEL_LABEL = "キャンセル";

export const VIEW_FEED_LABEL = "みんなの今日を見る";

export const SCROLL_TO_FEED_HINT = "↓ みんなの今日";

export const BACK_TO_TODAY_LABEL = "↑ 今日のテーマへ戻る";

export const POST_CAMERA_BUTTON_LABEL = "写真を投稿する";

export const TODAY_SECTION_ID = "seven-bam-today-section";

export const FEED_SECTION_ID = "seven-bam-feed-section";

export const FUTURE_FEATURES_SECTION_LABEL = "今後の機能";

export const UNIMPLEMENTED_FEATURES_SECTION_LABEL = "未実装機能";

export type AppPanel = "today" | "profile" | "groups" | "feed";

export type HorizontalPanel = Exclude<AppPanel, "feed">;

/** @deprecated use AppPanel */
export type AppView = AppPanel;

export type SwipeDirection = "left" | "right" | "up" | "down" | null;

export const SWIPE_MIN_DISTANCE_PX = 72;

export const SWIPE_EDGE_MARGIN_PX = 28;

export const SWIPE_HORIZONTAL_DOMINANCE_RATIO = 1.25;

export const PANEL_TRANSITION_MS = 300;

export const GESTURE_GUIDE_DISMISSED_KEY = "7bam.local-demo.gesture-guide-dismissed";

export const GESTURE_GUIDE_TEXT = "左：プロフィール / 右：グループ / 上スワイプ：みんなの今日";

export const OPEN_PROFILE_LABEL = "プロフィールを開く";

export const OPEN_GROUPS_LABEL = "グループを開く";

export const LOCAL_DEMO_UNAVAILABLE_FEATURE_NOTICE = "この機能はlocal demoでは利用できません。";

export const LOCAL_DEMO_GROUP_SWITCH_UNAVAILABLE =
  "グループ切り替えは、このlocal demoでは利用できません。";

export const PROFILE_PANEL_TITLE = "プロフィール";

export const GROUPS_PANEL_TITLE = "グループ";

export const PROFILE_EDIT_LABEL = "プロフィールを編集";

export const PROFILE_SETTINGS_LABEL = "設定";

export const GROUPS_CREATE_LABEL = "グループを作成";

export const GROUPS_INVITE_LABEL = "メンバーを招待";

export const PROFILE_POSTS_TITLE = "自分の投稿";

export const PROFILE_FOLLOWING_LABEL = "フォロー中";

export const PROFILE_FOLLOWERS_LABEL = "フォロワー";

export const GROUPS_CURRENT_LABEL = "いまのグループ";

export const GROUPS_JOINED_LABEL = "参加中のグループ（デモ表示）";

export type LocalDemoProfileStats = {
  following: number;
  followers: number;
};

export const LOCAL_DEMO_PROFILE_STATS: LocalDemoProfileStats = {
  following: 12,
  followers: 8
};

export type LocalDemoJoinedGroup = {
  id: string;
  name: string;
  memberCount: number;
  isCurrent?: boolean;
};

export const LOCAL_DEMO_JOINED_GROUPS: readonly LocalDemoJoinedGroup[] = [
  { id: "demo-park-zine", name: "公園ZINE", memberCount: 4, isCurrent: true },
  { id: "demo-morning-cafe", name: "朝カフェ部", memberCount: 6 },
  { id: "demo-walk-notes", name: "散歩ノート", memberCount: 3 }
] as const;

export type SwipePointerSample = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  viewportWidth: number;
};

export type SwipeGestureOptions = {
  blockedStartTarget?: boolean;
  nearHorizontalEdge?: boolean;
};

export function formatPanelAnnouncement(panel: AppPanel): string {
  switch (panel) {
    case "profile":
      return "プロフィールを表示しています";
    case "groups":
      return "グループを表示しています";
    case "feed":
      return "みんなの今日を表示しています";
    default:
      return "今日のテーマを表示しています";
  }
}

/** @deprecated use formatPanelAnnouncement */
export function formatViewAnnouncement(view: AppPanel): string {
  return formatPanelAnnouncement(view);
}

export function formatFeedPanelAnnouncement(): string {
  return "みんなの今日へ移動しました";
}

export function formatTodayPanelAnnouncement(): string {
  return "今日のテーマへ戻りました";
}

/** @deprecated use formatFeedPanelAnnouncement */
export function formatFeedScrollAnnouncement(): string {
  return formatFeedPanelAnnouncement();
}

/** @deprecated use formatTodayPanelAnnouncement */
export function formatTodayScrollAnnouncement(): string {
  return formatTodayPanelAnnouncement();
}

export function swipeDirectionOnTodayPanel(direction: SwipeDirection): AppPanel | null {
  if (direction === "left") return "profile";
  if (direction === "right") return "groups";
  if (direction === "up") return "feed";
  return null;
}

export function swipeDirectionOnFeedPanel(direction: SwipeDirection): AppPanel | null {
  if (direction === "down") return "today";
  return null;
}

export function swipeDirectionOnProfilePanel(direction: SwipeDirection): AppPanel | null {
  if (direction === "right") return "today";
  return null;
}

export function swipeDirectionOnGroupsPanel(direction: SwipeDirection): AppPanel | null {
  if (direction === "left") return "today";
  return null;
}

export function resolveSwipeTargetPanel(panel: AppPanel, direction: SwipeDirection): AppPanel | null {
  switch (panel) {
    case "profile":
      return swipeDirectionOnProfilePanel(direction);
    case "groups":
      return swipeDirectionOnGroupsPanel(direction);
    case "feed":
      return swipeDirectionOnFeedPanel(direction);
    default:
      return swipeDirectionOnTodayPanel(direction);
  }
}

/** @deprecated use resolveSwipeTargetPanel */
export function swipeDirectionToView(direction: SwipeDirection): AppPanel | null {
  return swipeDirectionOnTodayPanel(direction);
}

export function isGestureGuideDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(GESTURE_GUIDE_DISMISSED_KEY) === "1";
}

export function dismissGestureGuide(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GESTURE_GUIDE_DISMISSED_KEY, "1");
}

export function isSwipeBlockedStartTarget(target: EventTarget | null): boolean {
  if (!target || typeof Element === "undefined" || !(target instanceof Element)) return false;
  return Boolean(
    target.closest('button, a, input, select, textarea, [role="dialog"], form, label')
  );
}

export function isSwipeStartNearHorizontalEdge(startX: number, viewportWidth: number): boolean {
  if (viewportWidth <= 0) return false;
  return startX <= SWIPE_EDGE_MARGIN_PX || startX >= viewportWidth - SWIPE_EDGE_MARGIN_PX;
}

export function detectSwipeDirection(sample: SwipePointerSample): SwipeDirection {
  const deltaX = sample.endX - sample.startX;
  const deltaY = sample.endY - sample.startY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absX < SWIPE_MIN_DISTANCE_PX && absY < SWIPE_MIN_DISTANCE_PX) return null;

  if (absX >= SWIPE_MIN_DISTANCE_PX && absX > absY * SWIPE_HORIZONTAL_DOMINANCE_RATIO) {
    if (deltaX < 0) return "left";
    if (deltaX > 0) return "right";
  }

  if (absY >= SWIPE_MIN_DISTANCE_PX && absY > absX * SWIPE_HORIZONTAL_DOMINANCE_RATIO) {
    if (deltaY < 0) return "up";
    if (deltaY > 0) return "down";
  }

  return null;
}

export function resolveSwipeGesture(sample: SwipePointerSample, options: SwipeGestureOptions): SwipeDirection {
  if (options.blockedStartTarget || options.nearHorizontalEdge) return null;
  return detectSwipeDirection(sample);
}

export function resolvePanelTransitionMs(prefersReduced: boolean): number {
  return prefersReduced ? 0 : PANEL_TRANSITION_MS;
}

export const FORBIDDEN_SHARED_COPY_PATTERNS = [
  "グループに投稿",
  "友達に共有",
  "みんなに送る",
  "グループに投稿されました",
  "友達に共有されました",
  "みんなに届きました"
] as const;

export const LOCAL_DEMO_SAFETY_SUMMARY = "この画面の範囲と注意（開発・確認用）";

export const LOCAL_DEMO_SAFETY_SUMMARY_ID = "local-demo-safety-summary";

export const LOCAL_DEMO_SAFETY_PANEL_ID = "local-demo-safety-panel";

export type LocalDemoSafetyPoint = {
  title: string;
  body: string;
};

export const LOCAL_DEMO_SAFETY_POINTS: readonly LocalDemoSafetyPoint[] = [
  {
    title: "ローカルデモです",
    body: "本番の Mewri ではなく、この端末のブラウザで試す画面です。"
  },
  {
    title: "本番・参加者データは使いません",
    body: "本番のデータや、非公開ベータの参加者データは使わず、ここにも入力しないでください。"
  },
  {
    title: "秘密情報は入力しない",
    body: "パスワード、トークン、魔法のリンク、本番やステージングのログイン情報は入力しないでください。"
  },
  {
    title: "本番に出す前に Codex 確認",
    body: "ログイン、データベース、写真のクラウド保存、API の安全設計、デプロイ・本番公開は、Codex による確認後に進みます。"
  }
] as const;

export const LOCAL_DEMO_FEEDBACK_MAX_CHARS = 500;

export const LOCAL_DEMO_FEEDBACK_INTRO =
  "ここに書いた内容は、この端末の画面にだけ表示されます。送信やサーバーへの保存はされません。ページを再読み込みすると消えます。";

export const LOCAL_DEMO_FEEDBACK_LABEL = "感想・改善のメモ（任意）";

export const LOCAL_DEMO_FEEDBACK_PLACEHOLDER =
  "例：写真の選び方がわかりやすかった／ボタンの文字が小さく感じた";

export const LOCAL_DEMO_FEEDBACK_CLEAR_LABEL = "メモを消す";

export const LOCAL_DEMO_FEEDBACK_SECTION_LABEL = "デモの感想メモ";

export const LOCAL_DEMO_FEEDBACK_INTRO_ID = "local-demo-feedback-intro";

export const LOCAL_DEMO_FEEDBACK_TEXTAREA_ID = "local-demo-feedback-textarea";

export const LOCAL_DEMO_FEEDBACK_CHAR_COUNT_ID = "local-demo-feedback-char-count";

export const PHOTO_SOURCE_SHEET_ID = "seven-bam-photo-source-sheet";

export const PHOTO_SOURCE_SHEET_TITLE_ID = "seven-bam-photo-source-title";

export type PhotoPickerSource = "camera" | "library";

export type LocalImageValidationResult =
  | { ok: true }
  | { ok: false; message: string; code: "missing" | "unsupported" | "too_large" };

export function formatFeedbackCharCount(length: number, maxChars: number): string {
  const safeLength = Math.max(0, Math.min(length, maxChars));
  return `入力文字数 ${safeLength}文字 / 最大${maxChars}文字`;
}

export function isAllowedLocalImageMime(mimeType: string): boolean {
  const normalized = mimeType.trim().toLowerCase();
  if (!normalized.startsWith("image/")) return false;
  if (normalized === "image/svg+xml") return false;
  return true;
}

export function validateLocalImageFile(file: File | undefined | null): LocalImageValidationResult {
  if (!file) {
    return { ok: false, message: LOCAL_DEMO_IMAGE_LOAD_FAILED_MESSAGE, code: "missing" };
  }
  if (!isAllowedLocalImageMime(file.type)) {
    return { ok: false, message: LOCAL_DEMO_IMAGE_UNSUPPORTED_MESSAGE, code: "unsupported" };
  }
  if (file.size > LOCAL_DEMO_MAX_IMAGE_BYTES) {
    return { ok: false, message: LOCAL_DEMO_IMAGE_TOO_LARGE_MESSAGE, code: "too_large" };
  }
  return { ok: true };
}

export function clampCaption(value: string, maxChars = SEVEN_BAM_CAPTION_MAX_CHARS): string {
  return value.slice(0, maxChars);
}

export function isCaptionWithinLimit(value: string, maxChars = SEVEN_BAM_CAPTION_MAX_CHARS): boolean {
  return value.length <= maxChars;
}

export function containsForbiddenSharedCopy(value: string): boolean {
  return FORBIDDEN_SHARED_COPY_PATTERNS.some((pattern) => value.includes(pattern));
}

export function getMemberInitials(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function formatPostTime(createdAt: string, now = new Date()): string | null {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;
  const diffMs = now.getTime() - created.getTime();
  if (diffMs < 0) return null;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return created.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export type PostListMode = "all" | "theme";

export function formatPostListKicker(mode: PostListMode, themeTitle?: string): string {
  return mode === "all" ? "全枚" : `— ${themeTitle?.trim() || "未設定"}`;
}

export function formatThemePostCount(count: number): string {
  return `${Math.max(0, count)}`;
}

export function formatVolStamp(cycleTitle: string, dayIndex: number): string {
  const cycle = cycleTitle.trim() || "ISSUE 01";
  const day = dayIndex < 0 ? "TODAY" : `DAY ${String(dayIndex + 1).padStart(2, "0")}`;
  return `${cycle.toUpperCase()} · ${day}`;
}

export function formatEditionImprint(groupName: string, cycleTitle: string): string {
  const group = groupName.trim() || "GROUP";
  const cycle = cycleTitle.trim() || "ISSUE 01";
  return `${group} / ${cycle} / PRIVATE ZINE`;
}

export function formatIssueProgressNote(postCount: number, targetPostCount: number): string {
  if (postCount === 0) {
    return "白紙の号。まずは1枚、今日のページに答えてください。";
  }
  const remaining = Math.max(0, targetPostCount - postCount);
  if (remaining === 0) {
    return `${postCount}枚が並びました。この号を製本できます。`;
  }
  return `${postCount}枚。あと${remaining}枚で一冊になります。`;
}

/** @deprecated use formatEditionImprint */
export function formatPublicationColophon(groupName: string, cycleTitle: string): string {
  return formatEditionImprint(groupName, cycleTitle);
}

export function formatTodayThemeDayLabel(dayIndex: number): string {
  if (dayIndex < 0) return "今日";
  return `${dayIndex + 1}日目`;
}

export function formatTrustedGroupCue(groupName: string): string {
  const name = groupName.trim() || "グループ";
  return `${name} · この端末だけのデモ`;
}

export function formatEmptyPostListTitle(mode: PostListMode, themeTitle?: string): string {
  if (mode === "theme") {
    const title = themeTitle?.trim() || "このテーマ";
    return `「${title}」はまだ空です`;
  }
  return "プルーフシートは空です";
}

export function formatEmptyPostListHint(mode: PostListMode): string {
  if (mode === "theme") {
    return "上の「今日」から、1枚足してみてください。";
  }
  return "今日のページに写真を載せると、ここに並びます。";
}

export function formatEmptyPostListMessage(mode: PostListMode, themeTitle?: string): string {
  return `${formatEmptyPostListTitle(mode, themeTitle)} ${formatEmptyPostListHint(mode)}`;
}

export const ZINE_EMPTY_TITLE = "まだ製本されていません";

export const ZINE_EMPTY_HINT = "写真が集まったら、この号を一冊にして読み返せます。";

export function calcLocalImageScale(naturalWidth: number, naturalHeight: number, maxEdge = 1280): number {
  if (naturalWidth <= 0 || naturalHeight <= 0) return 1;
  return Math.min(1, maxEdge / Math.max(naturalWidth, naturalHeight));
}

export function buildAddSamplePostsConfirmMessage(themeCount: number): string {
  const postCount = Math.max(0, themeCount) * 2;
  return `各テーマにサンプル投稿を2件ずつ追加します（合計${postCount}件）。よろしいですか？`;
}

export function buildGenerateZineConfirmMessage(cycleTitle: string, replacesExisting = false): string {
  if (replacesExisting) {
    return `「${cycleTitle}」のZINEを作り直します。いま表示中のZINEは置き換わります。よろしいですか？`;
  }
  return `「${cycleTitle}」のZINEを生成します。投稿から1冊にまとめます。よろしいですか？`;
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString("ja-JP", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
}

export function calcReadinessPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function formatZineRemainingHeadline(remainingPosts: number): string {
  return remainingPosts === 0 ? "製本できます" : `あと${remainingPosts}枚で製本`;
}

export function formatZineGenerateBlockedHint(remainingPosts: number, zineReady: boolean): string | null {
  if (zineReady || remainingPosts <= 0) return null;
  return `あと${remainingPosts}枚で「製本する」が使えます。`;
}

export function formatPostSubmitSuccessMessage(): string {
  return LOCAL_DEMO_POST_SUCCESS_MESSAGE;
}

export function formatRemainingToday(now: Date = new Date()): string {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const ms = Math.max(0, end.getTime() - now.getTime());
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours <= 0) return `残り${minutes}分`;
  return `残り${hours}時間${minutes}分`;
}

export function resolveScrollBehavior(prefersReducedMotion: boolean): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToElementById(elementId: string): void {
  const target = document.getElementById(elementId);
  if (!target) return;
  target.scrollIntoView({
    behavior: resolveScrollBehavior(prefersReducedMotion()),
    block: "start"
  });
}

export function escapeSvgText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function createSampleImageDataUrl(title: string, themeIndex: number, itemIndex: number): string {
  const palettes = [
    ["#1a1410", "#c44b2a"],
    ["#2a1810", "#8b7355"],
    ["#141820", "#5f7d62"]
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
      <text x="72" y="1120" font-family="Georgia, serif" font-size="42" fill="rgba(255,252,248,0.9)">${text}</text>
      <text x="72" y="1160" font-family="monospace" font-size="22" fill="rgba(255,252,248,0.55)">p.${itemIndex + 1}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function optimizeLocalImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const scale = calcLocalImageScale(image.naturalWidth, image.naturalHeight);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable.");
        context.fillStyle = "#ffffff";
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

export function revokeObjectUrl(url: string | null | undefined): void {
  if (!url || !url.startsWith("blob:")) return;
  URL.revokeObjectURL(url);
}
