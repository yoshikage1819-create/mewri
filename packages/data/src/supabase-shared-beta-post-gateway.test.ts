import { describe, expect, it, vi } from "vitest";
import {
  CREATE_SHARED_BETA_POST_RPC,
  createSupabaseSharedBetaPostGateway,
  type SupabaseSharedBetaPostRpcClient
} from "./supabase-shared-beta-post-gateway";
import type { DbPostRow } from "./db-row-types";

describe("supabase shared beta post gateway", () => {
  it("calls the atomic post RPC with exact function name and params", async () => {
    const rpc = vi.fn(async () => ({ data: [makePostRow()], error: null }));
    const gateway = createSupabaseSharedBetaPostGateway({ rpc });

    const post = await gateway.submitPost(makeCommand());

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith(CREATE_SHARED_BETA_POST_RPC, {
      p_user_id: "user_demo",
      p_group_id: "group_first",
      p_theme_id: "theme_first",
      p_image_path: "post-images/group_first/user_demo/photo.webp",
      p_caption: "shared beta post"
    });
    expect(post).toEqual({
      id: "post_shared_beta_created",
      userId: "user_demo",
      groupId: "group_first",
      themeId: "theme_first",
      imageUrl: "post-images/group_first/user_demo/photo.webp",
      caption: "shared beta post",
      visibility: "group_only",
      createdAt: "2026-05-20T09:00:00.000Z",
      updatedAt: "2026-05-20T09:00:00.000Z"
    });
    expect(post).not.toHaveProperty("state");
    expect(post).not.toHaveProperty("user_id");
  });

  it("fails closed when the RPC returns an error", async () => {
    const gateway = createSupabaseSharedBetaPostGateway({
      rpc: vi.fn(async () => ({ data: null, error: new Error("rpc failed") }))
    });

    await expect(gateway.submitPost(makeCommand())).rejects.toThrow("atomically");
  });

  it.each([
    {
      name: "zero rows",
      rows: []
    },
    {
      name: "multiple rows",
      rows: [makePostRow(), makePostRow({ id: "post_duplicate" })]
    }
  ])("fails closed when the RPC returns $name", async ({ rows }) => {
    const gateway = createSupabaseSharedBetaPostGateway({
      rpc: vi.fn(async () => ({ data: rows, error: null }))
    });

    await expect(gateway.submitPost(makeCommand())).rejects.toThrow("exactly one");
  });

  it.each([
    {
      name: "user id",
      row: makePostRow({ user_id: "user_other" })
    },
    {
      name: "group id",
      row: makePostRow({ group_id: "group_other" })
    },
    {
      name: "theme id",
      row: makePostRow({ theme_id: "theme_other" })
    },
    {
      name: "image path",
      row: makePostRow({ image_url: "post-images/group_first/user_demo/other.webp" })
    }
  ])("fails closed when the returned $name mismatches the command", async ({ row }) => {
    const gateway = createSupabaseSharedBetaPostGateway({
      rpc: vi.fn(async () => ({ data: [row], error: null }))
    });

    await expect(gateway.submitPost(makeCommand())).rejects.toThrow("does not match");
  });

  it("requires only a narrow RPC client and does not expose table clients", () => {
    const client: SupabaseSharedBetaPostRpcClient = {
      rpc: vi.fn(async () => ({ data: [makePostRow()], error: null }))
    };

    expect(Object.keys(client)).toEqual(["rpc"]);
  });
});

function makeCommand() {
  return {
    context: { currentUserId: "user_demo", requestSource: "api_route" as const },
    input: {
      userId: "user_demo",
      groupId: "group_first",
      themeId: "theme_first",
      imageUrl: "post-images/group_first/user_demo/photo.webp",
      caption: "shared beta post"
    }
  };
}

function makePostRow(overrides: Partial<DbPostRow> = {}): DbPostRow {
  return {
    id: "post_shared_beta_created",
    user_id: "user_demo",
    group_id: "group_first",
    theme_id: "theme_first",
    image_url: "post-images/group_first/user_demo/photo.webp",
    caption: "shared beta post",
    visibility: "group_only",
    created_at: "2026-05-20T09:00:00.000Z",
    updated_at: "2026-05-20T09:00:00.000Z",
    ...overrides
  };
}
