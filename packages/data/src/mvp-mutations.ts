import type { EventLog, MewriState, ID, Post, Zine, ZinePage } from "@mewri/core";
import { replaceById } from "./repository";

export function createPost(params: {
  userId: ID;
  groupId: ID;
  themeId: ID;
  imageUrl: string;
  caption: string;
  now: Date;
}): Post {
  const nowIso = params.now.toISOString();
  return {
    id: `post_${createClientSafeId()}`,
    userId: params.userId,
    groupId: params.groupId,
    themeId: params.themeId,
    imageUrl: params.imageUrl,
    caption: params.caption,
    visibility: "group_only",
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

export function createEvent(params: {
  userId?: ID;
  groupId?: ID;
  eventName: string;
  entityType?: string;
  entityId?: ID;
  metadata?: EventLog["metadata"];
  now: Date;
}): EventLog {
  return {
    id: `event_${createClientSafeId()}`,
    userId: params.userId,
    groupId: params.groupId,
    eventName: params.eventName,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: params.metadata,
    createdAt: params.now.toISOString()
  };
}

function createClientSafeId(): string {
  const maybeCrypto = globalThis.crypto;
  if (maybeCrypto && typeof maybeCrypto.randomUUID === "function") {
    try {
      return maybeCrypto.randomUUID();
    } catch {
      // On some mobile HTTP origins, randomUUID may exist but still fail at runtime.
      // Fall through to MVP-safe local id generation.
    }
  }

  const randomPart = Math.random().toString(36).slice(2, 12);
  const timePart = Date.now().toString(36);
  return `${timePart}_${randomPart}`;
}

export function upsertPublishedZine(state: MewriState, zine: Zine, pages: ZinePage[]): MewriState {
  return {
    ...state,
    zineCycles: state.zineCycles.map((cycle) =>
      cycle.id === zine.zineCycleId ? { ...cycle, status: "published", updatedAt: zine.createdAt } : cycle
    ),
    zines: replaceById(state.zines, zine),
    zinePages: [...state.zinePages.filter((item) => item.zineId !== zine.id), ...pages]
  };
}

