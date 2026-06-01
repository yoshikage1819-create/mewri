export const LOCAL_DEMO_RESET_CONFIRM_MESSAGE = "デモデータを初期状態に戻します。よろしいですか？";

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
