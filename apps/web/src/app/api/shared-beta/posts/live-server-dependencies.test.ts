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
  SUPABASE_POST_IMAGE_BUCKET: "post-images"
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

  it("keeps the live route unavailable with complete public staging gates until a privileged broker exists", async () => {
    const handler = createSharedBetaPostRouteHandler(
      createLiveStagingSharedBetaPostServerDependenciesFromEnvironment(COMPLETE_STAGING_ROUTE_ENVIRONMENT)
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer member_request_token" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: { code: "shared_beta_route_unavailable" } });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("does not require or consume SUPABASE_SERVICE_ROLE_KEY in the current live route wiring", async () => {
    const handler = createSharedBetaPostRouteHandler(
      createLiveStagingSharedBetaPostServerDependenciesFromEnvironment({
        ...COMPLETE_STAGING_ROUTE_ENVIRONMENT,
        SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY
      })
    );

    const response = await handler(makeJsonRequest({ authorization: "Bearer member_request_token" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, error: { code: "shared_beta_route_unavailable" } });
    expect(createClientMock).not.toHaveBeenCalled();
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

function restoreRouteEnvironment(environment: NodeJS.ProcessEnv): void {
  for (const key of ROUTE_ENV_KEYS) {
    if (environment[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = environment[key];
    }
  }
}
