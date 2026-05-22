import {
  createOptionAThreeDayCycle,
  type MewriState,
  type Group,
  type GroupMember,
  type User
} from "@mewri/core";

export function createSeedState(now = new Date()): MewriState {
  const createdAt = now.toISOString();
  const user: User = {
    id: "user_demo",
    displayName: "Demo User",
    username: "demo",
    avatarUrl: "",
    bio: "Mewri MVP v0 tester",
    createdAt,
    updatedAt: createdAt
  };

  const group: Group = {
    id: "group_first",
    name: "First Mewri",
    description: "3日間のThemeから、最初のZINEを作るためのデモGroup。",
    visibility: "invite_only",
    createdBy: user.id,
    createdAt,
    updatedAt: createdAt
  };

  const member: GroupMember = {
    id: "member_demo_first",
    groupId: group.id,
    userId: user.id,
    role: "owner",
    joinedAt: createdAt
  };

  const { cycle, themes } = createOptionAThreeDayCycle({
    groupId: group.id,
    cycleIndex: 1,
    startDate: now,
    now
  });

  return {
    users: [user],
    groups: [group],
    groupMembers: [member],
    themes,
    posts: [],
    zineCycles: [cycle],
    zines: [],
    zinePages: [],
    eventLogs: [
      {
        id: "event_seed_created",
        userId: user.id,
        groupId: group.id,
        eventName: "seed_created",
        entityType: "zine_cycle",
        entityId: cycle.id,
        metadata: { mode: "option_a_3_day_cycle" },
        createdAt
      }
    ]
  };
}

