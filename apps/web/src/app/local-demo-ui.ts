export const LOCAL_DEMO_RESET_CONFIRM_MESSAGE = "デモデータを初期状態に戻します。よろしいですか？";

export const LOCAL_DEMO_BANNER_TITLE = "デモ（この端末だけ）";

export const LOCAL_DEMO_BANNER_BODY =
  "これはローカルデモです。写真と投稿はこのブラウザにだけ保存され、送信はされません。別の端末や他の人とは共有されません。";

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

export function formatFeedbackCharCount(length: number, maxChars: number): string {
  const safeLength = Math.max(0, Math.min(length, maxChars));
  return `入力文字数 ${safeLength}文字 / 最大${maxChars}文字`;
}

export type PostListMode = "all" | "theme";

export function formatPostListKicker(mode: PostListMode, themeTitle?: string): string {
  return mode === "all" ? "全投稿" : `テーマ: ${themeTitle?.trim() || "未設定"}`;
}

export function formatEmptyPostListMessage(mode: PostListMode, themeTitle?: string): string {
  if (mode === "theme") {
    const title = themeTitle?.trim() || "このテーマ";
    return `「${title}」にはまだ投稿がありません。上の「参加中のZINE」から写真を追加できます。`;
  }
  return "投稿がまだありません。今日のテーマから最初の1枚を投稿してください。";
}

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
  return remainingPosts === 0 ? "ZINEを作れます" : `あと${remainingPosts}枚でZINEを作れます`;
}

export function formatZineGenerateBlockedHint(remainingPosts: number, zineReady: boolean): string | null {
  if (zineReady || remainingPosts <= 0) return null;
  return `あと${remainingPosts}枚投稿すると「ZINEを作る」が使えるようになります。`;
}

export function formatPostSubmitSuccessMessage(postCount: number, targetPostCount: number): string {
  return `投稿しました。進行 ${postCount}/${targetPostCount}`;
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
