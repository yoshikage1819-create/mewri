import type { ID, Post, Theme, Zine, ZinePage } from "./models";

export function canGenerateZine(posts: Post[]): boolean {
  return posts.length >= 4;
}

export function generateZineDraft(params: {
  zineCycleId: ID;
  groupId: ID;
  posts: Post[];
  themes: Theme[];
  now: Date;
}): { zine: Zine; pages: ZinePage[] } {
  const sortedPosts = [...params.posts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const cover = chooseCoverPost(sortedPosts);
  const title = buildZineTitle(params.themes);
  const nowIso = params.now.toISOString();
  const zineId = `zine_${params.zineCycleId}`;

  const zine: Zine = {
    id: zineId,
    zineCycleId: params.zineCycleId,
    groupId: params.groupId,
    title,
    intro: buildIntro(params.themes, sortedPosts.length),
    coverPostId: cover?.id,
    status: "published",
    createdAt: nowIso,
    publishedAt: nowIso
  };

  const pages = sortedPosts.slice(0, 12).map((post, index) => {
    const theme = params.themes.find((item) => item.id === post.themeId);
    return {
      id: `page_${zineId}_${index + 1}`,
      zineId,
      postId: post.id,
      pageNumber: index + 1,
      layoutType: index === 0 ? "cover" : index % 3 === 0 ? "caption" : "full_bleed",
      aiCaption: theme ? `${theme.title} の断片` : "今日の断片",
      createdAt: nowIso
    } satisfies ZinePage;
  });

  return { zine, pages };
}

function chooseCoverPost(posts: Post[]): Post | undefined {
  return posts[0];
}

function buildZineTitle(themes: Theme[]): string {
  const activeTitles = themes.map((theme) => theme.title);
  if (activeTitles.length === 0) return "Untitled ZINE";
  if (activeTitles.length === 1) return activeTitles[0];
  return `${activeTitles[0]} / ${activeTitles[activeTitles.length - 1]}`;
}

function buildIntro(themes: Theme[], postCount: number): string {
  const titles = themes.map((theme) => theme.title).join("、");
  return `${titles}。${postCount}枚の写真から生まれた、3日間の小さなZINE。`;
}
