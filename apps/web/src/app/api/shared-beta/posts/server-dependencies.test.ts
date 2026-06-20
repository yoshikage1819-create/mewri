import type { Group, Theme } from "@mewri/core";
import {
  createMemoryRepository,
  createRepositorySharedBetaPostAuthorizationSource,
  createSeedState
} from "@mewri/data";
import type { SupabaseAuthSessionClient } from "@mewri/data/src/supabase-auth-session";
import {
  createStorageSharedBetaPostImageUploadBroker,
  type SharedBetaPostImageUploadBroker
} from "@mewri/data/src/shared-beta-post-image-upload-broker";
import type {
  SharedBetaPostImageFile,
  SharedBetaPostImageStorageClient
} from "@mewri/data/src/supabase-post-image-storage";
import {
  createSupabaseSharedBetaPostAuthorizationSource,
  type SupabaseSharedBetaPostAuthorizationReadClient
} from "@mewri/data/src/supabase-shared-beta-post-authorization-source";
import { describe, expect, it, vi } from "vitest";
import { createSharedBetaPostRouteHandler } from "./route-boundary";
import {
  createSharedBetaPostServerDependenciesFromEnvironment,
  resolveStagingSharedBetaUploadBrokerEnvironment,
  resolveStagingSharedBetaPostRouteEnvironment,
  STAGING_SHARED_BETA_UPLOAD_BROKER_GATE,
  STAGING_SHARED_BETA_UPLOAD_BROKER_MODE,
  STAGING_SHARED_BETA_POST_ROUTE_GATE,
  type SharedBetaPostServerDependencyFactoryOptions
} from "./server-dependencies";

const ANON_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature";
const SECRET_KEY = "sb_secret_test_key";

const STAGING_ROUTE_ENVIRONMENT = {
  [STAGING_SHARED_BETA_POST_ROUTE_GATE]: "true",
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_ANON_KEY: ANON_KEY,
  SUPABASE_POST_IMAGE_BUCKET: "post-images"
};

const COMPLETE_STAGING_ROUTE_ENVIRONMENT = {
  ...STAGING_ROUTE_ENVIRONMENT,
  [STAGING_SHARED_BETA_UPLOAD_BROKER_GATE]: "true",
  [STAGING_SHARED_BETA_UPLOAD_BROKER_MODE]: "server",
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY
};

type UploadConfirmationInput = { bucket: string; objectPath: string };

describe("resolveStagingSharedBetaPostRouteEnvironment", () => {
  it("requires an explicit staging route gate before returning public Supabase config", () => {
    expect(
      resolveStagingSharedBetaPostRouteEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: ANON_KEY
      })
    ).toBeUndefined();

    expect(resolveStagingSharedBetaPostRouteEnvironment(STAGING_ROUTE_ENVIRONMENT)).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY,
      postImageBucket: "post-images"
    });
  });

  it("rejects incomplete config, non-public keys, and non-default image buckets", () => {
    expect(
      resolveStagingSharedBetaPostRouteEnvironment({
        [STAGING_SHARED_BETA_POST_ROUTE_GATE]: "true",
        SUPABASE_URL: "https://project.supabase.co"
      })
    ).toBeUndefined();

    expect(
      resolveStagingSharedBetaPostRouteEnvironment({
        [STAGING_SHARED_BETA_POST_ROUTE_GATE]: "true",
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: SERVICE_ROLE_KEY
      })
    ).toBeUndefined();

    expect(
      resolveStagingSharedBetaPostRouteEnvironment({
        [STAGING_SHARED_BETA_POST_ROUTE_GATE]: "true",
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: SECRET_KEY
      })
    ).toBeUndefined();

    expect(
      resolveStagingSharedBetaPostRouteEnvironment({
        ...STAGING_ROUTE_ENVIRONMENT,
        SUPABASE_POST_IMAGE_BUCKET: "other-bucket"
      })
    ).toBeUndefined();
  });
});

describe("resolveStagingSharedBetaUploadBrokerEnvironment", () => {
  it("requires the explicit broker gate, server mode, and privileged broker credential", () => {
    expect(resolveStagingSharedBetaUploadBrokerEnvironment(STAGING_ROUTE_ENVIRONMENT)).toBeUndefined();

    expect(
      resolveStagingSharedBetaUploadBrokerEnvironment({
        ...STAGING_ROUTE_ENVIRONMENT,
        [STAGING_SHARED_BETA_UPLOAD_BROKER_GATE]: "true"
      })
    ).toBeUndefined();

    expect(
      resolveStagingSharedBetaUploadBrokerEnvironment({
        ...STAGING_ROUTE_ENVIRONMENT,
        [STAGING_SHARED_BETA_UPLOAD_BROKER_GATE]: "true",
        [STAGING_SHARED_BETA_UPLOAD_BROKER_MODE]: "server"
      })
    ).toBeUndefined();

    expect(resolveStagingSharedBetaUploadBrokerEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT)).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY,
      postImageBucket: "post-images",
      privilegedKey: SERVICE_ROLE_KEY,
      uploadBrokerMode: "server"
    });

    expect(
      resolveStagingSharedBetaUploadBrokerEnvironment({
        ...COMPLETE_STAGING_ROUTE_ENVIRONMENT,
        SUPABASE_SERVICE_ROLE_KEY: ANON_KEY
      })
    ).toBeUndefined();
  });
});

describe("shared beta post server dependency factory", () => {
  it("keeps the route unavailable when the explicit staging gate is missing", async () => {
    const authClient: SupabaseAuthSessionClient = {
      getUser: vi.fn(async () => ({ data: { user: { id: "user_demo" } } }))
    };
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(
        {
          SUPABASE_URL: "https://project.supabase.co",
          SUPABASE_ANON_KEY: ANON_KEY
        },
        { ...makeCompleteOptions({ authClient }) }
      )
    );

    const response = await handler(makeJsonRequest());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: { code: "shared_beta_route_unavailable" } });
    expect(authClient.getUser).not.toHaveBeenCalled();
  });

  it("keeps the route unavailable when the staging route gate is set without the broker gate", async () => {
    const authClient: SupabaseAuthSessionClient = {
      getUser: vi.fn(async () => ({ data: { user: { id: "user_demo" } } }))
    };
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(
        STAGING_ROUTE_ENVIRONMENT,
        { ...makeCompleteOptions({ authClient }) }
      )
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer token_a" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: { code: "shared_beta_route_unavailable" } });
    expect(authClient.getUser).not.toHaveBeenCalled();
  });

  it("keeps the route unavailable when the broker gate lacks server mode", async () => {
    const authClient: SupabaseAuthSessionClient = {
      getUser: vi.fn(async () => ({ data: { user: { id: "user_demo" } } }))
    };
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(
        {
          ...STAGING_ROUTE_ENVIRONMENT,
          [STAGING_SHARED_BETA_UPLOAD_BROKER_GATE]: "true"
        },
        { ...makeCompleteOptions({ authClient }) }
      )
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer token_a" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: { code: "shared_beta_route_unavailable" } });
    expect(authClient.getUser).not.toHaveBeenCalled();
  });

  it("keeps the route unavailable when the privileged broker config is incomplete", async () => {
    const authClient: SupabaseAuthSessionClient = {
      getUser: vi.fn(async () => ({ data: { user: { id: "user_demo" } } }))
    };
    const imageUploadBrokerFactory = vi.fn();
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(
        {
          ...STAGING_ROUTE_ENVIRONMENT,
          [STAGING_SHARED_BETA_UPLOAD_BROKER_GATE]: "true",
          [STAGING_SHARED_BETA_UPLOAD_BROKER_MODE]: "server"
        },
        { ...makeCompleteOptions({ authClient, imageUploadBroker: undefined, imageUploadBrokerFactory }) }
      )
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer token_a" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: { code: "shared_beta_route_unavailable" } });
    expect(authClient.getUser).not.toHaveBeenCalled();
    expect(imageUploadBrokerFactory).not.toHaveBeenCalled();
  });

  it("keeps the route unavailable when public staging config lacks a trusted authorization source", async () => {
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        authClient: { getUser: vi.fn(async () => ({ data: { user: { id: "user_demo" } } })) },
        imageUploadBroker: makeBroker(vi.fn(async (input: UploadConfirmationInput) => confirmUpload(input))),
        postGatewayClient: { rpc: vi.fn() }
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer token_a" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: { code: "shared_beta_route_unavailable" } });
  });

  it("keeps the route unavailable when staging config has an authorization source but lacks trusted clients", async () => {
    const authClient: SupabaseAuthSessionClient = {
      getUser: vi.fn(async () => ({ data: { user: { id: "user_demo" } } }))
    };
    const repository = createMemoryRepository(createSeedState(new Date("2026-05-20T09:00:00.000Z")));
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        authClient,
        authorizationSource: createRepositorySharedBetaPostAuthorizationSource(repository)
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer token_a" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: { code: "shared_beta_route_unavailable" } });
    expect(authClient.getUser).not.toHaveBeenCalled();
  });

  it("keeps the route unavailable without explicit trusted broker wiring", async () => {
    const authClient: SupabaseAuthSessionClient = {
      getUser: vi.fn(async () => ({ data: { user: { id: "user_demo" } } }))
    };
    const repository = createMemoryRepository(createSeedState(new Date("2026-05-20T09:00:00.000Z")));
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        authClient,
        authorizationSource: createRepositorySharedBetaPostAuthorizationSource(repository),
        postGatewayClient: { rpc: vi.fn() }
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer token_a" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: { code: "shared_beta_route_unavailable" } });
    expect(authClient.getUser).not.toHaveBeenCalled();
  });

  it("rejects missing or invalid sessions before image upload and post creation", async () => {
    const uploadObject = vi.fn();
    const rpc = vi.fn();
    const imageUploadBrokerFactory = vi.fn(() => makeBroker(uploadObject));
    const postGatewayClientFactory = vi.fn(() => ({ rpc }));
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        ...makeCompleteOptions({
          authClient: { getUser: vi.fn(async () => ({ error: new Error("invalid token") })) },
          imageUploadBroker: undefined,
          imageUploadBrokerFactory,
          postGatewayClient: undefined,
          postGatewayClientFactory
        })
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer bad_token" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ ok: false, error: { code: "authentication_required" } });
    expect(imageUploadBrokerFactory).not.toHaveBeenCalled();
    expect(postGatewayClientFactory).not.toHaveBeenCalled();
    expect(uploadObject).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("treats thrown auth-client errors as authentication failures", async () => {
    const uploadObject = vi.fn();
    const rpc = vi.fn();
    const imageUploadBrokerFactory = vi.fn(() => makeBroker(uploadObject));
    const postGatewayClientFactory = vi.fn(() => ({ rpc }));
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        ...makeCompleteOptions({
          authClient: {
            getUser: vi.fn(async () => {
              throw new Error("malformed token");
            })
          },
          imageUploadBroker: undefined,
          imageUploadBrokerFactory,
          postGatewayClient: undefined,
          postGatewayClientFactory
        })
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer service_role" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ ok: false, error: { code: "authentication_required" } });
    expect(imageUploadBrokerFactory).not.toHaveBeenCalled();
    expect(postGatewayClientFactory).not.toHaveBeenCalled();
    expect(uploadObject).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects bad image MIME types before post creation", async () => {
    const rpc = vi.fn();
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
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

  it("fails closed when server image upload fails and does not call RPC", async () => {
    const uploadObject = vi.fn(async () => ({ ok: false as const, error: new Error("storage denied") }));
    const rpc = vi.fn();
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        ...makeCompleteOptions({
          imageUploadBroker: makeBroker(uploadObject),
          postGatewayClient: { rpc }
        })
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer token_a" }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, error: { code: "validated_image_required" } });
    expect(uploadObject).toHaveBeenCalledOnce();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fails closed when server image upload returns a mismatched bucket or path", async () => {
    const uploadObject = vi.fn(async (input: UploadConfirmationInput) => ({
      ok: true as const,
      bucket: "other-bucket",
      objectPath: input.objectPath
    }));
    const rpc = vi.fn();
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        ...makeCompleteOptions({
          imageUploadBroker: makeBroker(uploadObject),
          postGatewayClient: { rpc }
        })
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer token_a" }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, error: { code: "validated_image_required" } });
    expect(uploadObject).toHaveBeenCalledOnce();
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    ["missing image file", undefined],
    ["unsupported multipart image MIME type", makeBrowserFile("photo.gif", "image/gif", 12)],
    ["oversized multipart image", makeBrowserFile("photo.webp", "image/webp", 10 * 1024 * 1024 + 1)]
  ])("rejects %s before post creation", async (_label, image) => {
    const uploadObject = vi.fn();
    const rpc = vi.fn();
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        ...makeCompleteOptions({
          imageUploadBroker: makeBroker(uploadObject),
          postGatewayClient: { rpc },
          resolveImageFile: undefined
        })
      })
    );

    const response = await handler(makeMultipartRequest({ authorization: "Bearer token_a", image }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, error: { code: "validated_image_required" } });
    expect(uploadObject).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not upload before membership and active-theme authorization passes", async () => {
    const uploadObject = vi.fn();
    const rpc = vi.fn();
    const imageUploadBrokerFactory = vi.fn(() => makeBroker(uploadObject));
    const postGatewayClientFactory = vi.fn(() => ({ rpc }));
    const resolveImageFile = vi.fn(async () => makeFile({ name: "photo.webp", type: "image/webp", size: 12 }));
    const otherGroup = makeOtherGroup();
    const otherTheme = makeOtherTheme(otherGroup);
    const seedState = createSeedState(new Date("2026-05-20T09:00:00.000Z"));
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        ...makeCompleteOptions({
          authorizationSource: createRepositorySharedBetaPostAuthorizationSource(
            createMemoryRepository({
              ...seedState,
              groups: [...seedState.groups, otherGroup],
              themes: [...seedState.themes, otherTheme]
            })
          ),
          imageUploadBroker: undefined,
          imageUploadBrokerFactory,
          postGatewayClient: undefined,
          postGatewayClientFactory,
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
    expect(imageUploadBrokerFactory).not.toHaveBeenCalled();
    expect(postGatewayClientFactory).not.toHaveBeenCalled();
    expect(uploadObject).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("keeps Supabase-backed authorization denial before upload and RPC", async () => {
    const uploadObject = vi.fn();
    const rpc = vi.fn();
    const imageUploadBrokerFactory = vi.fn(() => makeBroker(uploadObject));
    const postGatewayClientFactory = vi.fn(() => ({ rpc }));
    const resolveImageFile = vi.fn(async () => makeFile({ name: "photo.webp", type: "image/webp", size: 12 }));
    const authorizationClient: SupabaseSharedBetaPostAuthorizationReadClient = {
      selectGroupMembership: vi.fn(async () => ({ data: [], error: null })),
      selectTheme: vi.fn(async () => ({
        data: [
          {
            id: "theme_other_active",
            group_id: "group_other",
            status: "active"
          }
        ],
        error: null
      }))
    };
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        ...makeCompleteOptions({
          authorizationSource: createSupabaseSharedBetaPostAuthorizationSource(authorizationClient),
          imageUploadBroker: undefined,
          imageUploadBrokerFactory,
          postGatewayClient: undefined,
          postGatewayClientFactory,
          resolveImageFile
        })
      })
    );

    const response = await handler(
      makeJsonRequest({
        authorization: "Bearer token_a",
        body: {
          userId: "user_demo",
          groupId: "group_other",
          themeId: "theme_other_active",
          caption: "shared beta post"
        }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, error: { code: "validated_image_required" } });
    expect(authorizationClient.selectGroupMembership).toHaveBeenCalledWith({
      groupId: "group_other",
      userId: "user_demo"
    });
    expect(authorizationClient.selectTheme).not.toHaveBeenCalled();
    expect(resolveImageFile).not.toHaveBeenCalled();
    expect(imageUploadBrokerFactory).not.toHaveBeenCalled();
    expect(postGatewayClientFactory).not.toHaveBeenCalled();
    expect(uploadObject).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("wires auth, server image upload, authorization, and the atomic post gateway", async () => {
    const uploadObject = vi.fn(async (input: UploadConfirmationInput) => confirmUpload(input));
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
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        ...makeCompleteOptions({
          imageUploadBroker: makeBroker(uploadObject),
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

  it("creates member-scoped broker and RPC clients from the request access token", async () => {
    const uploadObject = vi.fn(async (input: UploadConfirmationInput) => confirmUpload(input));
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
    const imageUploadBrokerFactory = vi.fn(() => makeBroker(uploadObject));
    const postGatewayClientFactory = vi.fn(() => ({ rpc }));
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        ...makeCompleteOptions({
          imageUploadBroker: undefined,
          imageUploadBrokerFactory,
          postGatewayClient: undefined,
          postGatewayClientFactory
        })
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer member_request_token" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, post: { id: "post_shared_beta_created" } });
    expect(imageUploadBrokerFactory).toHaveBeenCalledWith({
      accessToken: "member_request_token",
      environment: {
        projectUrl: "https://project.supabase.co",
        anonKey: ANON_KEY,
        postImageBucket: "post-images",
        privilegedKey: SERVICE_ROLE_KEY,
        uploadBrokerMode: "server"
      }
    });
    expect(postGatewayClientFactory).toHaveBeenCalledWith({ accessToken: "member_request_token" });
    expect(uploadObject).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledOnce();
  });

  it("creates token-scoped authorization before broker and RPC factories", async () => {
    const events: string[] = [];
    const uploadObject = vi.fn(async (input: UploadConfirmationInput) => {
      events.push("upload");
      return confirmUpload(input);
    });
    const rpc = vi.fn(async () => {
      events.push("rpc");
      return {
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
      };
    });
    const authorizationSourceFactory = vi.fn(({ accessToken }: { accessToken: string }) => {
      events.push(`authorizationFactory:${accessToken}`);
      return {
        async canCreatePost() {
          events.push("authorization");
          return { ok: true as const };
        }
      };
    });
    const imageUploadBrokerFactory = vi.fn(({ accessToken }: { accessToken: string }) => {
      events.push(`brokerFactory:${accessToken}`);
      return makeBroker(uploadObject);
    });
    const postGatewayClientFactory = vi.fn(({ accessToken }: { accessToken: string }) => {
      events.push(`rpcFactory:${accessToken}`);
      return { rpc };
    });
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        ...makeCompleteOptions({
          authorizationSource: undefined,
          authorizationSourceFactory,
          imageUploadBroker: undefined,
          imageUploadBrokerFactory,
          postGatewayClient: undefined,
          postGatewayClientFactory
        })
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer member_request_token" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, post: { id: "post_shared_beta_created" } });
    expect(authorizationSourceFactory).toHaveBeenCalledWith({ accessToken: "member_request_token" });
    expect(imageUploadBrokerFactory).toHaveBeenCalledWith({
      accessToken: "member_request_token",
      environment: {
        projectUrl: "https://project.supabase.co",
        anonKey: ANON_KEY,
        postImageBucket: "post-images",
        privilegedKey: SERVICE_ROLE_KEY,
        uploadBrokerMode: "server"
      }
    });
    expect(postGatewayClientFactory).toHaveBeenCalledWith({ accessToken: "member_request_token" });
    expect(events.indexOf("authorization")).toBeLessThan(events.indexOf("brokerFactory:member_request_token"));
    expect(events.indexOf("brokerFactory:member_request_token")).toBeLessThan(
      events.indexOf("rpcFactory:member_request_token")
    );
    expect(events).not.toContain(`brokerFactory:${SERVICE_ROLE_KEY}`);
    expect(events).not.toContain(`rpcFactory:${SERVICE_ROLE_KEY}`);
  });

  it("fails closed when privileged broker construction throws and does not call RPC", async () => {
    const rpc = vi.fn();
    const imageUploadBrokerFactory = vi.fn(() => {
      throw new Error("broker config unavailable");
    });
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        ...makeCompleteOptions({
          imageUploadBroker: undefined,
          imageUploadBrokerFactory,
          postGatewayClient: { rpc }
        })
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer token_a" }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, error: { code: "validated_image_required" } });
    expect(imageUploadBrokerFactory).toHaveBeenCalledOnce();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("uses the multipart image file when no injected image resolver is provided", async () => {
    const uploadObject = vi.fn(async (input: UploadConfirmationInput) => confirmUpload(input));
    const rpc = vi.fn(async () => ({
      error: null,
      data: [
        {
          id: "post_shared_beta_created",
          user_id: "user_demo",
          group_id: "group_first",
          theme_id: "theme_cycle_group_first_2026-05-20_1",
          image_url: "post-images/group_first/user_demo/from-form.webp",
          caption: "shared beta post",
          visibility: "group_only" as const,
          created_at: "2026-05-20T09:00:00.000Z",
          updated_at: "2026-05-20T09:00:00.000Z"
        }
      ]
    }));
    const handler = createSharedBetaPostRouteHandler(
      createSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT, {
        ...makeCompleteOptions({
          imageUploadBroker: makeBroker(uploadObject),
          postGatewayClient: { rpc },
          resolveImageFile: undefined,
          generateImageFilename: () => "from-form.webp"
        })
      })
    );

    const response = await handler(makeMultipartRequest({ authorization: "Bearer token_a" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, post: { id: "post_shared_beta_created" } });
    expect(uploadObject).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "post-images",
        objectPath: "group_first/user_demo/from-form.webp",
        contentType: "image/webp"
      })
    );
  });
});

function makeCompleteOptions(
  overrides: Partial<SharedBetaPostServerDependencyFactoryOptions> = {}
): SharedBetaPostServerDependencyFactoryOptions {
  return {
    authClient: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user_demo" } } }))
    },
    imageUploadBroker: makeBroker(vi.fn(async (input: UploadConfirmationInput) => confirmUpload(input))),
    postGatewayClient: {
      rpc: vi.fn()
    },
    authorizationSource: createRepositorySharedBetaPostAuthorizationSource(
      createMemoryRepository(createSeedState(new Date("2026-05-20T09:00:00.000Z")))
    ),
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

function makeMultipartRequest(options?: { authorization?: string; image?: File }): Request {
  const formData = new FormData();
  formData.set("userId", "user_demo");
  formData.set("groupId", "group_first");
  formData.set("themeId", "theme_cycle_group_first_2026-05-20_1");
  formData.set("caption", "shared beta post");
  if (options?.image !== undefined) {
    formData.set("image", options.image);
  } else if (!options || !("image" in options)) {
    formData.set("image", makeBrowserFile("photo.webp", "image/webp", 3));
  }

  return new Request("http://localhost/api/shared-beta/posts", {
    method: "POST",
    headers: {
      "content-length": String((options?.image?.size ?? 0) + 1024),
      ...(options?.authorization ? { authorization: options.authorization } : {})
    },
    body: formData
  });
}

function makeBrowserFile(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

function makeFile(input: { name: string; type: string; size: number }): SharedBetaPostImageFile {
  return {
    ...input,
    async arrayBuffer() {
      return new ArrayBuffer(input.size);
    }
  };
}
function confirmUpload(input: UploadConfirmationInput) {
  return {
    ok: true as const,
    bucket: input.bucket,
    objectPath: input.objectPath
  };
}

function makeBroker(uploadObject: SharedBetaPostImageStorageClient["uploadObject"]): SharedBetaPostImageUploadBroker {
  return createStorageSharedBetaPostImageUploadBroker({ uploadObject });
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
