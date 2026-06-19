import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSharedBetaPostRouteHandler } from "./route-boundary";
import { createLiveStagingSharedBetaPostServerDependenciesFromEnvironment } from "./live-server-dependencies";
import {
  STAGING_SHARED_BETA_POST_ROUTE_GATE,
  STAGING_SHARED_BETA_UPLOAD_BROKER_GATE,
  STAGING_SHARED_BETA_UPLOAD_BROKER_MODE
} from "./server-dependencies";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn()
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock
}));
vi.mock("server-only", () => ({}));

const ANON_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature";

const COMPLETE_STAGING_ROUTE_ENVIRONMENT = {
  [STAGING_SHARED_BETA_POST_ROUTE_GATE]: "true",
  [STAGING_SHARED_BETA_UPLOAD_BROKER_GATE]: "true",
  [STAGING_SHARED_BETA_UPLOAD_BROKER_MODE]: "server",
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_ANON_KEY: ANON_KEY,
  SUPABASE_POST_IMAGE_BUCKET: "post-images",
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY
};

const ROUTE_ENV_KEYS = [
  STAGING_SHARED_BETA_POST_ROUTE_GATE,
  STAGING_SHARED_BETA_UPLOAD_BROKER_GATE,
  STAGING_SHARED_BETA_UPLOAD_BROKER_MODE,
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_POST_IMAGE_BUCKET",
  "SUPABASE_SERVICE_ROLE_KEY"
];

describe("live staging shared beta post route wiring", () => {
  const originalEnvironment = { ...process.env };

  beforeEach(() => {
    createClientMock.mockReset();
    restoreRouteEnvironment(originalEnvironment);
  });

  afterEach(() => {
    restoreRouteEnvironment(originalEnvironment);
  });

  it("keeps the exported route unavailable with no environment", async () => {
    vi.resetModules();
    for (const key of ROUTE_ENV_KEYS) {
      delete process.env[key];
    }

    const { POST } = await import("./route");
    const response = await POST(makeJsonRequest({ authorization: "Bearer member_request_token" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: { code: "shared_beta_route_unavailable" } });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("keeps the live route unavailable when public staging config is incomplete", async () => {
    const handler = createSharedBetaPostRouteHandler(
      createLiveStagingSharedBetaPostServerDependenciesFromEnvironment({
        [STAGING_SHARED_BETA_POST_ROUTE_GATE]: "true",
        [STAGING_SHARED_BETA_UPLOAD_BROKER_GATE]: "true",
        [STAGING_SHARED_BETA_UPLOAD_BROKER_MODE]: "server",
        SUPABASE_URL: "https://project.supabase.co"
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer member_request_token" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: { code: "shared_beta_route_unavailable" } });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("keeps the live route unavailable with complete public staging gates but no privileged broker config", async () => {
    const handler = createSharedBetaPostRouteHandler(
      createLiveStagingSharedBetaPostServerDependenciesFromEnvironment({
        ...COMPLETE_STAGING_ROUTE_ENVIRONMENT,
        SUPABASE_SERVICE_ROLE_KEY: undefined
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer member_request_token" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: { code: "shared_beta_route_unavailable" } });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("uses public anon config for auth and stops before privileged broker construction on auth failure", async () => {
    const getUserMock = vi.fn(async () => ({ data: null, error: new Error("invalid token") }));
    createClientMock.mockReturnValue({
      auth: { getUser: getUserMock }
    });
    const handler = createSharedBetaPostRouteHandler(
      createLiveStagingSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT)
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer member_request_token" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ ok: false, error: { code: "authentication_required" } });
    expect(createClientMock).toHaveBeenCalledOnce();
    expect(createClientMock).toHaveBeenCalledWith("https://project.supabase.co", ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    expect(getUserMock).toHaveBeenCalledWith("member_request_token");
  });

  it("uses privileged credentials only for broker upload after auth and authorization pass", async () => {
    const uploadMock = vi.fn(async (objectPath: string) => ({
      data: { path: objectPath },
      error: null
    }));
    const rpcMock = vi.fn(async (_name: string, params: { p_image_path: string }) => ({
      error: null,
      data: [
        {
          id: "post_shared_beta_created",
          user_id: "user_demo",
          group_id: "group_first",
          theme_id: "theme_cycle_group_first_2026-05-20_1",
          image_url: params.p_image_path,
          caption: "shared beta post",
          visibility: "group_only" as const,
          created_at: "2026-05-20T09:00:00.000Z",
          updated_at: "2026-05-20T09:00:00.000Z"
        }
      ]
    }));
    const getUserMock = vi.fn(async () => ({ data: { user: { id: "user_demo" } }, error: null }));
    createClientMock.mockImplementation((_url: string, key: string) => {
      if (key === SERVICE_ROLE_KEY) {
        return {
          storage: {
            from: vi.fn(() => ({ upload: uploadMock }))
          }
        };
      }

      return {
        auth: { getUser: getUserMock },
        from: (table: string) => ({ select: () => makeAuthorizationQuery(table) }),
        rpc: rpcMock
      };
    });
    const handler = createSharedBetaPostRouteHandler(
      createLiveStagingSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT)
    );

    const response = await handler(makeMultipartRequest({ authorization: "Bearer member_request_token" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, post: { id: "post_shared_beta_created" } });
    expect(createClientMock).toHaveBeenCalledWith("https://project.supabase.co", SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    expect(createClientMock).not.toHaveBeenCalledWith(
      "https://project.supabase.co",
      SERVICE_ROLE_KEY,
      expect.objectContaining({
        global: expect.anything()
      })
    );
    expect(
      createClientMock.mock.calls.filter((call) => call[1] === SERVICE_ROLE_KEY)
    ).toHaveLength(1);
    expect(
      createClientMock.mock.calls.filter((call) => call[1] === ANON_KEY)
    ).toHaveLength(4);
    expect(uploadMock).toHaveBeenCalledOnce();
    expect(rpcMock).toHaveBeenCalledOnce();
    expect(rpcMock.mock.calls[0]?.[1]).toMatchObject({
      p_user_id: "user_demo",
      p_group_id: "group_first",
      p_theme_id: "theme_cycle_group_first_2026-05-20_1",
      p_caption: "shared beta post"
    });
  });
});

function makeJsonRequest(options?: { authorization?: string }): Request {
  return new Request("http://localhost/api/shared-beta/posts", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(options?.authorization ? { authorization: options.authorization } : {})
    },
    body: JSON.stringify({
      userId: "user_demo",
      groupId: "group_first",
      themeId: "theme_cycle_group_first_2026-05-20_1",
      caption: "shared beta post"
    })
  });
}

function makeMultipartRequest(options?: { authorization?: string }): Request {
  const formData = new FormData();
  formData.set("userId", "user_demo");
  formData.set("groupId", "group_first");
  formData.set("themeId", "theme_cycle_group_first_2026-05-20_1");
  formData.set("caption", "shared beta post");
  formData.set("image", new File([new Uint8Array([1, 2, 3])], "photo.webp", { type: "image/webp" }));

  return new Request("http://localhost/api/shared-beta/posts", {
    method: "POST",
    headers: {
      "content-length": "1024",
      ...(options?.authorization ? { authorization: options.authorization } : {})
    },
    body: formData
  });
}

function makeAuthorizationQuery(table: string) {
  const query = {
    eq: vi.fn(() => query),
    limit: vi.fn(async () => {
      if (table === "group_members") {
        return {
          data: [{ group_id: "group_first", user_id: "user_demo" }],
          error: null
        };
      }

      return {
        data: [
          {
            id: "theme_cycle_group_first_2026-05-20_1",
            group_id: "group_first",
            status: "active"
          }
        ],
        error: null
      };
    })
  };

  return query;
}

function restoreRouteEnvironment(environment: NodeJS.ProcessEnv): void {
  for (const key of ROUTE_ENV_KEYS) {
    if (environment[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = environment[key];
    }
  }
}
