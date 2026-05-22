export type ID = string;

export type ThemeStatus = "scheduled" | "active" | "closed";
export type ZineCycleStatus =
  | "scheduled"
  | "active"
  | "closed"
  | "generating"
  | "ready_for_review"
  | "published"
  | "archived";
export type ZineStatus = "draft" | "review" | "published" | "archived";
export type ThemeSource = "ai" | "host" | "admin";
export type GroupVisibility = "invite_only" | "private" | "public";
export type PostVisibility = "group_only" | "public_link";

export interface User {
  id: ID;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: ID;
  name: string;
  description: string;
  visibility: GroupVisibility;
  createdBy: ID;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: ID;
  groupId: ID;
  userId: ID;
  role: "owner" | "member";
  joinedAt: string;
}

export interface Theme {
  id: ID;
  groupId: ID;
  zineCycleId: ID;
  title: string;
  description: string;
  themeDate: string;
  source: ThemeSource;
  status: ThemeStatus;
  createdAt: string;
}

export interface Post {
  id: ID;
  userId: ID;
  groupId: ID;
  themeId: ID;
  imageUrl: string;
  caption: string;
  visibility: PostVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface ZineCycle {
  id: ID;
  groupId: ID;
  title: string;
  startDate: string;
  endDate: string;
  status: ZineCycleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Zine {
  id: ID;
  zineCycleId: ID;
  groupId: ID;
  title: string;
  intro: string;
  coverPostId?: ID;
  status: ZineStatus;
  createdAt: string;
  publishedAt?: string;
}

export interface ZinePage {
  id: ID;
  zineId: ID;
  postId: ID;
  pageNumber: number;
  layoutType: "cover" | "full_bleed" | "pair" | "caption";
  aiCaption?: string;
  editorNote?: string;
  createdAt: string;
}

export interface EventLog {
  id: ID;
  userId?: ID;
  groupId?: ID;
  eventName: string;
  entityType?: string;
  entityId?: ID;
  metadata?: Record<string, string | number | boolean | undefined>;
  createdAt: string;
}

export interface MewriState {
  users: User[];
  groups: Group[];
  groupMembers: GroupMember[];
  themes: Theme[];
  posts: Post[];
  zineCycles: ZineCycle[];
  zines: Zine[];
  zinePages: ZinePage[];
  eventLogs: EventLog[];
}

