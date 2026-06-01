import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createSupabaseAuthSessionClient,
  resolveSharedBetaSupabaseAuthSessionEnvironment,
  resolveStagingSupabaseAuthSessionEnvironment
} from "./supabase-auth-session-client";

const { createClientMock, getUserMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getUserMock: vi.fn()
}));

const ANON_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature";
const PUBLISHABLE_KEY = "sb_publishable_test_key";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature";
const SECRET_KEY = "sb_secret_test_key";

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock
}));

describe("resolveStagingSupabaseAuthSessionEnvironment", () => {
  it("reuses staging public env resolution", () => {
    expect(
      resolveStagingSupabaseAuthSessionEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: ANON_KEY
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY
    });
  });

  it("accepts Supabase publishable keys", () => {
    expect(
      resolveStagingSupabaseAuthSessionEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: PUBLISHABLE_KEY
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: PUBLISHABLE_KEY
    });
  });
});

describe("resolveSharedBetaSupabaseAuthSessionEnvironment", () => {
  it("requires shared_beta mode", () => {
    expect(
      resolveSharedBetaSupabaseAuthSessionEnvironment({
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
});

describe("createSupabaseAuthSessionClient", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    getUserMock.mockReset();
    createClientMock.mockReturnValue({
      auth: { getUser: getUserMock }
    });
  });

  it("calls auth.getUser with the member access token", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user_member" } }, error: null });

    const client = createSupabaseAuthSessionClient({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY
    });

    const result = await client.getUser("member-access-token");

    expect(createClientMock).toHaveBeenCalledWith("https://project.supabase.co", ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    expect(getUserMock).toHaveBeenCalledWith("member-access-token");
    expect(result.data?.user?.id).toBe("user_member");
    expect(result.error).toBeNull();
  });

  it("returns errors from Supabase without exposing extra clients", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: new Error("invalid jwt") });

    const client = createSupabaseAuthSessionClient({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY
    });

    const result = await client.getUser("bad-token");
    expect(result.error).toBeInstanceOf(Error);
  });

  it("rejects service role style access tokens", async () => {
    const client = createSupabaseAuthSessionClient({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY
    });

    await expect(client.getUser("eyJservice_role_payload")).rejects.toThrow("service role");
  });

  it("rejects service role keys in the anon key slot", () => {
    expect(() =>
      createSupabaseAuthSessionClient({
        projectUrl: "https://project.supabase.co",
        anonKey: SERVICE_ROLE_KEY
      })
    ).toThrow("public anon or publishable key");

    expect(() =>
      createSupabaseAuthSessionClient({
        projectUrl: "https://project.supabase.co",
        anonKey: SECRET_KEY
      })
    ).toThrow("public anon or publishable key");
  });
});
