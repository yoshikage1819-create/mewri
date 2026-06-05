import type { ID } from "@mewri/core";
import type { MewriRepository } from "./repository";

export type SharedBetaPostAuthorizationSourceFailure =
  | "group_membership_required"
  | "active_group_theme_required";

export type SharedBetaPostAuthorizationSourceResult =
  | { ok: true }
  | {
      ok: false;
      code: SharedBetaPostAuthorizationSourceFailure;
      message: string;
    };

export interface SharedBetaPostAuthorizationSource {
  canCreatePost(input: {
    authenticatedUserId: ID;
    groupId: ID;
    themeId: ID;
  }): SharedBetaPostAuthorizationSourceResult | Promise<SharedBetaPostAuthorizationSourceResult>;
}

export function createRepositorySharedBetaPostAuthorizationSource(
  repository: Pick<MewriRepository, "groupMembers" | "themes">
): SharedBetaPostAuthorizationSource {
  return {
    canCreatePost(input) {
      const isMember = repository.groupMembers
        .listByGroupId(input.groupId)
        .some((member) => member.userId === input.authenticatedUserId);
      if (!isMember) {
        return deny("group_membership_required", "Shared beta posts require membership in the destination group.");
      }

      const theme = repository.themes.getById(input.themeId);
      if (!theme || theme.groupId !== input.groupId || theme.status !== "active") {
        return deny("active_group_theme_required", "Shared beta posts require an active theme in the destination group.");
      }

      return { ok: true };
    }
  };
}

function deny(
  code: SharedBetaPostAuthorizationSourceFailure,
  message: string
): SharedBetaPostAuthorizationSourceResult {
  return { ok: false, code, message };
}
