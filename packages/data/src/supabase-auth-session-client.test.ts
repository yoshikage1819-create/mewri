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

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock
}));

describe("resolveStagingSupabaseAuthSessionEnvironment", () => {
  it("reuses staging public env resolution", () => {
    expect(
      resolveStagingSupabaseAuthSessionEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: "eyJanon"
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: "eyJanon"
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
        SUPABASE_ANON_KEY: "eyJanon"
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: "eyJanon"
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
      anonKey: "eyJanon"
    });

    const result = await client.getUser("member-access-token");

    expect(createClientMock).toHaveBeenCalledWith("https://project.supabase.co", "eyJanon", {
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
      anonKey: "eyJanon"
    });

    const result = await client.getUser("bad-token");
    expect(result.error).toBeInstanceOf(Error);
  });

  it("rejects service role style access tokens", async () => {
    const client = createSupabaseAuthSessionClient({
      projectUrl: "https://project.supabase.co",
      anonKey: "eyJanon"
    });

    await expect(client.getUser("eyJservice_role_payload")).rejects.toThrow("service role");
  });
});
