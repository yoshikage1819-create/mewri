import { describe, expect, it } from "vitest";
import { createMewriAppService } from "./mewri-app-service";
import { createMemoryRepository } from "./memory-repository";
import { createSeedState } from "./seed";

describe("MewriAppService", () => {
  it("keeps demo-only reset and state replacement separate from production-intended commands", () => {
    const service = createMewriAppService(createMemoryRepository(createSeedState(new Date("2026-05-20T09:00:00.000Z"))));
    const initial = service.load();
    const demoState = {
      ...initial,
      posts: [
        {
          id: "post_demo",
          userId: initial.users[0]!.id,
          groupId: initial.groups[0]!.id,
          themeId: initial.themes[0]!.id,
          imageUrl: "https://example.com/demo.jpg",
          caption: "demo post",
          visibility: "group_only" as const,
          createdAt: "2026-05-20T10:00:00.000Z",
          updatedAt: "2026-05-20T10:00:00.000Z"
        }
      ]
    };

    const replaced = service.demo.replaceState(demoState);
    expect(replaced.posts).toHaveLength(1);
    expect(replaced.posts[0]).toMatchObject({ id: "post_demo" });

    const reset = service.demo.reset();
    expect(reset.posts).toEqual([]);
    expect(reset.zines).toEqual([]);
    expect(reset.zinePages).toEqual([]);
  });

  it("submits posts through the app-service boundary and records the event log", () => {
    const service = createMewriAppService(createMemoryRepository(createSeedState(new Date("2026-05-20T09:00:00.000Z"))));
    const initial = service.load();

    const nextState = service.commands.submitPost({
      context: {
        currentUserId: initial.users[0]!.id,
        requestSource: "browser_demo"
      },
      input: {
        userId: initial.users[0]!.id,
        groupId: initial.groups[0]!.id,
        themeId: initial.themes[0]!.id,
        imageUrl: "https://example.com/post.jpg",
        caption: "boundary post",
        now: new Date("2026-05-20T10:00:00.000Z")
      }
    });

    expect(nextState.posts[0]).toMatchObject({
      groupId: initial.groups[0]!.id,
      themeId: initial.themes[0]!.id,
      caption: "boundary post"
    });
    expect(nextState.eventLogs[0]).toMatchObject({
      eventName: "post_created",
      entityType: "post",
      groupId: initial.groups[0]!.id
    });
  });

  it("publishes a zine through the app-service boundary only after the minimum post count is met", () => {
    const service = createMewriAppService(createMemoryRepository(createSeedState(new Date("2026-05-20T09:00:00.000Z"))));
    const initial = service.load();

    initial.themes.forEach((theme, index) => {
      service.commands.submitPost({
        context: {
          currentUserId: initial.users[0]!.id,
          requestSource: "browser_demo"
        },
        input: {
          userId: initial.users[0]!.id,
          groupId: initial.groups[0]!.id,
          themeId: theme.id,
          imageUrl: `https://example.com/post-${index}.jpg`,
          caption: `post ${index}`,
          now: new Date(`2026-05-20T10:0${index}:00.000Z`)
        }
      });
    });

    const beforeMinimum = service.commands.publishZineForCycle({
      context: {
        currentUserId: initial.users[0]!.id,
        requestSource: "browser_demo"
      },
      input: {
        userId: initial.users[0]!.id,
        groupId: initial.groups[0]!.id,
        zineCycleId: initial.zineCycles[0]!.id,
        now: new Date("2026-05-23T00:00:00.000Z")
      }
    });

    expect(beforeMinimum.zines).toEqual([]);

    service.commands.submitPost({
      context: {
        currentUserId: initial.users[0]!.id,
        requestSource: "browser_demo"
      },
      input: {
        userId: initial.users[0]!.id,
        groupId: initial.groups[0]!.id,
        themeId: initial.themes[0]!.id,
        imageUrl: "https://example.com/post-4.jpg",
        caption: "post 4",
        now: new Date("2026-05-20T10:04:00.000Z")
      }
    });

    const published = service.commands.publishZineForCycle({
      context: {
        currentUserId: initial.users[0]!.id,
        requestSource: "browser_demo"
      },
      input: {
        userId: initial.users[0]!.id,
        groupId: initial.groups[0]!.id,
        zineCycleId: initial.zineCycles[0]!.id,
        now: new Date("2026-05-23T00:00:00.000Z")
      }
    });

    expect(published.zines).toHaveLength(1);
    expect(published.zinePages).toHaveLength(4);
    expect(published.eventLogs[0]).toMatchObject({
      eventName: "zine_published",
      entityType: "zine"
    });
  });
});
