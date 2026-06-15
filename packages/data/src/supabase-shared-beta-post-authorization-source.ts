import type { ID } from "@mewri/core";
import { createClient } from "@supabase/supabase-js";
import type {
  SharedBetaPostAuthorizationSource,
  SharedBetaPostAuthorizationSourceFailure,
  SharedBetaPostAuthorizationSourceResult
} from "./shared-beta-post-authorization-source";
import type { CreateSupabaseSharedBetaPostRpcClientInput } from "./supabase-shared-beta-post-rpc-client";
import { isPublicAnonKey, isValidSupabaseProjectUrl } from "./supabase-public-config";

export interface SupabaseSharedBetaPostAuthorizationReadResult<Row> {
  data: Row[] | null;
  error: unknown;
}

export interface SupabaseSharedBetaPostAuthorizationGroupMemberRow {
  group_id: unknown;
  user_id: unknown;
}

export interface SupabaseSharedBetaPostAuthorizationThemeRow {
  id: unknown;
  group_id: unknown;
  status: unknown;
}

export interface SupabaseSharedBetaPostAuthorizationReadClient {
  selectGroupMembership(input: {
    groupId: ID;
    userId: ID;
  }): Promise<SupabaseSharedBetaPostAuthorizationReadResult<SupabaseSharedBetaPostAuthorizationGroupMemberRow>>;
  selectTheme(input: {
    groupId: ID;
    themeId: ID;
  }): Promise<SupabaseSharedBetaPostAuthorizationReadResult<SupabaseSharedBetaPostAuthorizationThemeRow>>;
}

export type CreateSupabaseSharedBetaPostAuthorizationReadClientInput =
  CreateSupabaseSharedBetaPostRpcClientInput;

export function createSupabaseSharedBetaPostAuthorizationSource(
  client: SupabaseSharedBetaPostAuthorizationReadClient
): SharedBetaPostAuthorizationSource {
  return {
    async canCreatePost(input) {
      const membership = await readGroupMembership(client, input);
      if (!membership) {
        return deny("group_membership_required", "Shared beta posts require membership in the destination group.");
      }

      const theme = await readActiveGroupTheme(client, input);
      if (!theme) {
        return deny("active_group_theme_required", "Shared beta posts require an active theme in the destination group.");
      }

      return { ok: true };
    }
  };
}

/**
 * Narrow Supabase read client for shared-beta post authorization only.
 * Uses the caller's member JWT so RLS applies to the authenticated session.
 */
export function createSupabaseSharedBetaPostAuthorizationReadClient(
  input: CreateSupabaseSharedBetaPostAuthorizationReadClientInput
): SupabaseSharedBetaPostAuthorizationReadClient {
  assertAuthorizationReadClientInput(input);

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
    async selectGroupMembership({ groupId, userId }) {
      const { data, error } = await supabase
        .from("group_members")
        .select("group_id,user_id")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .limit(2);

      return {
        data: (data as SupabaseSharedBetaPostAuthorizationGroupMemberRow[] | null) ?? null,
        error
      };
    },

    async selectTheme({ groupId, themeId }) {
      const { data, error } = await supabase
        .from("themes")
        .select("id,group_id,status")
        .eq("id", themeId)
        .eq("group_id", groupId)
        .eq("status", "active")
        .limit(2);

      return {
        data: (data as SupabaseSharedBetaPostAuthorizationThemeRow[] | null) ?? null,
        error
      };
    }
  };
}

async function readGroupMembership(
  client: SupabaseSharedBetaPostAuthorizationReadClient,
  input: { authenticatedUserId: ID; groupId: ID }
): Promise<boolean> {
  try {
    const result = await client.selectGroupMembership({
      groupId: input.groupId,
      userId: input.authenticatedUserId
    });

    if (result.error || !result.data || result.data.length !== 1) {
      return false;
    }

    const row = result.data[0];
    return row?.group_id === input.groupId && row.user_id === input.authenticatedUserId;
  } catch {
    return false;
  }
}

async function readActiveGroupTheme(
  client: SupabaseSharedBetaPostAuthorizationReadClient,
  input: { groupId: ID; themeId: ID }
): Promise<boolean> {
  try {
    const result = await client.selectTheme({
      groupId: input.groupId,
      themeId: input.themeId
    });

    if (result.error || !result.data || result.data.length !== 1) {
      return false;
    }

    const row = result.data[0];
    return row?.id === input.themeId && row.group_id === input.groupId && row.status === "active";
  } catch {
    return false;
  }
}

function assertAuthorizationReadClientInput(
  input: CreateSupabaseSharedBetaPostAuthorizationReadClientInput
): void {
  if (!isValidSupabaseProjectUrl(input.projectUrl)) {
    throw new Error(
      "Shared beta authorization read client requires a valid https://<ref>.supabase.co project URL."
    );
  }

  if (!isPublicAnonKey(input.anonKey)) {
    throw new Error(
      "Shared beta authorization read client requires a public anon or publishable key, not a service role or secret key."
    );
  }

  if (!input.accessToken.trim()) {
    throw new Error("Shared beta authorization read client requires an authenticated access token.");
  }

  if (/service[_-]?role/i.test(input.accessToken)) {
    throw new Error(
      "Shared beta authorization read client must not use a service role key as the access token."
    );
  }
}

function deny(
  code: SharedBetaPostAuthorizationSourceFailure,
  message: string
): SharedBetaPostAuthorizationSourceResult {
  return { ok: false, code, message };
}
