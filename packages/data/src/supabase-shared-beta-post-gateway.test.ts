import { describe, expect, it, vi } from "vitest";
import { createSupabaseSharedBetaPostGateway, type SupabaseSharedBetaPostGatewayClient } from "./supabase-shared-beta-post-gateway";

describe("supabase shared beta post gateway", () => {
  it("creates one post and one event through the atomic gateway client", async () => {
    const client: SupabaseSharedBetaPostGatewayClient = {
      createPostWithEvent: vi.fn(async () => ({
        ok: true,
        eventCreated: true,
        post: {
          id: "post_shared_beta_created",
          user_id: "user_demo",
          group_id: "group_first",
          theme_id: "theme_first",
          image_url: "post-images/group_first/user_demo/photo.webp",
          caption: "shared beta post",
          visibility: "group_only",
          created_at: "2026-05-20T09:00:00.000Z",
          updated_at: "2026-05-20T09:00:00.000Z"
        }
      }))
    };

    const gateway = createSupabaseSharedBetaPostGateway(client);
    const post = await gateway.submitPost({
      context: { currentUserId: "user_demo", requestSource: "api_route" },
      input: {
        userId: "user_demo",
        groupId: "group_first",
        themeId: "theme_first",
        imageUrl: "post-images/group_first/user_demo/photo.webp",
        caption: "shared beta post"
      }
    });

    expect(client.createPostWithEvent).toHaveBeenCalledTimes(1);
    expect(client.createPostWithEvent).toHaveBeenCalledWith({
      userId: "user_demo",
      groupId: "group_first",
      themeId: "theme_first",
      imagePath: "post-images/group_first/user_demo/photo.webp",
      caption: "shared beta post"
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
  });

  it("fails closed when the atomic post and event operation fails", async () => {
    const client: SupabaseSharedBetaPostGatewayClient = {
      createPostWithEvent: vi.fn(async () => ({ ok: false, error: new Error("rpc failed") }))
    };
    const gateway = createSupabaseSharedBetaPostGateway(client);

    await expect(
      gateway.submitPost({
        context: { currentUserId: "user_demo", requestSource: "api_route" },
        input: {
          userId: "user_demo",
          groupId: "group_first",
          themeId: "theme_first",
          imageUrl: "post-images/group_first/user_demo/photo.webp",
          caption: "shared beta post"
        }
      })
    ).rejects.toThrow("atomically");
  });
});
