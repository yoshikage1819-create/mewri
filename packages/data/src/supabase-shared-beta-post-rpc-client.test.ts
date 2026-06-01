import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createSupabaseSharedBetaPostRpcClient,
  resolveSharedBetaSupabasePostRpcEnvironment,
  resolveStagingSupabaseSharedBetaPostRpcEnvironment
} from "./supabase-shared-beta-post-rpc-client";
import { CREATE_SHARED_BETA_POST_RPC } from "./supabase-shared-beta-post-gateway";

const { createClientMock, rpcMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  rpcMock: vi.fn()
}));

const ANON_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature";
const PUBLISHABLE_KEY = "sb_publishable_test_key";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature";
const SECRET_KEY = "sb_secret_test_key";

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock
}));

describe("resolveStagingSupabaseSharedBetaPostRpcEnvironment", () => {
  it("returns project URL and anon key without shared mode enabled", () => {
    expect(
      resolveStagingSupabaseSharedBetaPostRpcEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: ANON_KEY
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY
    });
  });

  it("accepts NEXT_PUBLIC values for staging wiring", () => {
    expect(
      resolveStagingSupabaseSharedBetaPostRpcEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: PUBLISHABLE_KEY
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: PUBLISHABLE_KEY
    });
  });

  it("returns undefined when URL or anon key is missing", () => {
    expect(resolveStagingSupabaseSharedBetaPostRpcEnvironment({})).toBeUndefined();
    expect(
      resolveStagingSupabaseSharedBetaPostRpcEnvironment({
        SUPABASE_URL: "https://project.supabase.co"
      })
    ).toBeUndefined();
  });

  it("rejects non-supabase URLs and non-anon keys", () => {
    expect(
      resolveStagingSupabaseSharedBetaPostRpcEnvironment({
        SUPABASE_URL: "postgresql://db",
        SUPABASE_ANON_KEY: ANON_KEY
      })
    ).toBeUndefined();

    expect(
      resolveStagingSupabaseSharedBetaPostRpcEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: SERVICE_ROLE_KEY
      })
    ).toBeUndefined();

    expect(
      resolveStagingSupabaseSharedBetaPostRpcEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: SECRET_KEY
      })
    ).toBeUndefined();
  });
});

describe("resolveSharedBetaSupabasePostRpcEnvironment", () => {
  it("returns config only when shared_beta mode is fully configured", () => {
    expect(
      resolveSharedBetaSupabasePostRpcEnvironment({
        MEWRI_RUNTIME_MODE: "shared_beta",
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-secret",
        SUPABASE_ANON_KEY: ANON_KEY
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY
    });
  });

  it("returns undefined when shared mode is not enabled", () => {
    expect(
      resolveSharedBetaSupabasePostRpcEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: ANON_KEY
      })
    ).toBeUndefined();
  });
});

describe("createSupabaseSharedBetaPostRpcClient", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    rpcMock.mockReset();
    createClientMock.mockReturnValue({ rpc: rpcMock });
  });

  it("creates a narrow client that only forwards create_shared_beta_post", async () => {
    rpcMock.mockResolvedValue({ data: [{ id: "post_1" }], error: null });

    const client = createSupabaseSharedBetaPostRpcClient({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY,
      accessToken: "member-access-token"
    });

    const result = await client.rpc(CREATE_SHARED_BETA_POST_RPC, {
      p_user_id: "00000000-0000-0000-0000-000000000001",
      p_group_id: "group_staging_a",
      p_theme_id: "theme_active",
      p_image_path: "post-images/group_staging_a/00000000-0000-0000-0000-000000000001/read-check.webp",
      p_caption: "caption"
    });

    expect(createClientMock).toHaveBeenCalledWith("https://project.supabase.co", ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          Authorization: "Bearer member-access-token"
        }
      }
    });
    expect(rpcMock).toHaveBeenCalledWith(CREATE_SHARED_BETA_POST_RPC, {
      p_user_id: "00000000-0000-0000-0000-000000000001",
      p_group_id: "group_staging_a",
      p_theme_id: "theme_active",
      p_image_path: "post-images/group_staging_a/00000000-0000-0000-0000-000000000001/read-check.webp",
      p_caption: "caption"
    });
    expect(result.data).toEqual([{ id: "post_1" }]);
    expect(result.error).toBeNull();
  });

  it("rejects unsupported RPC names", async () => {
    const client = createSupabaseSharedBetaPostRpcClient({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY,
      accessToken: "member-access-token"
    });

    const result = await client.rpc("other_rpc" as typeof CREATE_SHARED_BETA_POST_RPC, {
      p_user_id: "00000000-0000-0000-0000-000000000001",
      p_group_id: "group_staging_a",
      p_theme_id: "theme_active",
      p_image_path: "post-images/group_staging_a/00000000-0000-0000-0000-000000000001/read-check.webp",
      p_caption: "caption"
    });

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });

  it("rejects service role style access tokens", () => {
    expect(() =>
      createSupabaseSharedBetaPostRpcClient({
        projectUrl: "https://project.supabase.co",
        anonKey: ANON_KEY,
        accessToken: "eyJservice_role_payload"
      })
    ).toThrow("service role");
  });

  it("rejects service role keys in the anon key slot", () => {
    expect(() =>
      createSupabaseSharedBetaPostRpcClient({
        projectUrl: "https://project.supabase.co",
        anonKey: SERVICE_ROLE_KEY,
        accessToken: "member-access-token"
      })
    ).toThrow("public anon or publishable key");

    expect(() =>
      createSupabaseSharedBetaPostRpcClient({
        projectUrl: "https://project.supabase.co",
        anonKey: SECRET_KEY,
        accessToken: "member-access-token"
      })
    ).toThrow("public anon or publishable key");
  });
});
