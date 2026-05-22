import { describe, expect, it } from "vitest";
import { createOptionAThreeDayCycle } from "./option-a-cycle";
import { canGenerateZine, generateZineDraft } from "./zine-generator";
import type { Post, Theme } from "./models";

describe("3-day ZineCycle rules", () => {
  it("creates one active 3-day cycle with three daily themes", () => {
    const { cycle, themes } = createOptionAThreeDayCycle({
      groupId: "group_first",
      cycleIndex: 1,
      startDate: new Date("2026-05-20T10:00:00.000Z"),
      now: new Date("2026-05-20T10:00:00.000Z")
    });

    expect(cycle).toMatchObject({
      id: "cycle_group_first_2026-05-20",
      groupId: "group_first",
      title: "Issue 01",
      startDate: "2026-05-20",
      endDate: "2026-05-22",
      status: "active"
    });
    expect(themes).toHaveLength(3);
    expect(themes.map((theme) => theme.themeDate)).toEqual(["2026-05-20", "2026-05-21", "2026-05-22"]);
  });

  it("marks past, current, and future daily themes correctly", () => {
    const { themes } = createOptionAThreeDayCycle({
      groupId: "group_first",
      cycleIndex: 1,
      startDate: new Date("2026-05-20T10:00:00.000Z"),
      now: new Date("2026-05-21T10:00:00.000Z")
    });

    expect(themes.map((theme) => theme.status)).toEqual(["closed", "active", "scheduled"]);
  });
});

describe("ZINE generation rules", () => {
  const themes: Theme[] = [
    makeTheme("theme_1", "2026-05-20"),
    makeTheme("theme_2", "2026-05-21"),
    makeTheme("theme_3", "2026-05-22")
  ];

  it("requires at least four posts before a ZINE can be generated", () => {
    expect(canGenerateZine([makePost("post_1", "theme_1"), makePost("post_2", "theme_2"), makePost("post_3", "theme_3")])).toBe(false);
    expect(
      canGenerateZine([
        makePost("post_1", "theme_1"),
        makePost("post_2", "theme_2"),
        makePost("post_3", "theme_3"),
        makePost("post_4", "theme_1")
      ])
    ).toBe(true);
  });

  it("creates pages in stable chronological post order", () => {
    const posts = [
      makePost("post_late", "theme_2", "2026-05-21T12:00:00.000Z"),
      makePost("post_early", "theme_1", "2026-05-20T08:00:00.000Z"),
      makePost("post_mid", "theme_1", "2026-05-20T09:00:00.000Z"),
      makePost("post_last", "theme_3", "2026-05-22T07:00:00.000Z")
    ];

    const { zine, pages } = generateZineDraft({
      zineCycleId: "cycle_group_first_2026-05-20",
      groupId: "group_first",
      posts,
      themes,
      now: new Date("2026-05-23T00:00:00.000Z")
    });

    expect(zine).toMatchObject({
      id: "zine_cycle_group_first_2026-05-20",
      groupId: "group_first",
      zineCycleId: "cycle_group_first_2026-05-20",
      coverPostId: "post_early",
      status: "published"
    });
    expect(pages.map((page) => page.postId)).toEqual(["post_early", "post_mid", "post_late", "post_last"]);
    expect(pages.map((page) => page.pageNumber)).toEqual([1, 2, 3, 4]);
    expect(pages[0]?.layoutType).toBe("cover");
  });
});

function makeTheme(id: string, themeDate: string): Theme {
  return {
    id,
    groupId: "group_first",
    zineCycleId: "cycle_group_first_2026-05-20",
    title: `Theme ${id}`,
    description: `Description ${id}`,
    themeDate,
    source: "ai",
    status: "active",
    createdAt: "2026-05-20T00:00:00.000Z"
  };
}

function makePost(id: string, themeId: string, createdAt = "2026-05-20T00:00:00.000Z"): Post {
  return {
    id,
    userId: "user_demo",
    groupId: "group_first",
    themeId,
    imageUrl: `https://example.com/${id}.jpg`,
    caption: id,
    visibility: "group_only",
    createdAt,
    updatedAt: createdAt
  };
}
