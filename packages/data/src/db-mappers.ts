import type {
  EventLog,
  MewriState,
  Group,
  GroupMember,
  Post,
  Theme,
  User,
  Zine,
  ZineCycle,
  ZinePage
} from "@mewri/core";
import type {
  DbEventLogRow,
  DbEventMetadata,
  DbMewriRows,
  DbGroupMemberRow,
  DbGroupRow,
  DbPostRow,
  DbThemeRow,
  DbUserRow,
  DbZineCycleRow,
  DbZinePageRow,
  DbZineRow
} from "./db-row-types";

export function userToDbRow(user: User): DbUserRow {
  return {
    id: user.id,
    display_name: user.displayName,
    username: user.username,
    avatar_url: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  };
}

export function userFromDbRow(row: DbUserRow): User {
  return {
    id: row.id,
    displayName: row.display_name,
    username: row.username,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function groupToDbRow(group: Group): DbGroupRow {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    visibility: group.visibility,
    created_by: group.createdBy,
    created_at: group.createdAt,
    updated_at: group.updatedAt
  };
}

export function groupFromDbRow(row: DbGroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function groupMemberToDbRow(member: GroupMember): DbGroupMemberRow {
  return {
    id: member.id,
    group_id: member.groupId,
    user_id: member.userId,
    role: member.role,
    joined_at: member.joinedAt
  };
}

export function groupMemberFromDbRow(row: DbGroupMemberRow): GroupMember {
  return {
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at
  };
}

export function themeToDbRow(theme: Theme): DbThemeRow {
  return {
    id: theme.id,
    group_id: theme.groupId,
    zine_cycle_id: theme.zineCycleId,
    title: theme.title,
    description: theme.description,
    theme_date: theme.themeDate,
    source: theme.source,
    status: theme.status,
    created_at: theme.createdAt
  };
}

export function themeFromDbRow(row: DbThemeRow): Theme {
  return {
    id: row.id,
    groupId: row.group_id,
    zineCycleId: row.zine_cycle_id,
    title: row.title,
    description: row.description,
    themeDate: row.theme_date,
    source: row.source,
    status: row.status,
    createdAt: row.created_at
  };
}

export function postToDbRow(post: Post): DbPostRow {
  return {
    id: post.id,
    user_id: post.userId,
    group_id: post.groupId,
    theme_id: post.themeId,
    image_url: post.imageUrl,
    caption: post.caption,
    visibility: post.visibility,
    created_at: post.createdAt,
    updated_at: post.updatedAt
  };
}

export function postFromDbRow(row: DbPostRow): Post {
  return {
    id: row.id,
    userId: row.user_id,
    groupId: row.group_id,
    themeId: row.theme_id,
    imageUrl: row.image_url,
    caption: row.caption,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function zineCycleToDbRow(cycle: ZineCycle): DbZineCycleRow {
  return {
    id: cycle.id,
    group_id: cycle.groupId,
    title: cycle.title,
    start_date: cycle.startDate,
    end_date: cycle.endDate,
    status: cycle.status,
    created_at: cycle.createdAt,
    updated_at: cycle.updatedAt
  };
}

export function zineCycleFromDbRow(row: DbZineCycleRow): ZineCycle {
  return {
    id: row.id,
    groupId: row.group_id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function zineToDbRow(zine: Zine): DbZineRow {
  return {
    id: zine.id,
    zine_cycle_id: zine.zineCycleId,
    group_id: zine.groupId,
    title: zine.title,
    intro: zine.intro,
    cover_post_id: zine.coverPostId ?? null,
    status: zine.status,
    created_at: zine.createdAt,
    published_at: zine.publishedAt ?? null
  };
}

export function zineFromDbRow(row: DbZineRow): Zine {
  return {
    id: row.id,
    zineCycleId: row.zine_cycle_id,
    groupId: row.group_id,
    title: row.title,
    intro: row.intro,
    coverPostId: row.cover_post_id ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    publishedAt: row.published_at ?? undefined
  };
}

export function zinePageToDbRow(page: ZinePage): DbZinePageRow {
  return {
    id: page.id,
    zine_id: page.zineId,
    post_id: page.postId,
    page_number: page.pageNumber,
    layout_type: page.layoutType,
    ai_caption: page.aiCaption ?? null,
    editor_note: page.editorNote ?? null,
    created_at: page.createdAt
  };
}

export function zinePageFromDbRow(row: DbZinePageRow): ZinePage {
  return {
    id: row.id,
    zineId: row.zine_id,
    postId: row.post_id,
    pageNumber: row.page_number,
    layoutType: row.layout_type,
    aiCaption: row.ai_caption ?? undefined,
    editorNote: row.editor_note ?? undefined,
    createdAt: row.created_at
  };
}

export function eventLogToDbRow(event: EventLog): DbEventLogRow {
  return {
    id: event.id,
    user_id: event.userId ?? null,
    group_id: event.groupId ?? null,
    event_name: event.eventName,
    entity_type: event.entityType ?? null,
    entity_id: event.entityId ?? null,
    metadata: eventMetadataToDb(event.metadata),
    created_at: event.createdAt
  };
}

export function eventLogFromDbRow(row: DbEventLogRow): EventLog {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    groupId: row.group_id ?? undefined,
    eventName: row.event_name,
    entityType: row.entity_type ?? undefined,
    entityId: row.entity_id ?? undefined,
    metadata: eventMetadataFromDb(row.metadata),
    createdAt: row.created_at
  };
}

export function mewriStateToDbRows(state: MewriState): DbMewriRows {
  return {
    users: state.users.map(userToDbRow),
    groups: state.groups.map(groupToDbRow),
    group_members: state.groupMembers.map(groupMemberToDbRow),
    themes: state.themes.map(themeToDbRow),
    posts: state.posts.map(postToDbRow),
    zine_cycles: state.zineCycles.map(zineCycleToDbRow),
    zines: state.zines.map(zineToDbRow),
    zine_pages: state.zinePages.map(zinePageToDbRow),
    event_logs: state.eventLogs.map(eventLogToDbRow)
  };
}

export function mewriStateFromDbRows(rows: DbMewriRows): MewriState {
  return {
    users: rows.users.map(userFromDbRow),
    groups: rows.groups.map(groupFromDbRow),
    groupMembers: rows.group_members.map(groupMemberFromDbRow),
    themes: rows.themes.map(themeFromDbRow),
    posts: rows.posts.map(postFromDbRow),
    zineCycles: rows.zine_cycles.map(zineCycleFromDbRow),
    zines: rows.zines.map(zineFromDbRow),
    zinePages: rows.zine_pages.map(zinePageFromDbRow),
    eventLogs: rows.event_logs.map(eventLogFromDbRow)
  };
}

function eventMetadataToDb(metadata: EventLog["metadata"]): DbEventMetadata | null {
  if (!metadata) return null;
  return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, value ?? null]));
}

function eventMetadataFromDb(metadata: DbEventMetadata | null): EventLog["metadata"] | undefined {
  if (!metadata) return undefined;
  return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, value ?? undefined]));
}


