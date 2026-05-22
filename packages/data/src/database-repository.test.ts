import { describe, expect, it } from "vitest";
import { createDatabaseRepository, createTestDatabaseRepositoryHarness } from "./database-repository";
import { createSeedState } from "./seed";
import { createServerMewriAppService, createServerRepository } from "./server-repository-factory";

describe("database repository skeleton", () => {
  it("is intentionally unavailable by default", () => {
    expect(() => createDatabaseRepository()).toThrowError(
      "Database-backed MewriRepository is not implemented yet."
    );
  });

  it("does not silently fall back when database mode is requested", () => {
    expect(() => createServerRepository({ mode: "database" })).toThrowError(
      "Database-backed MewriRepository is not implemented yet."
    );
  });

  it("can still create the supported server-side memory demo repository path", () => {
    const seed = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const repository = createServerRepository({ mode: "memory_demo", seedState: seed });
    const state = repository.load();

    expect(state.groups[0]).toMatchObject({ id: "group_first", name: "First Mewri" });
    expect(state.themes).toHaveLength(3);
    expect("users" in state).toBe(true);
    expect("group_members" in (state as Record<string, unknown>)).toBe(false);
  });

  it("creates a test-only database-shaped harness that maps through db rows", () => {
    const seed = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const harness = createTestDatabaseRepositoryHarness(seed);

    const state = harness.repository.load();
    const rows = harness.readRows();

    expect(state.groupMembers).toHaveLength(1);
    expect(state.groupMembers[0]).toHaveProperty("groupId", "group_first");
    expect(rows.group_members).toHaveLength(1);
    expect(rows.group_members[0]).toHaveProperty("group_id", "group_first");
    expect(rows.group_members[0]).not.toHaveProperty("groupId");
  });

  it("can still create the supported server-side app service path", () => {
    const seed = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const appService = createServerMewriAppService({ mode: "memory_demo", seedState: seed });

    const state = appService.load();
    expect(state.users).toHaveLength(1);

    const nextState = appService.commands.submitPost({
      context: {
        currentUserId: state.users[0]!.id,
        requestSource: "server_action"
      },
      input: {
        userId: state.users[0]!.id,
        groupId: state.groups[0]!.id,
        themeId: state.themes[0]!.id,
        imageUrl: "https://example.com/server-post.jpg",
        caption: "server-side path"
      }
    });

    expect(nextState.posts[0]).toMatchObject({
      caption: "server-side path",
      groupId: state.groups[0]!.id
    });
    expect(nextState.eventLogs[0]).toMatchObject({
      eventName: "post_created"
    });
  });

  it("does not leak raw db row shape to repository callers", () => {
    const harness = createTestDatabaseRepositoryHarness(createSeedState(new Date("2026-05-20T09:00:00.000Z")));

    const state = harness.repository.load();

    expect(state.users[0]).toHaveProperty("displayName");
    expect(state.users[0]).not.toHaveProperty("display_name");
    expect(state.zineCycles[0]).toHaveProperty("startDate");
    expect(state.zineCycles[0]).not.toHaveProperty("start_date");
  });
});
