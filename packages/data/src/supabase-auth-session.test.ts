import { describe, expect, it, vi } from "vitest";
import {
  resolveAccessTokenFromRequest,
  resolveSupabaseAuthenticatedUserIdFromRequest,
  type SupabaseAuthSessionClient
} from "./supabase-auth-session";

describe("supabase auth session boundary", () => {
  it("resolves an authenticated user id from a bearer token", async () => {
    const client: SupabaseAuthSessionClient = {
      getUser: vi.fn(async () => ({ data: { user: { id: "user_supabase" } } }))
    };
    const request = new Request("http://localhost/api/shared-beta/posts", {
      headers: { authorization: "Bearer token_a" }
    });

    await expect(resolveSupabaseAuthenticatedUserIdFromRequest(request, client)).resolves.toBe("user_supabase");
    expect(client.getUser).toHaveBeenCalledWith("token_a");
  });

  it("resolves an authenticated user id from the server auth cookie fallback", async () => {
    const client: SupabaseAuthSessionClient = {
      getUser: vi.fn(async () => ({ data: { user: { id: "user_cookie" } } }))
    };
    const request = new Request("http://localhost/api/shared-beta/posts", {
      headers: { cookie: "theme=light; mewri-supabase-access-token=token_cookie" }
    });

    await expect(resolveSupabaseAuthenticatedUserIdFromRequest(request, client)).resolves.toBe("user_cookie");
    expect(client.getUser).toHaveBeenCalledWith("token_cookie");
  });

  it("fails closed without a token or when Supabase rejects the session", async () => {
    const client: SupabaseAuthSessionClient = {
      getUser: vi.fn(async () => ({ error: new Error("invalid token") }))
    };

    await expect(
      resolveSupabaseAuthenticatedUserIdFromRequest(
        new Request("http://localhost/api/shared-beta/posts"),
        client
      )
    ).resolves.toBeUndefined();
    expect(client.getUser).not.toHaveBeenCalled();

    await expect(
      resolveSupabaseAuthenticatedUserIdFromRequest(
        new Request("http://localhost/api/shared-beta/posts", {
          headers: { authorization: "Bearer bad_token" }
        }),
        client
      )
    ).resolves.toBeUndefined();
  });

  it("ignores non-bearer authorization schemes", () => {
    expect(
      resolveAccessTokenFromRequest(
        new Request("http://localhost/api/shared-beta/posts", {
          headers: { authorization: "Basic token" }
        })
      )
    ).toBeUndefined();
  });

  it("fails closed when an unrelated cookie has malformed percent encoding", () => {
    expect(
      resolveAccessTokenFromRequest(
        new Request("http://localhost/api/shared-beta/posts", {
          headers: { cookie: "unrelated=%; theme=light" }
        })
      )
    ).toBeUndefined();
  });
});
