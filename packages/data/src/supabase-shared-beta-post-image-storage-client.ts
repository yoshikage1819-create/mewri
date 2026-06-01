import { createClient } from "@supabase/supabase-js";
import type { SharedBetaPostImageStorageClient } from "./supabase-post-image-storage";
import {
  type CreateSupabaseSharedBetaPostRpcClientInput,
  type SupabaseSharedBetaPostRpcEnvironment,
  resolveSharedBetaSupabasePostRpcEnvironment,
  resolveStagingSupabaseSharedBetaPostRpcEnvironment
} from "./supabase-shared-beta-post-rpc-client";
import { isPublicAnonKey, isValidSupabaseProjectUrl } from "./supabase-public-config";

export type SupabaseSharedBetaPostImageStorageEnvironment = SupabaseSharedBetaPostRpcEnvironment;

export type CreateSupabaseSharedBetaPostImageStorageClientInput =
  CreateSupabaseSharedBetaPostRpcClientInput;

export {
  resolveStagingSupabaseSharedBetaPostRpcEnvironment as resolveStagingSupabaseSharedBetaPostImageStorageEnvironment,
  resolveSharedBetaSupabasePostRpcEnvironment as resolveSharedBetaSupabasePostImageStorageEnvironment
};

/**
 * Narrow Supabase Storage client for private `post-images` upload and lookup.
 * Uses the caller's member JWT so RLS applies to the authenticated session.
 */
export function createSupabaseSharedBetaPostImageStorageClient(
  input: CreateSupabaseSharedBetaPostImageStorageClientInput
): SharedBetaPostImageStorageClient {
  assertStorageClientInput(input);

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
    async uploadObject({ bucket, objectPath, body, contentType }) {
      const { error } = await supabase.storage.from(bucket).upload(objectPath, body, {
        contentType,
        upsert: false
      });

      if (error) {
        return { ok: false, error };
      }

      return { ok: true };
    },

    async objectExists({ bucket, objectPath }) {
      const { folder, filename } = splitStorageObjectPath(objectPath);
      const { data, error } = await supabase.storage.from(bucket).list(folder, {
        limit: 100,
        search: filename
      });

      if (error) {
        return false;
      }

      return (data ?? []).some((item) => item.name === filename);
    }
  };
}

function assertStorageClientInput(input: CreateSupabaseSharedBetaPostImageStorageClientInput): void {
  if (!isValidSupabaseProjectUrl(input.projectUrl)) {
    throw new Error(
      "Shared beta post image storage client requires a valid https://<ref>.supabase.co project URL."
    );
  }

  if (!isPublicAnonKey(input.anonKey)) {
    throw new Error(
      "Shared beta post image storage client requires a public anon or publishable key, not a service role or secret key."
    );
  }

  if (!input.accessToken.trim()) {
    throw new Error("Shared beta post image storage client requires an authenticated access token.");
  }

  if (/service[_-]?role/i.test(input.accessToken)) {
    throw new Error(
      "Shared beta post image storage client must not use a service role key as the access token."
    );
  }
}

function splitStorageObjectPath(objectPath: string): { folder: string; filename: string } {
  const lastSlash = objectPath.lastIndexOf("/");
  if (lastSlash < 0) {
    return { folder: "", filename: objectPath };
  }

  return {
    folder: objectPath.slice(0, lastSlash),
    filename: objectPath.slice(lastSlash + 1)
  };
}
