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

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock
}));

describe("resolveStagingSupabaseSharedBetaPostRpcEnvironment", () => {
  it("returns project URL and anon key without shared mode enabled", () => {
    expect(
      resolveStagingSupabaseSharedBetaPostRpcEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: "eyJanon"
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: "eyJanon"
    });
  });

  it("accepts NEXT_PUBLIC values for staging wiring", () => {
    expect(
      resolveStagingSupabaseSharedBetaPostRpcEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJpublic"
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: "eyJpublic"
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
        SUPABASE_ANON_KEY: "eyJanon"
      })
    ).toBeUndefined();

    expect(
      resolveStagingSupabaseSharedBetaPostRpcEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: "not-a-jwt"
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
        SUPABASE_ANON_KEY: "eyJanon"
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: "eyJanon"
    });
  });

  it("returns undefined when shared mode is not enabled", () => {
    expect(
      resolveSharedBetaSupabasePostRpcEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: "eyJanon"
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
      anonKey: "eyJanon",
      accessToken: "member-access-token"
    });

    const result = await client.rpc(CREATE_SHARED_BETA_POST_RPC, {
      p_user_id: "00000000-0000-0000-0000-000000000001",
      p_group_id: "group_staging_a",
      p_theme_id: "theme_active",
      p_image_path: "post-images/group_staging_a/00000000-0000-0000-0000-000000000001/read-check.webp",
      p_caption: "caption"
    });

    expect(createClientMock).toHaveBeenCalledWith("https://project.supabase.co", "eyJanon", {
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
      anonKey: "eyJanon",
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
        anonKey: "eyJanon",
        accessToken: "eyJservice_role_payload"
      })
    ).toThrow("service role");
  });
});
