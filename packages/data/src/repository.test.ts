import { describe, expect, it } from "vitest";
import { createMemoryRepository } from "./memory-repository";
import { createEvent } from "./mvp-mutations";
import { createDeterministicSeedRepository, describeMewriRepositoryContract } from "./repository-contract.test-helper";

describeMewriRepositoryContract("memory", () => createDeterministicSeedRepository(createMemoryRepository));

describe("EventLog creation", () => {
  it("creates the expected event shape", () => {
    const event = createEvent({
      userId: "user_demo",
      groupId: "group_first",
      eventName: "post_created",
      entityType: "post",
      entityId: "post_1",
      metadata: { themeId: "theme_1", count: 1 },
      now: new Date("2026-05-20T10:00:00.000Z")
    });

    expect(event).toMatchObject({
      userId: "user_demo",
      groupId: "group_first",
      eventName: "post_created",
      entityType: "post",
      entityId: "post_1",
      metadata: { themeId: "theme_1", count: 1 },
      createdAt: "2026-05-20T10:00:00.000Z"
    });
    expect(event.id).toMatch(/^event_/);
  });
});

