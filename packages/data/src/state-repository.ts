import type { MewriState } from "@mewri/core";
import { replaceById, type MewriRepository } from "./repository";

export interface MewriStateStore {
  load(): MewriState;
  save(state: MewriState): void;
  reset(): MewriState;
}

export function createStateRepository(store: MewriStateStore): MewriRepository {
  const updateState = (updater: (state: MewriState) => MewriState) => {
    const nextState = updater(store.load());
    store.save(nextState);
    return nextState;
  };

  return {
    load: store.load,
    save: store.save,
    reset: store.reset,
    users: {
      list: () => store.load().users,
      getById: (id) => store.load().users.find((user) => user.id === id),
      upsert: (user) => {
        updateState((state) => ({ ...state, users: replaceById(state.users, user) }));
      }
    },
    groups: {
      list: () => store.load().groups,
      getById: (id) => store.load().groups.find((group) => group.id === id),
      upsert: (group) => {
        updateState((state) => ({ ...state, groups: replaceById(state.groups, group) }));
      }
    },
    groupMembers: {
      list: () => store.load().groupMembers,
      listByGroupId: (groupId) => store.load().groupMembers.filter((member) => member.groupId === groupId),
      listByUserId: (userId) => store.load().groupMembers.filter((member) => member.userId === userId),
      upsert: (member) => {
        updateState((state) => ({ ...state, groupMembers: replaceById(state.groupMembers, member) }));
      }
    },
    themes: {
      list: () => store.load().themes,
      listByGroupId: (groupId) => store.load().themes.filter((theme) => theme.groupId === groupId),
      listByZineCycleId: (zineCycleId) => store.load().themes.filter((theme) => theme.zineCycleId === zineCycleId),
      getById: (id) => store.load().themes.find((theme) => theme.id === id),
      upsert: (theme) => {
        updateState((state) => ({ ...state, themes: replaceById(state.themes, theme) }));
      }
    },
    posts: {
      list: () => store.load().posts,
      listByGroupId: (groupId) => store.load().posts.filter((post) => post.groupId === groupId),
      listByThemeId: (themeId) => store.load().posts.filter((post) => post.themeId === themeId),
      getById: (id) => store.load().posts.find((post) => post.id === id),
      prepend: (post) => {
        updateState((state) => ({ ...state, posts: [post, ...state.posts.filter((item) => item.id !== post.id)] }));
      },
      upsert: (post) => {
        updateState((state) => ({ ...state, posts: replaceById(state.posts, post) }));
      }
    },
    zineCycles: {
      list: () => store.load().zineCycles,
      listByGroupId: (groupId) => store.load().zineCycles.filter((cycle) => cycle.groupId === groupId),
      getById: (id) => store.load().zineCycles.find((cycle) => cycle.id === id),
      upsert: (cycle) => {
        updateState((state) => ({ ...state, zineCycles: replaceById(state.zineCycles, cycle) }));
      }
    },
    zines: {
      list: () => store.load().zines,
      listByGroupId: (groupId) => store.load().zines.filter((zine) => zine.groupId === groupId),
      getById: (id) => store.load().zines.find((zine) => zine.id === id),
      getByZineCycleId: (zineCycleId) => store.load().zines.find((zine) => zine.zineCycleId === zineCycleId),
      upsert: (zine) => {
        updateState((state) => ({ ...state, zines: replaceById(state.zines, zine) }));
      }
    },
    zinePages: {
      list: () => store.load().zinePages,
      listByZineId: (zineId) =>
        store
          .load()
          .zinePages.filter((page) => page.zineId === zineId)
          .sort((a, b) => a.pageNumber - b.pageNumber),
      getById: (id) => store.load().zinePages.find((page) => page.id === id),
      replaceForZine: (zineId, pages) => {
        updateState((state) => ({
          ...state,
          zinePages: [...state.zinePages.filter((page) => page.zineId !== zineId), ...pages]
        }));
      },
      upsert: (page) => {
        updateState((state) => ({ ...state, zinePages: replaceById(state.zinePages, page) }));
      }
    },
    eventLogs: {
      list: () => store.load().eventLogs,
      listByGroupId: (groupId) => store.load().eventLogs.filter((event) => event.groupId === groupId),
      listByUserId: (userId) => store.load().eventLogs.filter((event) => event.userId === userId),
      prepend: (event) => {
        updateState((state) => ({ ...state, eventLogs: [event, ...state.eventLogs] }));
      }
    }
  };
}

