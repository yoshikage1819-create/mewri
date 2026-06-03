import type { Group, GroupMember, Post, Theme } from "@mewri/core";
import { describe, expect, it, vi } from "vitest";
import { createMemoryRepository } from "./memory-repository";
import { type SubmitPostCommand } from "./mewri-app-service";
import { createSeedState } from "./seed";
import { createRepositorySharedBetaPostAuthorizationSource } from "./shared-beta-post-authorization-source";
import { createSharedBetaPostRouteBoundary } from "./shared-beta-post-route-boundary";

const POST_IMAGE_BUCKET = "post-images";
const ACTIVE_THEME_ID = "theme_cycle_group_first_2026-05-20_1";

describe("shared beta post route boundary", () => {
  it("submits once when authenticated server context and a server-validated image path are provided", async () => {
    const submitPost = vi.fn(() => makeSubmittedPost());
    const boundary = createRouteBoundary({ submitPost });

    const result = await boundary.submitPost(makeRouteInput());

    expect(result).toEqual({ ok: true, post: makeSubmittedPost() });
    expect(result).not.toHaveProperty("state");
    expect(submitPost).toHaveBeenCalledTimes(1);
    expect(submitPost).toHaveBeenCalledWith({
      context: {
        currentUserId: "user_demo",
        requestSource: "api_route"
      },
      input: {
        userId: "user_demo",
        groupId: "group_first",
        themeId: ACTIVE_THEME_ID,
        caption: "shared beta post",
        imageUrl: "post-images/group_first/user_demo/photo.webp"
      }
    });
  });

  it.each([
    {
      name: "when unauthenticated",
      expectedCode: "authentication_required",
      input: makeRouteInput({ actor: {} })
    },
    {
      name: "when userId is impersonated",
      expectedCode: "identity_mismatch",
      input: makeRouteInput({ post: { userId: "user_other" } })
    },
    {
      name: "when no server-validated image is provided",
      expectedCode: "validated_image_required",
      input: makeRouteInput({ serverValidatedImagePath: undefined })
    },
    {
      name: "when private image path is invalid",
      expectedCode: "private_image_path_required",
      input: makeRouteInput({ serverValidatedImagePath: "data:image/png;base64,private-data" })
    }
  ])("rejects command execution $name", async ({ expectedCode, input }) => {
    const submitPost = vi.fn(() => makeSubmittedPost());
    const boundary = createRouteBoundary({ submitPost });

    const result = await boundary.submitPost(input);

    expect(result).toMatchObject({ ok: false, code: expectedCode });
    expect(submitPost).not.toHaveBeenCalled();
  });

  it("rejects command execution for non-members", async () => {
    const state = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const otherGroup = makeOtherGroup();
    const otherTheme = makeOtherTheme(otherGroup);
    const submitPost = vi.fn(() => makeSubmittedPost());
    const boundary = createRouteBoundary({
      submitPost,
      seedState: {
        ...state,
        groups: [...state.groups, otherGroup],
        themes: [...state.themes, otherTheme]
      }
    });

    const result = await boundary.submitPost(
      makeRouteInput({
        post: {
          groupId: otherGroup.id,
          themeId: otherTheme.id
        },
        serverValidatedImagePath: `post-images/${otherGroup.id}/user_demo/photo.webp`
      })
    );

    expect(result).toMatchObject({ ok: false, code: "group_membership_required" });
    expect(submitPost).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "when theme belongs to another group",
      setupState(state: ReturnType<typeof createSeedState>) {
        const otherGroup = makeOtherGroup();
        const otherTheme = makeOtherTheme(otherGroup);
        const otherMember: GroupMember = {
          id: "member_demo_other",
          groupId: otherGroup.id,
          userId: "user_demo",
          role: "member",
          joinedAt: "2026-05-20T09:00:00.000Z"
        };
        return {
          ...state,
          groups: [...state.groups, otherGroup],
          groupMembers: [...state.groupMembers, otherMember],
          themes: [...state.themes, otherTheme]
        };
      },
      input: makeRouteInput({ post: { themeId: "theme_other_active" } })
    },
    {
      name: "when theme is inactive",
      setupState(state: ReturnType<typeof createSeedState>) {
        return {
          ...state,
          themes: state.themes.map((theme) =>
            theme.id === ACTIVE_THEME_ID ? { ...theme, status: "closed" as const } : theme
          )
        };
      },
      input: makeRouteInput()
    }
  ])("rejects command execution $name", async ({ setupState, input }) => {
    const state = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const submitPost = vi.fn(() => makeSubmittedPost());
    const boundary = createRouteBoundary({
      submitPost,
      seedState: setupState(state)
    });

    const result = await boundary.submitPost(input);

    expect(result).toMatchObject({ ok: false, code: "active_group_theme_required" });
    expect(submitPost).not.toHaveBeenCalled();
  });
});

function createRouteBoundary(options: {
  submitPost: (command: SubmitPostCommand) => Post;
  seedState?: ReturnType<typeof createSeedState>;
}) {
  const repository = createMemoryRepository(options.seedState ?? createSeedState(new Date("2026-05-20T09:00:00.000Z")));

  return createSharedBetaPostRouteBoundary({
    authorizationSource: createRepositorySharedBetaPostAuthorizationSource(repository),
    authorization: {
      postImageBucket: POST_IMAGE_BUCKET,
      isPostImageUploadValidated: () => true
    },
    postCommandService: {
      submitPost: options.submitPost
    }
  });
}

function makeSubmittedPost(): Post {
  return {
    id: "post_shared_beta_created",
    userId: "user_demo",
    groupId: "group_first",
    themeId: ACTIVE_THEME_ID,
    imageUrl: "post-images/group_first/user_demo/photo.webp",
    caption: "shared beta post",
    visibility: "group_only",
    createdAt: "2026-05-20T09:00:00.000Z",
    updatedAt: "2026-05-20T09:00:00.000Z"
  };
}

function makeRouteInput(overrides?: {
  actor?: { authenticatedUserId?: string };
  serverValidatedImagePath?: string | undefined;
  post?: Partial<{
    userId: string;
    groupId: string;
    themeId: string;
    caption: string;
  }>;
}) {
  return {
    actor: overrides?.actor ?? { authenticatedUserId: "user_demo" },
    post: {
      userId: "user_demo",
      groupId: "group_first",
      themeId: ACTIVE_THEME_ID,
      caption: "shared beta post",
      ...overrides?.post
    },
    serverValidatedImagePath:
      "serverValidatedImagePath" in (overrides ?? {})
        ? overrides?.serverValidatedImagePath
        : "post-images/group_first/user_demo/photo.webp"
  };
}

function makeOtherGroup(): Group {
  return {
    id: "group_other",
    name: "Other",
    description: "Other invited group",
    visibility: "invite_only",
    createdBy: "user_other",
    createdAt: "2026-05-20T09:00:00.000Z",
    updatedAt: "2026-05-20T09:00:00.000Z"
  };
}

function makeOtherTheme(group: Group): Theme {
  return {
    id: "theme_other_active",
    groupId: group.id,
    zineCycleId: "cycle_other",
    title: "Other active theme",
    description: "Other active theme",
    themeDate: "2026-05-20",
    source: "ai",
    status: "active",
    createdAt: "2026-05-20T09:00:00.000Z"
  };
}
