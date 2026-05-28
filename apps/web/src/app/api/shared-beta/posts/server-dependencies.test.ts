import type { Group, Theme } from "@mewri/core";
import { createMemoryRepository, createSeedState } from "@mewri/data";
import type { SupabaseAuthSessionClient } from "@mewri/data/src/supabase-auth-session";
import type {
  SharedBetaPostImageFile,
  SharedBetaPostImageStorageClient
} from "@mewri/data/src/supabase-post-image-storage";
import { describe, expect, it, vi } from "vitest";
import { createSharedBetaPostRouteHandler } from "./route-boundary";
import {
  createSharedBetaPostServerDependenciesFromEnvironment,
  type SharedBetaPostServerDependencyFactoryOptions
} from "./server-dependencies";

const SHARED_ENVIRONMENT = {
  MEWRI_RUNTIME_MODE: "shared_beta",
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-only-server-secret",
  SUPABASE_POST_IMAGE_BUCKET: "post-images"
};

describe("shared beta post server dependency factory", () => {
  it("keeps the route unavailable when shared beta env is missing or incomplete", async () => {
    const authClient: SupabaseAuthSessionClient = {
      getUser: vi.fn(async () => ({ data: { user: { id: "user_demo" } } }))
    };
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(
        { MEWRI_RUNTIME_MODE: "shared_beta", SUPABASE_URL: "https://project.supabase.co" },
        { authClient }
      )
    );

    const response = await handler(makeJsonRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: { code: "shared_beta_route_unavailable" } });
    expect(authClient.getUser).not.toHaveBeenCalled();
  });

  it("keeps the route unavailable when complete env lacks injected server clients", async () => {
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(SHARED_ENVIRONMENT)
    );

    const response = await handler(makeJsonRequest());

    expect(response.status).toBe(503);
  });

  it("rejects missing or invalid sessions before image upload and post creation", async () => {
    const uploadObject = vi.fn();
    const rpc = vi.fn();
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(SHARED_ENVIRONMENT, {
        ...makeCompleteOptions({
          authClient: { getUser: vi.fn(async () => ({ error: new Error("invalid token") })) },
          imageStorageClient: { uploadObject },
          postGatewayClient: { rpc }
        })
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer bad_token" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ ok: false, error: { code: "authentication_required" } });
    expect(uploadObject).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects bad image MIME types before post creation", async () => {
    const rpc = vi.fn();
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(SHARED_ENVIRONMENT, {
        ...makeCompleteOptions({
          postGatewayClient: { rpc },
          resolveImageFile: async () => makeFile({ name: "photo.gif", type: "image/gif", size: 12 })
        })
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer token_a" }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, error: { code: "validated_image_required" } });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not upload before membership and active-theme authorization passes", async () => {
    const uploadObject = vi.fn();
    const rpc = vi.fn();
    const resolveImageFile = vi.fn(async () => makeFile({ name: "photo.webp", type: "image/webp", size: 12 }));
    const otherGroup = makeOtherGroup();
    const otherTheme = makeOtherTheme(otherGroup);
    const seedState = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(SHARED_ENVIRONMENT, {
        ...makeCompleteOptions({
          repository: createMemoryRepository({
            ...seedState,
            groups: [...seedState.groups, otherGroup],
            themes: [...seedState.themes, otherTheme]
          }),
          imageStorageClient: { uploadObject },
          postGatewayClient: { rpc },
          resolveImageFile
        })
      })
    );

    const response = await handler(
      makeJsonRequest({
        authorization: "Bearer token_a",
        body: {
          userId: "user_demo",
          groupId: otherGroup.id,
          themeId: otherTheme.id,
          caption: "shared beta post"
        }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, error: { code: "validated_image_required" } });
    expect(resolveImageFile).not.toHaveBeenCalled();
    expect(uploadObject).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("wires auth, server image upload, authorization, and the atomic post gateway", async () => {
    const uploadObject = vi.fn(async () => ({ ok: true as const }));
    const rpc = vi.fn(async () => ({
      error: null,
      data: [
        {
        id: "post_shared_beta_created",
        user_id: "user_demo",
        group_id: "group_first",
        theme_id: "theme_cycle_group_first_2026-05-20_1",
        image_url: "post-images/group_first/user_demo/photo.webp",
        caption: "shared beta post",
        visibility: "group_only" as const,
        created_at: "2026-05-20T09:00:00.000Z",
        updated_at: "2026-05-20T09:00:00.000Z"
        }
      ]
    }));
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(SHARED_ENVIRONMENT, {
        ...makeCompleteOptions({
          imageStorageClient: { uploadObject },
          postGatewayClient: { rpc }
        })
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer token_a" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      post: {
        id: "post_shared_beta_created",
        userId: "user_demo",
        groupId: "group_first",
        themeId: "theme_cycle_group_first_2026-05-20_1",
        imageUrl: "post-images/group_first/user_demo/photo.webp",
        caption: "shared beta post",
        visibility: "group_only",
        createdAt: "2026-05-20T09:00:00.000Z",
        updatedAt: "2026-05-20T09:00:00.000Z"
      }
    });
    expect(body).not.toHaveProperty("state");
    expect(uploadObject).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "post-images",
        objectPath: "group_first/user_demo/photo.webp",
        contentType: "image/webp"
      })
    );
    expect(rpc).toHaveBeenCalledWith("create_shared_beta_post", {
      p_user_id: "user_demo",
      p_group_id: "group_first",
      p_theme_id: "theme_cycle_group_first_2026-05-20_1",
      p_image_path: "post-images/group_first/user_demo/photo.webp",
      p_caption: "shared beta post"
    });
  });
});

function makeCompleteOptions(
  overrides: Partial<SharedBetaPostServerDependencyFactoryOptions> = {}
): SharedBetaPostServerDependencyFactoryOptions {
  return {
    authClient: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user_demo" } } }))
    },
    imageStorageClient: {
      uploadObject: vi.fn(async () => ({ ok: true }))
    },
    postGatewayClient: {
      rpc: vi.fn()
    },
    repository: createMemoryRepository(createSeedState(new Date("2026-05-20T09:00:00.000Z"))),
    resolveImageFile: async () => makeFile({ name: "photo.webp", type: "image/webp", size: 12 }),
    generateImageFilename: () => "photo.webp",
    ...overrides
  };
}

function makeJsonRequest(options?: {
  authorization?: string;
  body?: {
    userId: string;
    groupId: string;
    themeId: string;
    caption?: string;
  };
}): Request {
  return new Request("http://localhost/api/shared-beta/posts", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(options?.authorization ? { authorization: options.authorization } : {})
    },
    body: JSON.stringify(
      options?.body ?? {
        userId: "user_demo",
        groupId: "group_first",
        themeId: "theme_cycle_group_first_2026-05-20_1",
        caption: "shared beta post"
      }
    )
  });
}

function makeFile(input: { name: string; type: string; size: number }): SharedBetaPostImageFile {
  return {
    ...input,
    async arrayBuffer() {
      return new ArrayBuffer(input.size);
    }
  };
}

function makeOtherGroup(): Group {
  return {
    id: "group_other",
    name: "Other",
    description: "Other invited group",
    visibility: "invite_only",
    createdBy: "user_other",
    createdAt: "2026-05-20T09:00:00.000Z",
    updatedAt: "2026-05-20T09:00:00.000Z"
  };
}

function makeOtherTheme(group: Group): Theme {
  return {
    id: "theme_other_active",
    groupId: group.id,
    zineCycleId: "cycle_other",
    title: "Other active theme",
    description: "Other active theme",
    themeDate: "2026-05-20",
    source: "ai",
    status: "active",
    createdAt: "2026-05-20T09:00:00.000Z"
  };
}
