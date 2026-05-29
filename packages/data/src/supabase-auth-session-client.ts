import { createClient } from "@supabase/supabase-js";
import type { SupabaseAuthSessionClient } from "./supabase-auth-session";
import {
  type SupabaseSharedBetaPostRpcEnvironment,
  resolveSharedBetaSupabasePostRpcEnvironment,
  resolveStagingSupabaseSharedBetaPostRpcEnvironment
} from "./supabase-shared-beta-post-rpc-client";

export type SupabaseAuthSessionEnvironment = SupabaseSharedBetaPostRpcEnvironment;

export {
  resolveStagingSupabaseSharedBetaPostRpcEnvironment as resolveStagingSupabaseAuthSessionEnvironment,
  resolveSharedBetaSupabasePostRpcEnvironment as resolveSharedBetaSupabaseAuthSessionEnvironment
};

/**
 * Narrow Supabase auth client for resolving the authenticated user from a member JWT.
 */
export function createSupabaseAuthSessionClient(
  config: SupabaseAuthSessionEnvironment
): SupabaseAuthSessionClient {
  assertAuthSessionEnvironment(config);

  const supabase = createClient(config.projectUrl, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  return {
    async getUser(accessToken) {
      assertMemberAccessToken(accessToken);
      const { data, error } = await supabase.auth.getUser(accessToken);
      return {
        data: data ? { user: data.user } : null,
        error
      };
    }
  };
}

function assertAuthSessionEnvironment(config: SupabaseAuthSessionEnvironment): void {
  if (!isValidSupabaseProjectUrl(config.projectUrl)) {
    throw new Error("Supabase auth session client requires a valid https://<ref>.supabase.co project URL.");
  }

  if (!isPublicAnonKey(config.anonKey)) {
    throw new Error("Supabase auth session client requires the public anon key, not a service role key.");
  }
}

function assertMemberAccessToken(accessToken: string): void {
  if (!accessToken.trim()) {
    throw new Error("Supabase auth session client requires an access token.");
  }

  if (/service[_-]?role/i.test(accessToken)) {
    throw new Error("Supabase auth session client must not use a service role key as the access token.");
  }
}

function isValidSupabaseProjectUrl(projectUrl: string): boolean {
  try {
    const parsed = new URL(projectUrl);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function isPublicAnonKey(anonKey: string): boolean {
  return anonKey.startsWith("eyJ");
}
