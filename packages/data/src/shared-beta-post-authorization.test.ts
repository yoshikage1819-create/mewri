import type { Group, GroupMember, Theme } from "@mewri/core";
import { describe, expect, it, vi } from "vitest";
import { createMemoryRepository } from "./memory-repository";
import { createSeedState } from "./seed";
import {
  createSharedBetaPostCommandService,
  SharedBetaPostAuthorizationError,
  type SharedBetaPostAuthorizationFailure
} from "./shared-beta-post-authorization";

const POST_IMAGE_BUCKET = "post-images";
const ACTIVE_THEME_ID = "theme_cycle_group_first_2026-05-20_1";

describe("shared beta post authorization", () => {
  it("allows an authenticated member to post to the group's active theme with a private image path", () => {
    const service = createGuardedService();

    const post = service.submitPost(makeCommand());

    expect("demo" in service).toBe(false);
    expect("publishZineForCycle" in service).toBe(false);
    expect(post).toMatchObject({
      userId: "user_demo",
      groupId: "group_first",
      themeId: ACTIVE_THEME_ID,
      imageUrl: "post-images/group_first/user_demo/photo.webp"
    });
  });

  it("rejects a correctly shaped path that has not been verified by server storage", () => {
    const service = createGuardedService(undefined, () => false);

    expectAuthorizationFailure(() => service.submitPost(makeCommand()), "validated_image_required");
  });

  it.each([
    {
      name: "browser-originated commands",
      code: "server_request_required",
      command: makeCommand({ context: { currentUserId: "user_demo", requestSource: "browser_demo" } })
    },
    {
      name: "missing authenticated users",
      code: "authentication_required",
      command: makeCommand({ context: { requestSource: "server_action" } })
    },
    {
      name: "identity impersonation",
      code: "identity_mismatch",
      command: makeCommand({ input: { userId: "user_other" } })
    },
    {
      name: "data URL images",
      code: "private_image_path_required",
      command: makeCommand({ input: { imageUrl: "data:image/png;base64,private-data" } })
    },
    {
      name: "paths belonging to another user",
      code: "private_image_path_required",
      command: makeCommand({ input: { imageUrl: "post-images/group_first/user_other/photo.webp" } })
    },
    {
      name: "path traversal filenames",
      code: "private_image_path_required",
      command: makeCommand({ input: { imageUrl: "post-images/group_first/user_demo/.." } })
    }
  ])("rejects $name", ({ code, command }) => {
    expectAuthorizationFailure(() => createGuardedService().submitPost(command), code);
  });

  it("rejects authenticated users who do not belong to the destination group", () => {
    const state = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const otherGroup = makeOtherGroup();
    const otherTheme = makeOtherTheme(otherGroup);
    const service = createGuardedService({
      ...state,
      groups: [...state.groups, otherGroup],
      themes: [...state.themes, otherTheme]
    });

    expectAuthorizationFailure(
      () =>
        service.submitPost(
          makeCommand({
            input: {
              groupId: otherGroup.id,
              themeId: otherTheme.id,
              imageUrl: `post-images/${otherGroup.id}/user_demo/photo.webp`
            }
          })
        ),
      "group_membership_required"
    );
  });

  it("rejects non-members before server image validation", () => {
    const state = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const otherGroup = makeOtherGroup();
    const otherTheme = makeOtherTheme(otherGroup);
    const isPostImageUploadValidated = vi.fn(() => true);
    const service = createGuardedService(
      {
        ...state,
        groups: [...state.groups, otherGroup],
        themes: [...state.themes, otherTheme]
      },
      isPostImageUploadValidated
    );

    expectAuthorizationFailure(
      () =>
        service.submitPost(
          makeCommand({
            input: {
              groupId: otherGroup.id,
              themeId: otherTheme.id,
              imageUrl: `post-images/${otherGroup.id}/user_demo/photo.webp`
            }
          })
        ),
      "group_membership_required"
    );
    expect(isPostImageUploadValidated).not.toHaveBeenCalled();
  });

  it("rejects an active theme that belongs to another group", () => {
    const state = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const otherGroup = makeOtherGroup();
    const otherTheme = makeOtherTheme(otherGroup);
    const otherMember: GroupMember = {
      id: "member_demo_other",
      groupId: otherGroup.id,
      userId: "user_demo",
      role: "member",
      joinedAt: "2026-05-20T09:00:00.000Z"
    };
    const service = createGuardedService({
      ...state,
      groups: [...state.groups, otherGroup],
      groupMembers: [...state.groupMembers, otherMember],
      themes: [...state.themes, otherTheme]
    });

    expectAuthorizationFailure(
      () => service.submitPost(makeCommand({ input: { themeId: otherTheme.id } })),
      "active_group_theme_required"
    );
  });

  it("rejects posting to a theme that is no longer active", () => {
    const state = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const closedThemes = state.themes.map((theme) =>
      theme.id === ACTIVE_THEME_ID ? { ...theme, status: "closed" as const } : theme
    );
    const service = createGuardedService({ ...state, themes: closedThemes });

    expectAuthorizationFailure(() => service.submitPost(makeCommand()), "active_group_theme_required");
  });
});

function createGuardedService(
  seedState = createSeedState(new Date("2026-05-20T09:00:00.000Z")),
  isPostImageUploadValidated = () => true
) {
  const repository = createMemoryRepository(seedState);
  return createSharedBetaPostCommandService(repository, {
    postImageBucket: POST_IMAGE_BUCKET,
    isPostImageUploadValidated
  });
}

function makeCommand(overrides?: {
  context?: { currentUserId?: string; requestSource: "browser_demo" | "server_action" | "api_route" };
  input?: Partial<{
    userId: string;
    groupId: string;
    themeId: string;
    imageUrl: string;
    caption: string;
  }>;
}) {
  return {
    context: overrides?.context ?? { currentUserId: "user_demo", requestSource: "server_action" as const },
    input: {
      userId: "user_demo",
      groupId: "group_first",
      themeId: ACTIVE_THEME_ID,
      imageUrl: "post-images/group_first/user_demo/photo.webp",
      caption: "shared beta post",
      ...overrides?.input
    }
  };
}

function expectAuthorizationFailure(operation: () => unknown, code: SharedBetaPostAuthorizationFailure): void {
  try {
    operation();
    throw new Error("Expected shared beta post authorization to reject the operation.");
  } catch (error) {
    expect(error).toBeInstanceOf(SharedBetaPostAuthorizationError);
    expect((error as SharedBetaPostAuthorizationError).code).toBe(code);
  }
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
