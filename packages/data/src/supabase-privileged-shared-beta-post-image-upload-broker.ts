import { createClient } from "@supabase/supabase-js";
import {
  createStorageSharedBetaPostImageUploadBroker,
  type SharedBetaPostImageUploadBroker
} from "./shared-beta-post-image-upload-broker";
import type { MewriRuntimeEnvironment } from "./shared-beta-runtime";
import { isPrivilegedSupabaseCredential, isValidSupabaseProjectUrl } from "./supabase-public-config";
import type { SharedBetaPostImageStorageClient } from "./supabase-post-image-storage";
import {
  resolveStagingSupabaseSharedBetaPostRpcEnvironment,
  type SupabaseSharedBetaPostRpcEnvironment
} from "./supabase-shared-beta-post-rpc-client";

export interface SupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment {
  projectUrl: string;
  privilegedKey: string;
}

export function resolveStagingSupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment(
  environment: MewriRuntimeEnvironment,
  routeEnvironment = resolveStagingSupabaseSharedBetaPostRpcEnvironment(environment)
): SupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment | undefined {
  if (!routeEnvironment) {
    return undefined;
  }

  return resolveSupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment({
    projectUrl: routeEnvironment.projectUrl,
    privilegedKey: environment.SUPABASE_SERVICE_ROLE_KEY?.trim()
  });
}

export function createSupabasePrivilegedSharedBetaPostImageUploadBroker(
  input: SupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment
): SharedBetaPostImageUploadBroker {
  const environment = resolveSupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment(input);
  if (!environment) {
    throw new Error("Privileged shared beta image upload broker requires server-only Supabase credentials.");
  }

  const supabase = createClient(environment.projectUrl, environment.privilegedKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const storage: SharedBetaPostImageStorageClient = {
    async uploadObject({ bucket, objectPath, body, contentType }) {
      const { data, error } = await supabase.storage.from(bucket).upload(objectPath, body, {
        contentType,
        upsert: false
      });

      if (error) {
        return { ok: false, error };
      }

      const uploadedObjectPath = asUploadedObjectPath(data);
      if (uploadedObjectPath !== objectPath) {
        return { ok: false, error: new Error("Supabase Storage returned an unexpected uploaded object path.") };
      }

      return { ok: true, bucket, objectPath: uploadedObjectPath };
    }
  };

  return createStorageSharedBetaPostImageUploadBroker(storage);
}

function resolveSupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment(input: {
  projectUrl: SupabaseSharedBetaPostRpcEnvironment["projectUrl"];
  privilegedKey?: string;
}): SupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment | undefined {
  if (!isValidSupabaseProjectUrl(input.projectUrl)) {
    return undefined;
  }

  const privilegedKey = input.privilegedKey?.trim();
  if (!privilegedKey || !isPrivilegedSupabaseCredential(privilegedKey)) {
    return undefined;
  }

  return {
    projectUrl: input.projectUrl,
    privilegedKey
  };
}

function asUploadedObjectPath(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null || !("path" in data)) {
    return undefined;
  }

  const path = (data as { path?: unknown }).path;
  return typeof path === "string" ? path : undefined;
}
