import type { MewriState } from "@mewri/core";
import { describe, expect, it, vi } from "vitest";
import { createMewriCommandCaller } from "./mewri-command-caller";
import type { MewriAppService } from "./mewri-app-service";
import { createSeedState } from "./seed";

describe("MewriCommandCaller", () => {
  it("builds command context from request-like input", () => {
    const caller = createMewriCommandCaller(makeAppServiceStub());

    expect(
      caller.buildCommandContext({
        authenticatedUserId: "user_demo",
        requestSource: "server_action"
      })
    ).toEqual({
      currentUserId: "user_demo",
      requestSource: "server_action"
    });
  });

  it("delegates submitPost to commands.submitPost", () => {
    const state = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const submitPost = vi.fn(() => state);
    const publishZineForCycle = vi.fn(() => state);
    const caller = createMewriCommandCaller(
      makeAppServiceStub({
        commands: {
          submitPost,
          publishZineForCycle
        }
      })
    );

    const result = caller.submitPost({
      request: {
        authenticatedUserId: "user_demo",
        requestSource: "server_action"
      },
      input: {
        userId: "user_demo",
        groupId: "group_first",
        themeId: "theme_1",
        imageUrl: "https://example.com/post.jpg",
        caption: "hello"
      }
    });

    expect(result).toBe(state);
    expect(submitPost).toHaveBeenCalledTimes(1);
    expect(submitPost).toHaveBeenCalledWith({
      context: {
        currentUserId: "user_demo",
        requestSource: "server_action"
      },
      input: {
        userId: "user_demo",
        groupId: "group_first",
        themeId: "theme_1",
        imageUrl: "https://example.com/post.jpg",
        caption: "hello"
      }
    });
    expect(publishZineForCycle).not.toHaveBeenCalled();
  });

  it("delegates publishZineForCycle to commands.publishZineForCycle", () => {
    const state = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const submitPost = vi.fn(() => state);
    const publishZineForCycle = vi.fn(() => state);
    const caller = createMewriCommandCaller(
      makeAppServiceStub({
        commands: {
          submitPost,
          publishZineForCycle
        }
      })
    );

    const result = caller.publishZineForCycle({
      request: {
        authenticatedUserId: "user_demo",
        requestSource: "api_route"
      },
      input: {
        userId: "user_demo",
        groupId: "group_first",
        zineCycleId: "cycle_group_first_2026-05-20"
      }
    });

    expect(result).toBe(state);
    expect(publishZineForCycle).toHaveBeenCalledTimes(1);
    expect(publishZineForCycle).toHaveBeenCalledWith({
      context: {
        currentUserId: "user_demo",
        requestSource: "api_route"
      },
      input: {
        userId: "user_demo",
        groupId: "group_first",
        zineCycleId: "cycle_group_first_2026-05-20"
      }
    });
    expect(submitPost).not.toHaveBeenCalled();
  });

  it("does not perform auth or membership validation yet", () => {
    const state = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const submitPost = vi.fn(() => state);
    const caller = createMewriCommandCaller(
      makeAppServiceStub({
        commands: {
          submitPost,
          publishZineForCycle: vi.fn(() => state)
        }
      })
    );

    caller.submitPost({
      request: {
        requestSource: "server_action"
      },
      input: {
        userId: "user_unverified",
        groupId: "group_first",
        themeId: "theme_1",
        imageUrl: "https://example.com/post.jpg",
        caption: "no auth yet"
      }
    });

    expect(submitPost).toHaveBeenCalledWith({
      context: {
        currentUserId: undefined,
        requestSource: "server_action"
      },
      input: {
        userId: "user_unverified",
        groupId: "group_first",
        themeId: "theme_1",
        imageUrl: "https://example.com/post.jpg",
        caption: "no auth yet"
      }
    });
  });
});

function makeAppServiceStub(overrides?: Partial<Pick<MewriAppService, "commands">>): Pick<MewriAppService, "commands"> {
  const state: MewriState = createSeedState(new Date("2026-05-20T09:00:00.000Z"));

  return {
    commands: {
      submitPost: vi.fn(() => state),
      publishZineForCycle: vi.fn(() => state),
      ...overrides?.commands
    }
  };
}
