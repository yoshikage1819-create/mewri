import { describe, expect, it } from "vitest";
import {
  BACK_TO_TODAY_LABEL,
  buildAddSamplePostsConfirmMessage,
  buildGenerateZineConfirmMessage,
  calcLocalImageScale,
  calcReadinessPercent,
  clampCaption,
  containsForbiddenSharedCopy,
  createSampleImageDataUrl,
  detectSwipeDirection,
  escapeSvgText,
  formatEmptyPostListHint,
  formatEmptyPostListMessage,
  formatEmptyPostListTitle,
  formatFullDate,
  formatPostSubmitSuccessMessage,
  formatPostTime,
  formatRemainingToday,
  formatTodayThemeDayLabel,
  formatTrustedGroupCue,
  FEED_SECTION_ID,
  formatFeedPanelAnnouncement,
  formatFeedScrollAnnouncement,
  formatPanelAnnouncement,
  formatTodayPanelAnnouncement,
  formatTodayScrollAnnouncement,
  FUTURE_FEATURES_SECTION_LABEL,
  UNIMPLEMENTED_FEATURES_SECTION_LABEL,
  resolveSwipeTargetPanel,
  SCROLL_TO_FEED_HINT,
  swipeDirectionOnFeedPanel,
  swipeDirectionOnGroupsPanel,
  swipeDirectionOnProfilePanel,
  swipeDirectionOnTodayPanel,
  TODAY_SECTION_ID,
  formatZineGenerateBlockedHint,
  formatZineRemainingHeadline,
  formatFeedbackCharCount,
  formatEditionImprint,
  formatIssueProgressNote,
  formatPostListKicker,
  formatPublicationColophon,
  formatThemePostCount,
  formatVolStamp,
  FORBIDDEN_SHARED_COPY_PATTERNS,
  GESTURE_GUIDE_DISMISSED_KEY,
  GESTURE_GUIDE_TEXT,
  getMemberInitials,
  isAllowedLocalImageMime,
  isCaptionWithinLimit,
  isSwipeBlockedStartTarget,
  isSwipeStartNearHorizontalEdge,
  LOCAL_DEMO_BANNER_BODY,
  LOCAL_DEMO_BANNER_TITLE,
  LOCAL_DEMO_CAMERA_FAILED_MESSAGE,
  LOCAL_DEMO_COMPOSER_NOTICE,
  LOCAL_DEMO_FEED_NOTICE,
  LOCAL_DEMO_FEEDBACK_CHAR_COUNT_ID,
  LOCAL_DEMO_FEEDBACK_INTRO,
  LOCAL_DEMO_FEEDBACK_MAX_CHARS,
  LOCAL_DEMO_FEEDBACK_TEXTAREA_ID,
  LOCAL_DEMO_GROUP_SWITCH_UNAVAILABLE,
  LOCAL_DEMO_IMAGE_TOO_LARGE_MESSAGE,
  LOCAL_DEMO_IMAGE_UNSUPPORTED_MESSAGE,
  LOCAL_DEMO_JOINED_GROUPS,
  LOCAL_DEMO_MAX_IMAGE_BYTES,
  LOCAL_DEMO_NOTICE_BODY,
  LOCAL_DEMO_NOTICE_TITLE,
  LOCAL_DEMO_POST_SUCCESS_MESSAGE,
  LOCAL_DEMO_PROFILE_STATS,
  LOCAL_DEMO_SAFETY_PANEL_ID,
  LOCAL_DEMO_SAFETY_POINTS,
  LOCAL_DEMO_SAFETY_SUMMARY,
  LOCAL_DEMO_SAFETY_SUMMARY_ID,
  LOCAL_DEMO_RESET_CONFIRM_MESSAGE,
  LOCAL_DEMO_UNAVAILABLE_FEATURE_NOTICE,
  PHOTO_COMPOSER_RESELECT_LIBRARY_LABEL,
  PHOTO_COMPOSER_RETAKE_CAMERA_LABEL,
  PHOTO_COMPOSER_SUBMIT_LABEL,
  PHOTO_SOURCE_CAMERA_LABEL,
  PHOTO_SOURCE_CANCEL_LABEL,
  PHOTO_SOURCE_LIBRARY_LABEL,
  PHOTO_SOURCE_SHEET_TITLE,
  resolveScrollBehavior,
  resolveSwipeGesture,
  revokeObjectUrl,
  SEVEN_BAM_BRAND,
  SEVEN_BAM_CAPTION_MAX_CHARS,
  SWIPE_MIN_DISTANCE_PX,
  swipeDirectionToView,
  TODAY_FEED_EMPTY_HINT,
  TODAY_FEED_EMPTY_TITLE,
  TODAY_FEED_TITLE,
  validateLocalImageFile,
  VIEW_FEED_LABEL,
  ZINE_EMPTY_HINT,
  ZINE_EMPTY_TITLE
} from "./local-demo-ui";

describe("7bam brand", () => {
  it("uses 7bam as the display brand", () => {
    expect(SEVEN_BAM_BRAND).toBe("7bam");
    expect(SEVEN_BAM_BRAND).not.toBe("7bum");
  });

  it("does not rename internal Mewri technical names in helpers", () => {
    expect(formatEditionImprint("公園ZINE", "春の号")).toContain("PRIVATE ZINE");
  });
});

describe("local demo boundary copy", () => {
  it("shows LOCAL DEMO notice", () => {
    expect(LOCAL_DEMO_NOTICE_TITLE).toBe("LOCAL DEMO");
    expect(LOCAL_DEMO_NOTICE_BODY).toContain("この端末内");
    expect(LOCAL_DEMO_BANNER_TITLE).toBe(LOCAL_DEMO_NOTICE_TITLE);
    expect(LOCAL_DEMO_BANNER_BODY).toBe(LOCAL_DEMO_NOTICE_BODY);
  });

  it("avoids shared-success wording", () => {
    const publicCopy = [
      LOCAL_DEMO_POST_SUCCESS_MESSAGE,
      PHOTO_COMPOSER_SUBMIT_LABEL,
      LOCAL_DEMO_FEED_NOTICE,
      LOCAL_DEMO_COMPOSER_NOTICE,
      formatPostSubmitSuccessMessage()
    ].join(" ");
    expect(containsForbiddenSharedCopy(publicCopy)).toBe(false);
    expect(FORBIDDEN_SHARED_COPY_PATTERNS.every((pattern) => !publicCopy.includes(pattern))).toBe(true);
  });
});

describe("photo source copy", () => {
  it("labels camera and library choices", () => {
    expect(PHOTO_SOURCE_SHEET_TITLE).toBe("写真を追加");
    expect(PHOTO_SOURCE_CAMERA_LABEL).toBe("カメラで撮影");
    expect(PHOTO_SOURCE_LIBRARY_LABEL).toBe("ライブラリから選ぶ");
    expect(PHOTO_SOURCE_CANCEL_LABEL).toBe("キャンセル");
  });
});

describe("composer copy", () => {
  it("supports optional caption up to 80 chars", () => {
    expect(SEVEN_BAM_CAPTION_MAX_CHARS).toBe(80);
    expect(isCaptionWithinLimit("a".repeat(80))).toBe(true);
    expect(isCaptionWithinLimit("a".repeat(81))).toBe(false);
    expect(clampCaption("a".repeat(90))).toHaveLength(80);
  });

  it("uses retake/reselect labels", () => {
    expect(PHOTO_COMPOSER_RETAKE_CAMERA_LABEL).toBe("撮り直す");
    expect(PHOTO_COMPOSER_RESELECT_LIBRARY_LABEL).toBe("選び直す");
    expect(PHOTO_COMPOSER_SUBMIT_LABEL).toBe("今日を追加する");
  });
});

describe("validateLocalImageFile", () => {
  it("rejects unsupported MIME types", () => {
    const svg = new File(["<svg></svg>"], "icon.svg", { type: "image/svg+xml" });
    const result = validateLocalImageFile(svg);
    expect(result).toMatchObject({ ok: false, code: "unsupported" });
    if (!result.ok) {
      expect(result.message).toBe(LOCAL_DEMO_IMAGE_UNSUPPORTED_MESSAGE);
    }
  });

  it("rejects oversized files", () => {
    const file = new File([new Uint8Array(LOCAL_DEMO_MAX_IMAGE_BYTES + 1)], "big.jpg", { type: "image/jpeg" });
    const result = validateLocalImageFile(file);
    expect(result).toMatchObject({ ok: false, code: "too_large" });
    if (!result.ok) {
      expect(result.message).toBe(LOCAL_DEMO_IMAGE_TOO_LARGE_MESSAGE);
    }
  });

  it("accepts a normal jpeg file", () => {
    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    expect(validateLocalImageFile(file)).toEqual({ ok: true });
  });

  it("handles missing files safely", () => {
    expect(validateLocalImageFile(undefined)).toMatchObject({ ok: false, code: "missing" });
  });
});

describe("feed copy", () => {
  it("uses vertical feed labels and empty state", () => {
    expect(TODAY_FEED_TITLE).toBe("みんなの今日");
    expect(TODAY_FEED_EMPTY_TITLE).toContain("まだ今日の投稿はありません");
    expect(TODAY_FEED_EMPTY_HINT).toContain("最初の一枚");
    expect(VIEW_FEED_LABEL).toBe("みんなの今日を見る");
    expect(BACK_TO_TODAY_LABEL).toBe("↑ 今日のテーマへ戻る");
    expect(LOCAL_DEMO_FEED_NOTICE).toContain("この端末内");
  });
});

describe("post success copy", () => {
  it("states device-only storage", () => {
    expect(formatPostSubmitSuccessMessage()).toBe(LOCAL_DEMO_POST_SUCCESS_MESSAGE);
    expect(LOCAL_DEMO_POST_SUCCESS_MESSAGE).toContain("この端末内");
  });
});

describe("camera failure copy", () => {
  it("suggests library fallback", () => {
    expect(LOCAL_DEMO_CAMERA_FAILED_MESSAGE).toContain("ライブラリ");
  });
});

describe("formatFeedbackCharCount", () => {
  it("shows current and max length in Japanese", () => {
    expect(formatFeedbackCharCount(12, LOCAL_DEMO_FEEDBACK_MAX_CHARS)).toBe("入力文字数 12文字 / 最大500文字");
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
    expect(combined).toContain("Codex");
  });
});

describe("formatPostListKicker", () => {
  it("labels the all-posts view", () => {
    expect(formatPostListKicker("all")).toBe("全枚");
  });
});

describe("formatVolStamp", () => {
  it("combines cycle title and day index", () => {
    expect(formatVolStamp("春の号", 2)).toBe("春の号 · DAY 03");
  });
});

describe("formatIssueProgressNote", () => {
  it("describes a blank issue", () => {
    expect(formatIssueProgressNote(0, 6)).toContain("白紙");
  });
});

describe("formatEditionImprint", () => {
  it("combines group, cycle, and private zine label", () => {
    expect(formatEditionImprint("公園ZINE", "春の号")).toBe("公園ZINE / 春の号 / PRIVATE ZINE");
  });
});

describe("formatPublicationColophon", () => {
  it("delegates to formatEditionImprint", () => {
    expect(formatPublicationColophon("公園ZINE", "春の号")).toBe(formatEditionImprint("公園ZINE", "春の号"));
  });
});

describe("formatThemePostCount", () => {
  it("shows numeric count only", () => {
    expect(formatThemePostCount(3)).toBe("3");
  });
});

describe("formatTodayThemeDayLabel", () => {
  it("shows one-based day labels", () => {
    expect(formatTodayThemeDayLabel(0)).toBe("1日目");
  });
});

describe("formatTrustedGroupCue", () => {
  it("names the group and states device-only demo", () => {
    expect(formatTrustedGroupCue("公園ZINE")).toBe("公園ZINE · この端末だけのデモ");
  });
});

describe("formatEmptyPostList copy", () => {
  it("guides first-time posting in the all-posts view", () => {
    expect(formatEmptyPostListTitle("all")).toBe("プルーフシートは空です");
    expect(formatEmptyPostListHint("all")).toContain("今日のページ");
    expect(formatEmptyPostListMessage("all")).toContain("プルーフシートは空です");
  });
});

describe("ZINE empty copy", () => {
  it("uses editorial bind language", () => {
    expect(ZINE_EMPTY_TITLE).toContain("製本");
    expect(ZINE_EMPTY_HINT).toContain("一冊");
  });
});

describe("calcLocalImageScale", () => {
  it("downscales images larger than the max edge", () => {
    expect(calcLocalImageScale(2560, 1280)).toBe(0.5);
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
    expect(buildGenerateZineConfirmMessage("Issue 01")).toContain("生成します");
  });
});

describe("formatFullDate", () => {
  it("formats a date in Japanese locale with the year visible", () => {
    expect(formatFullDate(new Date(2026, 5, 1))).toContain("2026");
  });
});

describe("formatZineRemainingHeadline", () => {
  it("switches to ready copy when no posts remain", () => {
    expect(formatZineRemainingHeadline(0)).toBe("製本できます");
  });
});

describe("formatZineGenerateBlockedHint", () => {
  it("explains how many posts are still needed", () => {
    expect(formatZineGenerateBlockedHint(3, false)).toContain("あと3枚");
  });
});

describe("calcReadinessPercent", () => {
  it("rounds progress and caps at 100", () => {
    expect(calcReadinessPercent(10, 4)).toBe(100);
  });
});

describe("formatRemainingToday", () => {
  it("shows minutes only in the last hour of the day", () => {
    const now = new Date(2026, 5, 1, 23, 45, 0);
    expect(formatRemainingToday(now)).toBe("残り14分");
  });
});

describe("formatPostTime", () => {
  it("returns a short relative label", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const createdAt = new Date("2026-06-01T11:30:00.000Z").toISOString();
    expect(formatPostTime(createdAt, now)).toBe("30分前");
  });
});

describe("getMemberInitials", () => {
  it("derives initials from display names", () => {
    expect(getMemberInitials("Demo User")).toBe("DU");
    expect(getMemberInitials("あかり")).toBe("あか");
  });
});

describe("escapeSvgText", () => {
  it("escapes characters that would break SVG text nodes", () => {
    expect(escapeSvgText(`a & b <c>`)).toBe("a &amp; b &lt;c&gt;");
  });
});

describe("createSampleImageDataUrl", () => {
  it("returns an SVG data URL with the escaped title", () => {
    const url = createSampleImageDataUrl(`Theme <1>`, 0, 0);
    expect(url.startsWith("data:image/svg+xml;charset=UTF-8,")).toBe(true);
  });
});

describe("revokeObjectUrl", () => {
  it("ignores non-blob urls", () => {
    expect(() => revokeObjectUrl("data:image/png;base64,abc")).not.toThrow();
    expect(() => revokeObjectUrl(null)).not.toThrow();
  });
});

describe("panel navigation helpers", () => {
  it("maps today-panel swipes to profile, groups, and feed", () => {
    expect(swipeDirectionOnTodayPanel("left")).toBe("profile");
    expect(swipeDirectionOnTodayPanel("right")).toBe("groups");
    expect(swipeDirectionOnTodayPanel("up")).toBe("feed");
    expect(swipeDirectionOnTodayPanel(null)).toBeNull();
    expect(swipeDirectionToView("left")).toBe("profile");
    expect(swipeDirectionToView("right")).toBe("groups");
    expect(swipeDirectionToView("up")).toBe("feed");
    expect(swipeDirectionToView(null)).toBeNull();
  });

  it("maps feed down swipe to today", () => {
    expect(swipeDirectionOnFeedPanel("down")).toBe("today");
    expect(swipeDirectionOnFeedPanel("up")).toBeNull();
    expect(resolveSwipeTargetPanel("feed", "down")).toBe("today");
  });

  it("maps profile and groups return swipes to today", () => {
    expect(swipeDirectionOnProfilePanel("right")).toBe("today");
    expect(swipeDirectionOnProfilePanel("left")).toBeNull();
    expect(swipeDirectionOnGroupsPanel("left")).toBe("today");
    expect(swipeDirectionOnGroupsPanel("right")).toBeNull();
  });

  it("resolves swipe targets per active panel", () => {
    expect(resolveSwipeTargetPanel("today", "left")).toBe("profile");
    expect(resolveSwipeTargetPanel("today", "up")).toBe("feed");
    expect(resolveSwipeTargetPanel("profile", "right")).toBe("today");
    expect(resolveSwipeTargetPanel("groups", "left")).toBe("today");
  });

  it("announces panel changes for screen readers", () => {
    expect(formatPanelAnnouncement("profile")).toContain("プロフィール");
    expect(formatPanelAnnouncement("groups")).toContain("グループ");
    expect(formatPanelAnnouncement("feed")).toContain("みんなの今日");
    expect(formatPanelAnnouncement("today")).toContain("今日のテーマ");
  });

  it("announces feed and today panel transitions", () => {
    expect(formatFeedPanelAnnouncement()).toContain("みんなの今日");
    expect(formatTodayPanelAnnouncement()).toContain("今日のテーマ");
    expect(formatFeedScrollAnnouncement()).toBe(formatFeedPanelAnnouncement());
    expect(formatTodayScrollAnnouncement()).toBe(formatTodayPanelAnnouncement());
    expect(SCROLL_TO_FEED_HINT).toBe("↓ みんなの今日");
    expect(VIEW_FEED_LABEL).toBe("みんなの今日を見る");
    expect(TODAY_SECTION_ID).toBe("seven-bam-today-section");
    expect(FEED_SECTION_ID).toBe("seven-bam-feed-section");
    expect(UNIMPLEMENTED_FEATURES_SECTION_LABEL).toBe("未実装機能");
    expect(FUTURE_FEATURES_SECTION_LABEL).toBe("今後の機能");
  });
});

describe("swipe detection", () => {
  const base = {
    startX: 200,
    startY: 300,
    viewportWidth: 390
  };

  it("detects left swipes with enough horizontal distance", () => {
    expect(
      detectSwipeDirection({
        ...base,
        endX: base.startX - SWIPE_MIN_DISTANCE_PX - 8,
        endY: base.startY + 4
      })
    ).toBe("left");
  });

  it("detects left and right swipes only when horizontal-dominant", () => {
    expect(
      detectSwipeDirection({
        ...base,
        endX: base.startX + SWIPE_MIN_DISTANCE_PX + 8,
        endY: base.startY + 2
      })
    ).toBe("right");
    expect(
      detectSwipeDirection({
        ...base,
        endX: base.startX + 4,
        endY: base.startY - SWIPE_MIN_DISTANCE_PX - 12
      })
    ).toBe("up");
    expect(
      detectSwipeDirection({
        ...base,
        endX: base.startX + 4,
        endY: base.startY + SWIPE_MIN_DISTANCE_PX + 12
      })
    ).toBe("down");
  });

  it("ignores small, diagonal, and upward moves", () => {
    expect(
      detectSwipeDirection({
        ...base,
        endX: base.startX - 20,
        endY: base.startY - 20
      })
    ).toBeNull();
    expect(
      detectSwipeDirection({
        ...base,
        endX: base.startX - 40,
        endY: base.startY - 40
      })
    ).toBeNull();
    expect(
      detectSwipeDirection({
        ...base,
        endX: base.startX + 10,
        endY: base.startY + 10
      })
    ).toBeNull();
  });

  it("ignores swipes that start near horizontal edges", () => {
    expect(isSwipeStartNearHorizontalEdge(20, 390)).toBe(true);
    expect(isSwipeStartNearHorizontalEdge(370, 390)).toBe(true);
    expect(isSwipeStartNearHorizontalEdge(100, 390)).toBe(false);
    expect(isSwipeBlockedStartTarget(null)).toBe(false);

    expect(
      resolveSwipeGesture(
        {
          ...base,
          endX: base.startX - 90,
          endY: base.startY
        },
        { nearHorizontalEdge: true }
      )
    ).toBeNull();
  });
});

describe("profile and groups fixtures", () => {
  it("exposes local-only profile stats", () => {
    expect(LOCAL_DEMO_PROFILE_STATS.following).toBeGreaterThan(0);
    expect(LOCAL_DEMO_PROFILE_STATS.followers).toBeGreaterThan(0);
  });

  it("lists demo joined groups without implying real switching", () => {
    expect(LOCAL_DEMO_JOINED_GROUPS.length).toBeGreaterThan(1);
    expect(LOCAL_DEMO_GROUP_SWITCH_UNAVAILABLE).toContain("local demo");
    expect(LOCAL_DEMO_UNAVAILABLE_FEATURE_NOTICE).toContain("local demo");
  });

  it("stores gesture guide dismissal in a dedicated key", () => {
    expect(GESTURE_GUIDE_DISMISSED_KEY).toBe("7bam.local-demo.gesture-guide-dismissed");
    expect(GESTURE_GUIDE_TEXT).toContain("プロフィール");
    expect(GESTURE_GUIDE_TEXT).toContain("上スワイプ");
  });
});

describe("LOCAL_DEMO_RESET_CONFIRM_MESSAGE", () => {
  it("asks before resetting demo data", () => {
    expect(LOCAL_DEMO_RESET_CONFIRM_MESSAGE).toContain("初期状態");
  });
});
