import type { ID } from "@mewri/core";
import type {
  SharedBetaPostAuthorizationSource,
  SharedBetaPostAuthorizationSourceFailure,
  SharedBetaPostAuthorizationSourceResult
} from "./shared-beta-post-authorization-source";

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

function deny(
  code: SharedBetaPostAuthorizationSourceFailure,
  message: string
): SharedBetaPostAuthorizationSourceResult {
  return { ok: false, code, message };
}
