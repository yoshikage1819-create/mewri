import { describe, expect, it } from "vitest";
import {
  buildAddSamplePostsConfirmMessage,
  buildGenerateZineConfirmMessage,
  calcLocalImageScale,
  calcReadinessPercent,
  createSampleImageDataUrl,
  escapeSvgText,
  formatEmptyPostListMessage,
  formatFullDate,
  formatPostListKicker,
  formatPostSubmitSuccessMessage,
  formatRemainingToday,
  formatZineGenerateBlockedHint,
  formatZineRemainingHeadline,
  formatFeedbackCharCount,
  LOCAL_DEMO_BANNER_BODY,
  LOCAL_DEMO_BANNER_TITLE,
  LOCAL_DEMO_FEEDBACK_CHAR_COUNT_ID,
  LOCAL_DEMO_FEEDBACK_INTRO,
  LOCAL_DEMO_FEEDBACK_MAX_CHARS,
  LOCAL_DEMO_FEEDBACK_TEXTAREA_ID,
  LOCAL_DEMO_SAFETY_PANEL_ID,
  LOCAL_DEMO_SAFETY_SUMMARY_ID,
  LOCAL_DEMO_SAFETY_POINTS,
  LOCAL_DEMO_SAFETY_SUMMARY,
  resolveScrollBehavior
} from "./local-demo-ui";

describe("formatFeedbackCharCount", () => {
  it("shows current and max length in Japanese", () => {
    expect(formatFeedbackCharCount(12, LOCAL_DEMO_FEEDBACK_MAX_CHARS)).toBe("入力文字数 12文字 / 最大500文字");
  });

  it("clamps displayed length to the max", () => {
    expect(formatFeedbackCharCount(999, 500)).toBe("入力文字数 500文字 / 最大500文字");
  });
});

describe("local demo accessibility ids", () => {
  it("uses stable ids for safety and feedback regions", () => {
    expect(LOCAL_DEMO_SAFETY_SUMMARY_ID).toBe("local-demo-safety-summary");
    expect(LOCAL_DEMO_SAFETY_PANEL_ID).toBe("local-demo-safety-panel");
    expect(LOCAL_DEMO_FEEDBACK_TEXTAREA_ID).toBe("local-demo-feedback-textarea");
    expect(LOCAL_DEMO_FEEDBACK_CHAR_COUNT_ID).toBe("local-demo-feedback-char-count");
  });
});

describe("LOCAL_DEMO_BANNER copy", () => {
  it("states local demo and device-only storage", () => {
    expect(LOCAL_DEMO_BANNER_TITLE).toContain("この端末だけ");
    expect(LOCAL_DEMO_BANNER_BODY).toContain("ローカルデモ");
    expect(LOCAL_DEMO_BANNER_BODY).toContain("送信");
  });
});

describe("LOCAL_DEMO_FEEDBACK_INTRO", () => {
  it("states the note is device-only and not sent", () => {
    expect(LOCAL_DEMO_FEEDBACK_INTRO).toContain("この端末");
    expect(LOCAL_DEMO_FEEDBACK_INTRO).toContain("送信");
    expect(LOCAL_DEMO_FEEDBACK_INTRO).toContain("保存");
  });
});

describe("LOCAL_DEMO_SAFETY_POINTS", () => {
  it("covers local demo scope and Codex review expectation", () => {
    const combined = LOCAL_DEMO_SAFETY_POINTS.map((point) => `${point.title} ${point.body}`).join(" ");
    expect(LOCAL_DEMO_SAFETY_SUMMARY).toContain("注意");
    expect(combined).toContain("ローカルデモ");
    expect(combined).toContain("本番");
    expect(combined).toContain("非公開ベータ");
    expect(combined).toContain("パスワード");
    expect(combined).toContain("トークン");
    expect(combined).toContain("ログイン");
    expect(combined).toContain("データベース");
    expect(combined).toContain("API");
    expect(combined).toContain("デプロイ");
    expect(combined).toContain("Codex");
  });
});

describe("formatPostListKicker", () => {
  it("labels the all-posts view", () => {
    expect(formatPostListKicker("all")).toBe("全投稿");
  });

  it("labels a theme filter with the theme title", () => {
    expect(formatPostListKicker("theme", "朝の光")).toBe("テーマ: 朝の光");
  });
});

describe("formatEmptyPostListMessage", () => {
  it("guides first-time posting in the all-posts view", () => {
    expect(formatEmptyPostListMessage("all")).toContain("最初の1枚");
  });

  it("names the filtered theme when a theme has no posts", () => {
    expect(formatEmptyPostListMessage("theme", "公園")).toContain("「公園」");
  });
});

describe("calcLocalImageScale", () => {
  it("does not upscale small images", () => {
    expect(calcLocalImageScale(800, 600)).toBe(1);
  });

  it("downscales images larger than the max edge", () => {
    expect(calcLocalImageScale(2560, 1280)).toBe(0.5);
  });

  it("returns 1 for invalid dimensions", () => {
    expect(calcLocalImageScale(0, 100)).toBe(1);
  });
});

describe("buildAddSamplePostsConfirmMessage", () => {
  it("includes the total sample post count", () => {
    expect(buildAddSamplePostsConfirmMessage(3)).toContain("合計6件");
  });
});

describe("resolveScrollBehavior", () => {
  it("uses instant scroll when reduced motion is preferred", () => {
    expect(resolveScrollBehavior(true)).toBe("auto");
    expect(resolveScrollBehavior(false)).toBe("smooth");
  });
});

describe("buildGenerateZineConfirmMessage", () => {
  it("asks before first-time generation", () => {
    expect(buildGenerateZineConfirmMessage("Issue 01")).toContain("Issue 01");
    expect(buildGenerateZineConfirmMessage("Issue 01")).toContain("生成します");
  });

  it("warns when replacing an existing ZINE", () => {
    expect(buildGenerateZineConfirmMessage("Issue 01", true)).toContain("作り直します");
    expect(buildGenerateZineConfirmMessage("Issue 01", true)).toContain("置き換わります");
  });
});

describe("formatFullDate", () => {
  it("formats a date in Japanese locale with the year visible", () => {
    expect(formatFullDate(new Date(2026, 5, 1))).toContain("2026");
  });
});

describe("formatZineRemainingHeadline", () => {
  it("switches to ready copy when no posts remain", () => {
    expect(formatZineRemainingHeadline(0)).toBe("ZINEを作れます");
    expect(formatZineRemainingHeadline(2)).toBe("あと2枚でZINEを作れます");
  });
});

describe("formatZineGenerateBlockedHint", () => {
  it("returns null when ZINE can be generated", () => {
    expect(formatZineGenerateBlockedHint(0, true)).toBeNull();
  });

  it("explains how many posts are still needed", () => {
    expect(formatZineGenerateBlockedHint(3, false)).toContain("あと3枚");
  });
});

describe("formatPostSubmitSuccessMessage", () => {
  it("includes progress counts", () => {
    expect(formatPostSubmitSuccessMessage(2, 6)).toBe("投稿しました。進行 2/6");
  });
});

describe("calcReadinessPercent", () => {
  it("returns 0 when target is zero or negative", () => {
    expect(calcReadinessPercent(3, 0)).toBe(0);
    expect(calcReadinessPercent(3, -1)).toBe(0);
  });

  it("rounds progress and caps at 100", () => {
    expect(calcReadinessPercent(1, 4)).toBe(25);
    expect(calcReadinessPercent(10, 4)).toBe(100);
  });
});

describe("formatRemainingToday", () => {
  it("shows minutes only in the last hour of the day", () => {
    const now = new Date(2026, 5, 1, 23, 45, 0);
    expect(formatRemainingToday(now)).toBe("残り14分");
  });

  it("shows hours and minutes earlier in the day", () => {
    const now = new Date(2026, 5, 1, 10, 20, 0);
    expect(formatRemainingToday(now)).toBe("残り13時間39分");
  });
});

describe("escapeSvgText", () => {
  it("escapes characters that would break SVG text nodes", () => {
    expect(escapeSvgText(`a & b <c> "d" 'e'`)).toBe("a &amp; b &lt;c&gt; &quot;d&quot; &apos;e&apos;");
  });
});

describe("createSampleImageDataUrl", () => {
  it("returns an SVG data URL with the escaped title", () => {
    const url = createSampleImageDataUrl(`Theme <1>`, 0, 0);
    expect(url.startsWith("data:image/svg+xml;charset=UTF-8,")).toBe(true);
    const decoded = decodeURIComponent(url.replace("data:image/svg+xml;charset=UTF-8,", ""));
    expect(decoded).toContain("Theme &lt;1&gt;");
    expect(decoded).not.toContain("Theme <1>");
  });

  it("cycles palette colors by theme index", () => {
    const first = decodeURIComponent(createSampleImageDataUrl("A", 0, 0).split(",")[1]);
    const second = decodeURIComponent(createSampleImageDataUrl("A", 1, 0).split(",")[1]);
    expect(first).toContain("#2563eb");
    expect(second).toContain("#0f766e");
  });
});
