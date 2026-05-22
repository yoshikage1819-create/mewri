import type {
  EventLog,
  MewriState,
  Group,
  GroupMember,
  ID,
  Post,
  Theme,
  User,
  Zine,
  ZineCycle,
  ZinePage
} from "@mewri/core";

export interface MewriRepository {
  load(): MewriState;
  save(state: MewriState): void;
  reset(): MewriState;
  users: UserRepository;
  groups: GroupRepository;
  groupMembers: GroupMemberRepository;
  themes: ThemeRepository;
  posts: PostRepository;
  zineCycles: ZineCycleRepository;
  zines: ZineRepository;
  zinePages: ZinePageRepository;
  eventLogs: EventLogRepository;
}

export interface UserRepository {
  list(): User[];
  getById(id: ID): User | undefined;
  upsert(user: User): void;
}

export interface GroupRepository {
  list(): Group[];
  getById(id: ID): Group | undefined;
  upsert(group: Group): void;
}

export interface GroupMemberRepository {
  list(): GroupMember[];
  listByGroupId(groupId: ID): GroupMember[];
  listByUserId(userId: ID): GroupMember[];
  upsert(member: GroupMember): void;
}

export interface ThemeRepository {
  list(): Theme[];
  listByGroupId(groupId: ID): Theme[];
  listByZineCycleId(zineCycleId: ID): Theme[];
  getById(id: ID): Theme | undefined;
  upsert(theme: Theme): void;
}

export interface PostRepository {
  list(): Post[];
  listByGroupId(groupId: ID): Post[];
  listByThemeId(themeId: ID): Post[];
  getById(id: ID): Post | undefined;
  prepend(post: Post): void;
  upsert(post: Post): void;
}

export interface ZineCycleRepository {
  list(): ZineCycle[];
  listByGroupId(groupId: ID): ZineCycle[];
  getById(id: ID): ZineCycle | undefined;
  upsert(cycle: ZineCycle): void;
}

export interface ZineRepository {
  list(): Zine[];
  listByGroupId(groupId: ID): Zine[];
  getById(id: ID): Zine | undefined;
  getByZineCycleId(zineCycleId: ID): Zine | undefined;
  upsert(zine: Zine): void;
}

export interface ZinePageRepository {
  list(): ZinePage[];
  listByZineId(zineId: ID): ZinePage[];
  getById(id: ID): ZinePage | undefined;
  replaceForZine(zineId: ID, pages: ZinePage[]): void;
  upsert(page: ZinePage): void;
}

export interface EventLogRepository {
  list(): EventLog[];
  listByGroupId(groupId: ID): EventLog[];
  listByUserId(userId: ID): EventLog[];
  prepend(event: EventLog): void;
}

export function replaceById<T extends { id: ID }>(items: T[], nextItem: T): T[] {
  const exists = items.some((item) => item.id === nextItem.id);
  if (!exists) return [...items, nextItem];
  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

