import type { ID, Theme, ZineCycle } from "./models";

const themeBank = [
  {
    title: "帰り道の青",
    description: "今日の移動の中で見つけた青を一枚だけ残す。"
  },
  {
    title: "まだ明るい夜",
    description: "夜になる前の光、空気、場所を撮る。"
  },
  {
    title: "今日の机",
    description: "作業、食事、休憩。今日の机の上にある時間を撮る。"
  },
  {
    title: "雨のあと",
    description: "濡れた道、窓、靴、空。雨が残したものを探す。"
  },
  {
    title: "駅までの途中",
    description: "目的地に着く前の、いつもは通り過ぎる色を撮る。"
  },
  {
    title: "なんとなく残したいもの",
    description: "理由はまだ言えないけれど、消える前に置いておきたいもの。"
  }
];

export function createOptionAThreeDayCycle(params: {
  groupId: ID;
  cycleIndex: number;
  startDate: Date;
  now: Date;
}): { cycle: ZineCycle; themes: Theme[] } {
  const createdAt = params.now.toISOString();
  const start = startOfDay(params.startDate);
  const end = addDays(start, 2);
  const cycleId = `cycle_${params.groupId}_${formatDate(start)}`;

  const cycle: ZineCycle = {
    id: cycleId,
    groupId: params.groupId,
    title: `Issue ${String(params.cycleIndex).padStart(2, "0")}`,
    startDate: formatDate(start),
    endDate: formatDate(end),
    status: "active",
    createdAt,
    updatedAt: createdAt
  };

  const themes = [0, 1, 2].map((offset) => {
    const themeDate = addDays(start, offset);
    const seed = (params.cycleIndex * 3 + offset) % themeBank.length;
    const theme = themeBank[seed];
    const status = getThemeStatus(themeDate, params.now);

    return {
      id: `theme_${cycleId}_${offset + 1}`,
      groupId: params.groupId,
      zineCycleId: cycleId,
      title: theme.title,
      description: theme.description,
      themeDate: formatDate(themeDate),
      source: "ai",
      status,
      createdAt
    } satisfies Theme;
  });

  return { cycle, themes };
}

export function getThemeStatus(themeDate: Date, now: Date): Theme["status"] {
  const theme = startOfDay(themeDate).getTime();
  const today = startOfDay(now).getTime();
  if (theme < today) return "closed";
  if (theme === today) return "active";
  return "scheduled";
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
