import type { Group, GroupMember, Theme } from "@mewri/core";
import { describe, expect, it } from "vitest";
import { createMemoryRepository } from "./memory-repository";
import { createSeedState } from "./seed";
import { createRepositorySharedBetaPostAuthorizationSource } from "./shared-beta-post-authorization-source";

const ACTIVE_THEME_ID = "theme_cycle_group_first_2026-05-20_1";

describe("shared beta post authorization source", () => {
  it("allows an authenticated member to post to an active theme in the same group", async () => {
    const source = createRepositorySharedBetaPostAuthorizationSource(
      createMemoryRepository(createSeedState(new Date("2026-05-20T09:00:00.000Z")))
    );

    await expect(
      Promise.resolve(
        source.canCreatePost({
          authenticatedUserId: "user_demo",
          groupId: "group_first",
          themeId: ACTIVE_THEME_ID
        })
      )
    ).resolves.toEqual({ ok: true });
  });

  it("denies users who are not members of the destination group", async () => {
    const state = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const otherGroup = makeOtherGroup();
    const otherTheme = makeOtherTheme(otherGroup);
    const source = createRepositorySharedBetaPostAuthorizationSource(
      createMemoryRepository({
        ...state,
        groups: [...state.groups, otherGroup],
        themes: [...state.themes, otherTheme]
      })
    );

    await expect(
      Promise.resolve(
        source.canCreatePost({
          authenticatedUserId: "user_demo",
          groupId: otherGroup.id,
          themeId: otherTheme.id
        })
      )
    ).resolves.toMatchObject({ ok: false, code: "group_membership_required" });
  });

  it.each([
    {
      name: "missing theme",
      sourceState(state: ReturnType<typeof createSeedState>) {
        return state;
      },
      themeId: "theme_missing"
    },
    {
      name: "other-group theme",
      sourceState(state: ReturnType<typeof createSeedState>) {
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
      themeId: "theme_other_active"
    },
    {
      name: "inactive theme",
      sourceState(state: ReturnType<typeof createSeedState>) {
        return {
          ...state,
          themes: state.themes.map((theme) =>
            theme.id === ACTIVE_THEME_ID ? { ...theme, status: "closed" as const } : theme
          )
        };
      },
      themeId: ACTIVE_THEME_ID
    }
  ])("denies $name", async ({ sourceState, themeId }) => {
    const source = createRepositorySharedBetaPostAuthorizationSource(
      createMemoryRepository(sourceState(createSeedState(new Date("2026-05-20T09:00:00.000Z"))))
    );

    await expect(
      Promise.resolve(
        source.canCreatePost({
          authenticatedUserId: "user_demo",
          groupId: "group_first",
          themeId
        })
      )
    ).resolves.toMatchObject({ ok: false, code: "active_group_theme_required" });
  });
});

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
