export interface DataTableSchema {
  tableName: string;
  primaryKey: string;
  columns: DataColumnSchema[];
  indexes: string[];
}

export interface DataColumnSchema {
  name: string;
  type: "text" | "integer" | "timestamp" | "json";
  nullable?: boolean;
  references?: string;
}

export const mewriDataSchemaV03: DataTableSchema[] = [
  {
    tableName: "users",
    primaryKey: "id",
    columns: [
      { name: "id", type: "text" },
      { name: "display_name", type: "text" },
      { name: "username", type: "text" },
      { name: "avatar_url", type: "text", nullable: true },
      { name: "bio", type: "text", nullable: true },
      { name: "created_at", type: "timestamp" },
      { name: "updated_at", type: "timestamp" }
    ],
    indexes: ["unique(username)"]
  },
  {
    tableName: "groups",
    primaryKey: "id",
    columns: [
      { name: "id", type: "text" },
      { name: "name", type: "text" },
      { name: "description", type: "text" },
      { name: "visibility", type: "text" },
      { name: "created_by", type: "text", references: "users.id" },
      { name: "created_at", type: "timestamp" },
      { name: "updated_at", type: "timestamp" }
    ],
    indexes: ["created_by", "visibility"]
  },
  {
    tableName: "group_members",
    primaryKey: "id",
    columns: [
      { name: "id", type: "text" },
      { name: "group_id", type: "text", references: "groups.id" },
      { name: "user_id", type: "text", references: "users.id" },
      { name: "role", type: "text" },
      { name: "joined_at", type: "timestamp" }
    ],
    indexes: ["unique(group_id, user_id)", "user_id"]
  },
  {
    tableName: "zine_cycles",
    primaryKey: "id",
    columns: [
      { name: "id", type: "text" },
      { name: "group_id", type: "text", references: "groups.id" },
      { name: "title", type: "text" },
      { name: "start_date", type: "text" },
      { name: "end_date", type: "text" },
      { name: "status", type: "text" },
      { name: "created_at", type: "timestamp" },
      { name: "updated_at", type: "timestamp" }
    ],
    indexes: ["group_id, start_date", "group_id, status"]
  },
  {
    tableName: "themes",
    primaryKey: "id",
    columns: [
      { name: "id", type: "text" },
      { name: "group_id", type: "text", references: "groups.id" },
      { name: "zine_cycle_id", type: "text", references: "zine_cycles.id" },
      { name: "title", type: "text" },
      { name: "description", type: "text" },
      { name: "theme_date", type: "text" },
      { name: "source", type: "text" },
      { name: "status", type: "text" },
      { name: "created_at", type: "timestamp" }
    ],
    indexes: ["group_id, theme_date", "zine_cycle_id", "status"]
  },
  {
    tableName: "posts",
    primaryKey: "id",
    columns: [
      { name: "id", type: "text" },
      { name: "user_id", type: "text", references: "users.id" },
      { name: "group_id", type: "text", references: "groups.id" },
      { name: "theme_id", type: "text", references: "themes.id" },
      { name: "image_url", type: "text" },
      { name: "caption", type: "text" },
      { name: "visibility", type: "text" },
      { name: "created_at", type: "timestamp" },
      { name: "updated_at", type: "timestamp" }
    ],
    indexes: ["group_id, created_at desc", "theme_id, created_at desc", "user_id, created_at desc"]
  },
  {
    tableName: "zines",
    primaryKey: "id",
    columns: [
      { name: "id", type: "text" },
      { name: "zine_cycle_id", type: "text", references: "zine_cycles.id" },
      { name: "group_id", type: "text", references: "groups.id" },
      { name: "title", type: "text" },
      { name: "intro", type: "text" },
      { name: "cover_post_id", type: "text", nullable: true, references: "posts.id" },
      { name: "status", type: "text" },
      { name: "created_at", type: "timestamp" },
      { name: "published_at", type: "timestamp", nullable: true }
    ],
    indexes: ["unique(zine_cycle_id)", "group_id, published_at desc", "status"]
  },
  {
    tableName: "zine_pages",
    primaryKey: "id",
    columns: [
      { name: "id", type: "text" },
      { name: "zine_id", type: "text", references: "zines.id" },
      { name: "post_id", type: "text", references: "posts.id" },
      { name: "page_number", type: "integer" },
      { name: "layout_type", type: "text" },
      { name: "ai_caption", type: "text", nullable: true },
      { name: "editor_note", type: "text", nullable: true },
      { name: "created_at", type: "timestamp" }
    ],
    indexes: ["unique(zine_id, page_number)", "post_id"]
  },
  {
    tableName: "event_logs",
    primaryKey: "id",
    columns: [
      { name: "id", type: "text" },
      { name: "user_id", type: "text", nullable: true, references: "users.id" },
      { name: "group_id", type: "text", nullable: true, references: "groups.id" },
      { name: "event_name", type: "text" },
      { name: "entity_type", type: "text", nullable: true },
      { name: "entity_id", type: "text", nullable: true },
      { name: "metadata", type: "json", nullable: true },
      { name: "created_at", type: "timestamp" }
    ],
    indexes: ["group_id, created_at desc", "user_id, created_at desc", "entity_type, entity_id"]
  }
];

