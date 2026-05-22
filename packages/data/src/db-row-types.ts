import type {
  GroupMember,
  GroupVisibility,
  PostVisibility,
  ThemeSource,
  ThemeStatus,
  ZineCycleStatus,
  ZinePage,
  ZineStatus
} from "@mewri/core";

export type DbEventMetadata = Record<string, string | number | boolean | null>;

export interface DbUserRow {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbGroupRow {
  id: string;
  name: string;
  description: string;
  visibility: GroupVisibility;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbGroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMember["role"];
  joined_at: string;
}

export interface DbThemeRow {
  id: string;
  group_id: string;
  zine_cycle_id: string;
  title: string;
  description: string;
  theme_date: string;
  source: ThemeSource;
  status: ThemeStatus;
  created_at: string;
}

export interface DbPostRow {
  id: string;
  user_id: string;
  group_id: string;
  theme_id: string;
  image_url: string;
  caption: string;
  visibility: PostVisibility;
  created_at: string;
  updated_at: string;
}

export interface DbZineCycleRow {
  id: string;
  group_id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: ZineCycleStatus;
  created_at: string;
  updated_at: string;
}

export interface DbZineRow {
  id: string;
  zine_cycle_id: string;
  group_id: string;
  title: string;
  intro: string;
  cover_post_id: string | null;
  status: ZineStatus;
  created_at: string;
  published_at: string | null;
}

export interface DbZinePageRow {
  id: string;
  zine_id: string;
  post_id: string;
  page_number: number;
  layout_type: ZinePage["layoutType"];
  ai_caption: string | null;
  editor_note: string | null;
  created_at: string;
}

export interface DbEventLogRow {
  id: string;
  user_id: string | null;
  group_id: string | null;
  event_name: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: DbEventMetadata | null;
  created_at: string;
}

export interface DbMewriRows {
  users: DbUserRow[];
  groups: DbGroupRow[];
  group_members: DbGroupMemberRow[];
  themes: DbThemeRow[];
  posts: DbPostRow[];
  zine_cycles: DbZineCycleRow[];
  zines: DbZineRow[];
  zine_pages: DbZinePageRow[];
  event_logs: DbEventLogRow[];
}

