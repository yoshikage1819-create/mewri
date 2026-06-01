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

export function formatRemainingToday(now: Date = new Date()): string {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const ms = Math.max(0, end.getTime() - now.getTime());
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours <= 0) return `残り${minutes}分`;
  return `残り${hours}時間${minutes}分`;
}

export function escapeSvgText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
