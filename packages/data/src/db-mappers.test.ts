import { describe, expect, it } from "vitest";
import type { EventLog, Zine, ZinePage } from "@mewri/core";
import {
  eventLogFromDbRow,
  eventLogToDbRow,
  mewriStateFromDbRows,
  mewriStateToDbRows,
  userFromDbRow,
  userToDbRow,
  zineFromDbRow,
  zinePageFromDbRow,
  zinePageToDbRow,
  zineToDbRow
} from "./db-mappers";
import { createSeedState } from "./seed";

describe("database row mappers", () => {
  it("roundtrips the seeded Mewri state through database row shapes", () => {
    const state = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const rows = mewriStateToDbRows(state);
    const roundtripped = mewriStateFromDbRows(rows);

    expect(rows).toMatchObject({
      users: [{ display_name: "Demo User", created_at: "2026-05-20T09:00:00.000Z" }],
      groups: [{ created_by: "user_demo" }],
      group_members: [{ group_id: "group_first", user_id: "user_demo" }],
      zine_cycles: [{ group_id: "group_first", start_date: "2026-05-20", end_date: "2026-05-22" }],
      event_logs: [{ event_name: "seed_created", entity_type: "zine_cycle" }]
    });
    expect(rows.themes).toHaveLength(3);
    expect(rows.themes[0]).toHaveProperty("zine_cycle_id");
    expect(roundtripped).toEqual(state);
  });

  it("maps optional domain fields to nullable database fields", () => {
    const user = {
      id: "user_without_optional_fields",
      displayName: "Optional User",
      username: "optional",
      createdAt: "2026-05-20T09:00:00.000Z",
      updatedAt: "2026-05-20T09:00:00.000Z"
    };

    const row = userToDbRow(user);

    expect(row).toEqual({
      id: "user_without_optional_fields",
      display_name: "Optional User",
      username: "optional",
      avatar_url: null,
      bio: null,
      created_at: "2026-05-20T09:00:00.000Z",
      updated_at: "2026-05-20T09:00:00.000Z"
    });
    expect(userFromDbRow(row)).toEqual(user);
  });

  it("maps ZINE nullable fields without leaking null into domain models", () => {
    const zine: Zine = {
      id: "zine_1",
      zineCycleId: "cycle_1",
      groupId: "group_first",
      title: "ZINE 1",
      intro: "Intro",
      status: "draft",
      createdAt: "2026-05-23T00:00:00.000Z"
    };

    const row = zineToDbRow(zine);

    expect(row).toMatchObject({
      zine_cycle_id: "cycle_1",
      group_id: "group_first",
      cover_post_id: null,
      published_at: null
    });
    expect(zineFromDbRow(row)).toEqual(zine);
  });

  it("maps ZINE page nullable editorial fields without leaking null into domain models", () => {
    const page: ZinePage = {
      id: "page_1",
      zineId: "zine_1",
      postId: "post_1",
      pageNumber: 1,
      layoutType: "cover",
      createdAt: "2026-05-23T00:00:00.000Z"
    };

    const row = zinePageToDbRow(page, "group_first");

    expect(row).toMatchObject({
      group_id: "group_first",
      zine_id: "zine_1",
      post_id: "post_1",
      page_number: 1,
      layout_type: "cover",
      ai_caption: null,
      editor_note: null
    });
    expect(zinePageFromDbRow(row)).toEqual(page);
  });

  it("derives ZINE page group rows from the parent ZINE without exposing persistence fields to the domain page", () => {
    const state = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const zine: Zine = {
      id: "zine_1",
      zineCycleId: state.zineCycles[0]!.id,
      groupId: state.groups[0]!.id,
      title: "ZINE 1",
      intro: "Intro",
      status: "published",
      createdAt: "2026-05-23T00:00:00.000Z",
      publishedAt: "2026-05-23T00:00:00.000Z"
    };
    const page: ZinePage = {
      id: "page_1",
      zineId: zine.id,
      postId: "post_1",
      pageNumber: 1,
      layoutType: "cover",
      createdAt: "2026-05-23T00:00:00.000Z"
    };

    const rows = mewriStateToDbRows({ ...state, zines: [zine], zinePages: [page] });

    expect(rows.zine_pages[0]).toMatchObject({ group_id: "group_first", zine_id: "zine_1" });
    expect(mewriStateFromDbRows(rows).zinePages[0]).toEqual(page);
  });

  it("rejects orphan ZINE pages instead of producing rows without a security group boundary", () => {
    const state = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const page: ZinePage = {
      id: "page_orphan",
      zineId: "missing_zine",
      postId: "post_1",
      pageNumber: 1,
      layoutType: "cover",
      createdAt: "2026-05-23T00:00:00.000Z"
    };

    expect(() => mewriStateToDbRows({ ...state, zinePages: [page] })).toThrowError(
      "Cannot persist ZINE page page_orphan without its parent ZINE group."
    );
  });

  it("maps EventLog metadata undefined values to database null and back", () => {
    const event: EventLog = {
      id: "event_1",
      userId: "user_demo",
      groupId: "group_first",
      eventName: "post_created",
      entityType: "post",
      entityId: "post_1",
      metadata: {
        themeId: "theme_1",
        count: 1,
        visible: true,
        optional: undefined
      },
      createdAt: "2026-05-20T10:00:00.000Z"
    };

    const row = eventLogToDbRow(event);

    expect(row).toEqual({
      id: "event_1",
      user_id: "user_demo",
      group_id: "group_first",
      event_name: "post_created",
      entity_type: "post",
      entity_id: "post_1",
      metadata: {
        themeId: "theme_1",
        count: 1,
        visible: true,
        optional: null
      },
      created_at: "2026-05-20T10:00:00.000Z"
    });
    expect(eventLogFromDbRow(row)).toEqual(event);
  });

  it("maps nullable EventLog owner and entity fields back to optional domain fields", () => {
    const event = eventLogFromDbRow({
      id: "event_system",
      user_id: null,
      group_id: null,
      event_name: "system_event",
      entity_type: null,
      entity_id: null,
      metadata: null,
      created_at: "2026-05-20T10:00:00.000Z"
    });

    expect(event).toEqual({
      id: "event_system",
      eventName: "system_event",
      createdAt: "2026-05-20T10:00:00.000Z"
    });
  });
});


