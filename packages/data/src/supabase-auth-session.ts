import type { ID } from "@mewri/core";

export interface SupabaseAuthUser {
  id?: string | null;
}

export interface SupabaseAuthSessionClient {
  getUser(accessToken: string): Promise<{
    data?: {
      user?: SupabaseAuthUser | null;
    } | null;
    error?: unknown;
  }>;
}

export async function resolveSupabaseAuthenticatedUserIdFromRequest(
  request: Request,
  client: SupabaseAuthSessionClient
): Promise<ID | undefined> {
  const accessToken = resolveAccessTokenFromRequest(request);
  if (!accessToken) {
    return undefined;
  }

  const result = await client.getUser(accessToken);
  if (result.error) {
    return undefined;
  }

  const userId = result.data?.user?.id?.trim();
  return userId ? userId : undefined;
}

export function resolveAccessTokenFromRequest(request: Request): string | undefined {
  const authorizationToken = resolveBearerToken(request.headers.get("authorization"));
  if (authorizationToken) {
    return authorizationToken;
  }

  const cookies = parseCookieHeader(request.headers.get("cookie"));
  return cookies.get("mewri-supabase-access-token") ?? cookies.get("sb-access-token");
}

function resolveBearerToken(header: string | null): string | undefined {
  if (!header) {
    return undefined;
  }

  const [scheme, ...rest] = header.trim().split(/\s+/);
  const token = rest.join(" ").trim();
  if (scheme.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  return token;
}

function parseCookieHeader(header: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!header) {
    return cookies;
  }

  for (const part of header.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (key && value) {
      const decodedValue = safeDecodeCookieValue(value);
      if (decodedValue) {
        cookies.set(key, decodedValue);
      }
    }
  }

  return cookies;
}

function safeDecodeCookieValue(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}
