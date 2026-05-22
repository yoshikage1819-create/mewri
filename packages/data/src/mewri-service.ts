import { canGenerateZine, generateZineDraft, type MewriState, type ID, type Post } from "@mewri/core";
import { createEvent, createPost, upsertPublishedZine } from "./mvp-mutations";
import type { MewriRepository } from "./repository";

export interface SubmitPostInput {
  userId: ID;
  groupId: ID;
  themeId: ID;
  imageUrl: string;
  caption: string;
  now?: Date;
}

export interface GenerateZineInput {
  userId?: ID;
  groupId: ID;
  zineCycleId: ID;
  now?: Date;
}

export function submitPost(repository: MewriRepository, input: SubmitPostInput): MewriState {
  const now = input.now ?? new Date();
  const post = createPost({
    userId: input.userId,
    groupId: input.groupId,
    themeId: input.themeId,
    imageUrl: input.imageUrl,
    caption: input.caption,
    now
  });

  repository.posts.prepend(post);
  repository.eventLogs.prepend(
    createEvent({
      userId: input.userId,
      groupId: input.groupId,
      eventName: "post_created",
      entityType: "post",
      entityId: post.id,
      metadata: { themeId: input.themeId },
      now
    })
  );

  return repository.load();
}

export function publishZineForCycle(repository: MewriRepository, input: GenerateZineInput): MewriState {
  const now = input.now ?? new Date();
  const state = repository.load();
  const themes = state.themes.filter((theme) => theme.zineCycleId === input.zineCycleId);
  const themeIds = new Set(themes.map((theme) => theme.id));
  const posts = state.posts.filter((post) => post.groupId === input.groupId && themeIds.has(post.themeId));

  if (!canGenerateZine(posts)) return state;

  const { zine, pages } = generateZineDraft({
    zineCycleId: input.zineCycleId,
    groupId: input.groupId,
    posts,
    themes,
    now
  });

  const nextState = upsertPublishedZine(
    {
      ...state,
      eventLogs: [
        createEvent({
          userId: input.userId,
          groupId: input.groupId,
          eventName: "zine_published",
          entityType: "zine",
          entityId: zine.id,
          metadata: { postCount: posts.length, mode: "option_a_3_day" },
          now
        }),
        ...state.eventLogs
      ]
    },
    zine,
    pages
  );

  repository.save(nextState);
  return repository.load();
}

export function listCyclePosts(state: MewriState, cycleThemeIds: Set<ID>): Post[] {
  return state.posts.filter((post) => cycleThemeIds.has(post.themeId));
}

