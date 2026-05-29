import { createClient } from "@supabase/supabase-js";
import type { MewriRuntimeEnvironment } from "./shared-beta-runtime";
import { resolveSharedBetaRuntimeDecision } from "./shared-beta-runtime";
import type { DbPostRow } from "./db-row-types";
import {
  CREATE_SHARED_BETA_POST_RPC,
  type SupabaseSharedBetaPostRpcClient
} from "./supabase-shared-beta-post-gateway";

export interface SupabaseSharedBetaPostRpcEnvironment {
  projectUrl: string;
  anonKey: string;
}

export interface CreateSupabaseSharedBetaPostRpcClientInput extends SupabaseSharedBetaPostRpcEnvironment {
  /**
   * Authenticated member JWT. Must not be a service role key.
   */
  accessToken: string;
}

/**
 * Resolves staging/server RPC wiring inputs without enabling shared mode.
 * Uses public anon key plus project URL only.
 */
export function resolveStagingSupabaseSharedBetaPostRpcEnvironment(
  environment: MewriRuntimeEnvironment
): SupabaseSharedBetaPostRpcEnvironment | undefined {
  const projectUrl =
    environment.SUPABASE_URL?.trim() ?? environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey =
    environment.SUPABASE_ANON_KEY?.trim() ?? environment.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!projectUrl || !anonKey) {
    return undefined;
  }

  if (!isValidSupabaseProjectUrl(projectUrl)) {
    return undefined;
  }

  if (!isPublicAnonKey(anonKey)) {
    return undefined;
  }

  return { projectUrl, anonKey };
}

/**
 * Same as staging resolver but only when shared_beta runtime is fully configured.
 */
export function resolveSharedBetaSupabasePostRpcEnvironment(
  environment: MewriRuntimeEnvironment
): SupabaseSharedBetaPostRpcEnvironment | undefined {
  const decision = resolveSharedBetaRuntimeDecision(environment);
  if (decision.mode !== "shared_beta_configured") {
    return undefined;
  }

  return resolveStagingSupabaseSharedBetaPostRpcEnvironment({
    ...environment,
    SUPABASE_URL: decision.config.projectUrl
  });
}

/**
 * Narrow Supabase client for `create_shared_beta_post` RPC only.
 * Uses the caller's access token so `auth.uid()` inside the RPC matches the member session.
 */
export function createSupabaseSharedBetaPostRpcClient(
  input: CreateSupabaseSharedBetaPostRpcClientInput
): SupabaseSharedBetaPostRpcClient {
  assertRpcClientInput(input);

  const supabase = createClient(input.projectUrl, input.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${input.accessToken}`
      }
    }
  });

  return {
    async rpc(name, params) {
      if (name !== CREATE_SHARED_BETA_POST_RPC) {
        return {
          data: null,
          error: new Error(`Unsupported RPC: ${name}`)
        };
      }

      const { data, error } = await supabase.rpc(name, params);
      return {
        data: (data as DbPostRow[] | null) ?? null,
        error
      };
    }
  };
}

function assertRpcClientInput(input: CreateSupabaseSharedBetaPostRpcClientInput): void {
  if (!isValidSupabaseProjectUrl(input.projectUrl)) {
    throw new Error("Shared beta RPC client requires a valid https://<ref>.supabase.co project URL.");
  }

  if (!isPublicAnonKey(input.anonKey)) {
    throw new Error("Shared beta RPC client requires the public anon key, not a service role key.");
  }

  if (!input.accessToken.trim()) {
    throw new Error("Shared beta RPC client requires an authenticated access token.");
  }

  if (/service[_-]?role/i.test(input.accessToken)) {
    throw new Error("Shared beta RPC client must not use a service role key as the access token.");
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
