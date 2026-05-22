import type { Group, GroupMember, Post, Theme, User, Zine, ZineCycle, ZinePage } from "@mewri/core";
import { describe, expect, it } from "vitest";
import { publishZineForCycle, submitPost } from "./mewri-service";
import type { MewriRepository } from "./repository";
import { createSeedState } from "./seed";

export function describeMewriRepositoryContract(
  adapterName: string,
  createRepository: () => MewriRepository
) {
  describe(`${adapterName} MewriRepository contract`, () => {
    it("loads the demo seed state correctly", () => {
      const repository = createRepository();
      const state = repository.load();

      expect(state.groups).toHaveLength(1);
      expect(state.groups[0]).toMatchObject({ id: "group_first", name: "First Mewri" });
      expect(state.users).toHaveLength(1);
      expect(state.zineCycles).toHaveLength(1);
      expect(state.themes).toHaveLength(3);
      expect(state.posts).toEqual([]);
      expect(state.eventLogs[0]).toMatchObject({
        eventName: "seed_created",
        entityType: "zine_cycle",
        groupId: "group_first"
      });
    });

    it("adds posts and event logs through the repository service boundary", () => {
      const repository = createRepository();
      const state = repository.load();
      const user = state.users[0]!;
      const group = state.groups[0]!;
      const theme = state.themes[0]!;

      const nextState = submitPost(repository, {
        userId: user.id,
        groupId: group.id,
        themeId: theme.id,
        imageUrl: "https://example.com/post.jpg",
        caption: "first post",
        now: new Date("2026-05-20T10:00:00.000Z")
      });

      expect(nextState.posts).toHaveLength(1);
      expect(nextState.posts[0]).toMatchObject({
        userId: user.id,
        groupId: group.id,
        themeId: theme.id,
        imageUrl: "https://example.com/post.jpg",
        caption: "first post",
        visibility: "group_only"
      });
      expect(nextState.eventLogs[0]).toMatchObject({
        eventName: "post_created",
        entityType: "post",
        groupId: group.id,
        userId: user.id,
        metadata: { themeId: theme.id }
      });
    });

    it("persists zines and zine pages through repository methods", () => {
      const repository = createRepository();
      const state = repository.load();
      const cycle = state.zineCycles[0]!;
      const group = state.groups[0]!;
      const zine: Zine = {
        id: "zine_test",
        zineCycleId: cycle.id,
        groupId: group.id,
        title: "Test ZINE",
        intro: "Intro",
        coverPostId: "post_1",
        status: "published",
        createdAt: "2026-05-23T00:00:00.000Z",
        publishedAt: "2026-05-23T00:00:00.000Z"
      };
      const pages: ZinePage[] = [
        makePage("page_2", zine.id, "post_2", 2),
        makePage("page_1", zine.id, "post_1", 1)
      ];

      repository.zines.upsert(zine);
      repository.zinePages.replaceForZine(zine.id, pages);

      expect(repository.zines.getByZineCycleId(cycle.id)).toEqual(zine);
      expect(repository.zinePages.listByZineId(zine.id).map((page) => page.id)).toEqual(["page_1", "page_2"]);
    });

    it("upserts domain records by id without duplicating rows", () => {
      const repository = createRepository();
      const state = repository.load();
      const user = state.users[0]!;
      const group = state.groups[0]!;
      const member = state.groupMembers[0]!;
      const cycle = state.zineCycles[0]!;
      const theme = state.themes[0]!;

      const updatedUser: User = { ...user, displayName: "Updated Demo User" };
      const updatedGroup: Group = { ...group, description: "Updated group description" };
      const updatedMember: GroupMember = { ...member, role: "member" };
      const updatedTheme: Theme = { ...theme, status: "closed" };
      const updatedCycle: ZineCycle = { ...cycle, status: "closed" };
      const post = makePost("post_upsert", group.id, theme.id, "2026-05-20T10:00:00.000Z");
      const updatedPost: Post = { ...post, caption: "updated caption" };
      const zine = makeZine("zine_upsert", group.id, cycle.id);
      const updatedZine: Zine = { ...zine, intro: "Updated intro" };
      const page = makePage("page_upsert", zine.id, post.id, 1);
      const updatedPage: ZinePage = { ...page, aiCaption: "Updated caption" };

      repository.users.upsert(updatedUser);
      repository.groups.upsert(updatedGroup);
      repository.groupMembers.upsert(updatedMember);
      repository.themes.upsert(updatedTheme);
      repository.zineCycles.upsert(updatedCycle);
      repository.posts.upsert(post);
      repository.posts.upsert(updatedPost);
      repository.zines.upsert(zine);
      repository.zines.upsert(updatedZine);
      repository.zinePages.upsert(page);
      repository.zinePages.upsert(updatedPage);

      expect(repository.users.list().filter((item) => item.id === user.id)).toHaveLength(1);
      expect(repository.users.getById(user.id)).toMatchObject({ displayName: "Updated Demo User" });
      expect(repository.groups.list().filter((item) => item.id === group.id)).toHaveLength(1);
      expect(repository.groups.getById(group.id)).toMatchObject({ description: "Updated group description" });
      expect(repository.groupMembers.list().filter((item) => item.id === member.id)).toHaveLength(1);
      expect(repository.groupMembers.listByGroupId(group.id)[0]).toMatchObject({ role: "member" });
      expect(repository.themes.list().filter((item) => item.id === theme.id)).toHaveLength(1);
      expect(repository.themes.getById(theme.id)).toMatchObject({ status: "closed" });
      expect(repository.zineCycles.list().filter((item) => item.id === cycle.id)).toHaveLength(1);
      expect(repository.zineCycles.getById(cycle.id)).toMatchObject({ status: "closed" });
      expect(repository.posts.list().filter((item) => item.id === post.id)).toHaveLength(1);
      expect(repository.posts.getById(post.id)).toMatchObject({ caption: "updated caption" });
      expect(repository.zines.list().filter((item) => item.id === zine.id)).toHaveLength(1);
      expect(repository.zines.getById(zine.id)).toMatchObject({ intro: "Updated intro" });
      expect(repository.zinePages.list().filter((item) => item.id === page.id)).toHaveLength(1);
      expect(repository.zinePages.getById(page.id)).toMatchObject({ aiCaption: "Updated caption" });
    });

    it("filters group members, themes, posts, cycles, zines, and event logs by their parent ids", () => {
      const repository = createRepository();
      const state = repository.load();
      const user = state.users[0]!;
      const group = state.groups[0]!;
      const cycle = state.zineCycles[0]!;
      const theme = state.themes[0]!;
      const otherGroup = makeGroup("group_other", user.id);
      const otherCycle = makeCycle("cycle_other", otherGroup.id);
      const otherTheme = makeTheme("theme_other", otherGroup.id, otherCycle.id);
      const groupPost = makePost("post_group", group.id, theme.id, "2026-05-20T10:00:00.000Z");
      const otherPost = makePost("post_other", otherGroup.id, otherTheme.id, "2026-05-20T11:00:00.000Z");
      const groupZine = makeZine("zine_group", group.id, cycle.id);
      const otherZine = makeZine("zine_other", otherGroup.id, otherCycle.id);
      const otherMember: GroupMember = {
        id: "member_other",
        groupId: otherGroup.id,
        userId: user.id,
        role: "member",
        joinedAt: "2026-05-20T09:00:00.000Z"
      };

      repository.groups.upsert(otherGroup);
      repository.groupMembers.upsert(otherMember);
      repository.zineCycles.upsert(otherCycle);
      repository.themes.upsert(otherTheme);
      repository.posts.upsert(groupPost);
      repository.posts.upsert(otherPost);
      repository.zines.upsert(groupZine);
      repository.zines.upsert(otherZine);
      repository.eventLogs.prepend({
        id: "event_group",
        userId: user.id,
        groupId: group.id,
        eventName: "group_event",
        createdAt: "2026-05-20T10:00:00.000Z"
      });
      repository.eventLogs.prepend({
        id: "event_other",
        userId: "user_other",
        groupId: otherGroup.id,
        eventName: "other_event",
        createdAt: "2026-05-20T11:00:00.000Z"
      });

      expect(repository.groupMembers.listByGroupId(group.id).map((item) => item.groupId)).toEqual([group.id]);
      expect(repository.groupMembers.listByUserId(user.id).map((item) => item.id).sort()).toEqual([
        "member_demo_first",
        "member_other"
      ]);
      expect(repository.themes.listByGroupId(group.id).every((item) => item.groupId === group.id)).toBe(true);
      expect(repository.themes.listByZineCycleId(cycle.id).map((item) => item.zineCycleId)).toEqual([
        cycle.id,
        cycle.id,
        cycle.id
      ]);
      expect(repository.posts.listByGroupId(group.id).map((item) => item.id)).toEqual(["post_group"]);
      expect(repository.posts.listByThemeId(theme.id).map((item) => item.id)).toEqual(["post_group"]);
      expect(repository.zineCycles.listByGroupId(group.id).map((item) => item.id)).toEqual([cycle.id]);
      expect(repository.zines.listByGroupId(group.id).map((item) => item.id)).toEqual(["zine_group"]);
      expect(repository.eventLogs.listByGroupId(group.id).map((item) => item.id)).toEqual([
        "event_group",
        "event_seed_created"
      ]);
      expect(repository.eventLogs.listByUserId(user.id).map((item) => item.id)).toEqual([
        "event_group",
        "event_seed_created"
      ]);
    });

    it("prepends posts by feed order and replaces existing post ids instead of duplicating them", () => {
      const repository = createRepository();
      const state = repository.load();
      const group = state.groups[0]!;
      const theme = state.themes[0]!;
      const firstPost = makePost("post_1", group.id, theme.id, "2026-05-20T10:00:00.000Z");
      const secondPost = makePost("post_2", group.id, theme.id, "2026-05-20T11:00:00.000Z");
      const updatedFirstPost: Post = { ...firstPost, caption: "updated first post" };

      repository.posts.prepend(firstPost);
      repository.posts.prepend(secondPost);
      repository.posts.prepend(updatedFirstPost);

      expect(repository.posts.list().map((post) => post.id)).toEqual(["post_1", "post_2"]);
      expect(repository.posts.getById("post_1")).toMatchObject({ caption: "updated first post" });
    });

    it("replaces only the pages for the requested ZINE and returns pages in page-number order", () => {
      const repository = createRepository();
      const state = repository.load();
      const group = state.groups[0]!;
      const cycle = state.zineCycles[0]!;
      const targetZine = makeZine("zine_target", group.id, cycle.id);
      const otherZine = makeZine("zine_other", group.id, "cycle_other");
      const oldTargetPages = [
        makePage("page_target_old_1", targetZine.id, "post_1", 1),
        makePage("page_target_old_2", targetZine.id, "post_2", 2)
      ];
      const nextTargetPages = [
        makePage("page_target_next_2", targetZine.id, "post_4", 2),
        makePage("page_target_next_1", targetZine.id, "post_3", 1)
      ];
      const otherPage = makePage("page_other_1", otherZine.id, "post_other", 1);

      repository.zines.upsert(targetZine);
      repository.zines.upsert(otherZine);
      repository.zinePages.replaceForZine(targetZine.id, oldTargetPages);
      repository.zinePages.replaceForZine(otherZine.id, [otherPage]);
      repository.zinePages.replaceForZine(targetZine.id, nextTargetPages);

      expect(repository.zinePages.listByZineId(targetZine.id).map((page) => page.id)).toEqual([
        "page_target_next_1",
        "page_target_next_2"
      ]);
      expect(repository.zinePages.listByZineId(otherZine.id).map((page) => page.id)).toEqual(["page_other_1"]);
      expect(repository.zinePages.list().map((page) => page.id).sort()).toEqual([
        "page_other_1",
        "page_target_next_1",
        "page_target_next_2"
      ]);
    });

    it("publishes a ZINE from persisted cycle posts only after the MVP minimum is met", () => {
      const repository = createRepository();
      const state = repository.load();
      const user = state.users[0]!;
      const group = state.groups[0]!;
      const cycle = state.zineCycles[0]!;

      state.themes.forEach((theme, index) => {
        submitPost(repository, {
          userId: user.id,
          groupId: group.id,
          themeId: theme.id,
          imageUrl: `https://example.com/post-${index}.jpg`,
          caption: `post ${index}`,
          now: new Date(`2026-05-20T10:0${index}:00.000Z`)
        });
      });

      const beforeMinimum = publishZineForCycle(repository, {
        userId: user.id,
        groupId: group.id,
        zineCycleId: cycle.id,
        now: new Date("2026-05-23T00:00:00.000Z")
      });

      expect(beforeMinimum.zines).toEqual([]);
      expect(beforeMinimum.zinePages).toEqual([]);

      submitPost(repository, {
        userId: user.id,
        groupId: group.id,
        themeId: state.themes[0]!.id,
        imageUrl: "https://example.com/post-4.jpg",
        caption: "post 4",
        now: new Date("2026-05-20T10:04:00.000Z")
      });

      const published = publishZineForCycle(repository, {
        userId: user.id,
        groupId: group.id,
        zineCycleId: cycle.id,
        now: new Date("2026-05-23T00:00:00.000Z")
      });

      expect(published.zines).toHaveLength(1);
      expect(published.zinePages).toHaveLength(4);
      expect(published.zineCycles[0]).toMatchObject({ id: cycle.id, status: "published" });
      expect(published.eventLogs[0]).toMatchObject({
        eventName: "zine_published",
        entityType: "zine",
        metadata: { postCount: 4, mode: "option_a_3_day" }
      });
    });

    it("reset restores the demo seed state", () => {
      const repository = createRepository();
      const state = repository.load();

      submitPost(repository, {
        userId: state.users[0]!.id,
        groupId: state.groups[0]!.id,
        themeId: state.themes[0]!.id,
        imageUrl: "https://example.com/post.jpg",
        caption: "temporary post",
        now: new Date("2026-05-20T10:00:00.000Z")
      });

      const resetState = repository.reset();

      expect(resetState.groups[0]).toMatchObject({ id: "group_first", name: "First Mewri" });
      expect(resetState.themes).toHaveLength(3);
      expect(resetState.posts).toEqual([]);
      expect(resetState.zines).toEqual([]);
      expect(resetState.zinePages).toEqual([]);
      expect(resetState.eventLogs.map((event) => event.eventName)).toEqual(["seed_created"]);
    });

    it("does not expose localStorage details through the repository interface", () => {
      const repository = createRepository();

      expect(Object.keys(repository)).toEqual([
        "load",
        "save",
        "reset",
        "users",
        "groups",
        "groupMembers",
        "themes",
        "posts",
        "zineCycles",
        "zines",
        "zinePages",
        "eventLogs"
      ]);
      expect("localStorage" in repository).toBe(false);
      expect("storageKey" in repository).toBe(false);
    });
  });
}

export function createDeterministicSeedRepository(factory: (seed: ReturnType<typeof createSeedState>) => MewriRepository) {
  return factory(createSeedState(new Date("2026-05-20T09:00:00.000Z")));
}

function makeGroup(id: string, createdBy: string): Group {
  return {
    id,
    name: `Group ${id}`,
    description: `Description ${id}`,
    visibility: "invite_only",
    createdBy,
    createdAt: "2026-05-20T09:00:00.000Z",
    updatedAt: "2026-05-20T09:00:00.000Z"
  };
}

function makeCycle(id: string, groupId: string): ZineCycle {
  return {
    id,
    groupId,
    title: `Cycle ${id}`,
    startDate: "2026-05-20",
    endDate: "2026-05-22",
    status: "active",
    createdAt: "2026-05-20T09:00:00.000Z",
    updatedAt: "2026-05-20T09:00:00.000Z"
  };
}

function makeTheme(id: string, groupId: string, zineCycleId: string): Theme {
  return {
    id,
    groupId,
    zineCycleId,
    title: `Theme ${id}`,
    description: `Description ${id}`,
    themeDate: "2026-05-20",
    source: "ai",
    status: "active",
    createdAt: "2026-05-20T09:00:00.000Z"
  };
}

function makePost(id: string, groupId: string, themeId: string, createdAt: string): Post {
  return {
    id,
    userId: "user_demo",
    groupId,
    themeId,
    imageUrl: `https://example.com/${id}.jpg`,
    caption: `Caption ${id}`,
    visibility: "group_only",
    createdAt,
    updatedAt: createdAt
  };
}

function makeZine(id: string, groupId: string, zineCycleId: string): Zine {
  return {
    id,
    zineCycleId,
    groupId,
    title: `ZINE ${id}`,
    intro: `Intro ${id}`,
    coverPostId: "post_1",
    status: "published",
    createdAt: "2026-05-23T00:00:00.000Z",
    publishedAt: "2026-05-23T00:00:00.000Z"
  };
}

function makePage(id: string, zineId: string, postId: string, pageNumber: number): ZinePage {
  return {
    id,
    zineId,
    postId,
    pageNumber,
    layoutType: pageNumber === 1 ? "cover" : "full_bleed",
    aiCaption: `Caption ${pageNumber}`,
    createdAt: "2026-05-23T00:00:00.000Z"
  };
}


