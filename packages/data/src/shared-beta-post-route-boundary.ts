import type { ID, Post } from "@mewri/core";
import type { SubmitPostCommand } from "./mewri-app-service";
import type { MewriRepository } from "./repository";
import {
  assertSharedBetaPostSubmissionAllowed,
  SharedBetaPostAuthorizationError,
  type SharedBetaPostAuthorizationFailure,
  type SharedBetaPostAuthorizationOptions,
  type SharedBetaPostCommandService
} from "./shared-beta-post-authorization";

export interface SharedBetaPostRouteActor {
  authenticatedUserId?: ID;
}

export interface SharedBetaPostRouteInput {
  actor: SharedBetaPostRouteActor;
  post: {
    userId: SubmitPostCommand["input"]["userId"];
    groupId: SubmitPostCommand["input"]["groupId"];
    themeId: SubmitPostCommand["input"]["themeId"];
    caption?: SubmitPostCommand["input"]["caption"];
  };
  serverValidatedImagePath?: string;
}

export type SharedBetaPostRouteFailureCode =
  | "authentication_required"
  | "identity_mismatch"
  | SharedBetaPostAuthorizationFailure;

export type SharedBetaPostRouteResult =
  | {
      ok: true;
      post: Post;
    }
  | {
      ok: false;
      code: SharedBetaPostRouteFailureCode;
      status: number;
      message: string;
    };

export interface SharedBetaPostRouteBoundary {
  submitPost(input: SharedBetaPostRouteInput): SharedBetaPostRouteResult;
}

export interface SharedBetaPostRouteBoundaryDependencies {
  repository: MewriRepository;
  postCommandService: Pick<SharedBetaPostCommandService, "submitPost">;
  authorization: SharedBetaPostAuthorizationOptions;
}

/**
 * Server-route boundary for future shared-beta posting.
 *
 * It derives trusted command context from authenticated server input and
 * validates authorization before invoking the post command.
 */
export function createSharedBetaPostRouteBoundary(
  dependencies: SharedBetaPostRouteBoundaryDependencies
): SharedBetaPostRouteBoundary {
  return {
    submitPost(input) {
      const authenticatedUserId = input.actor.authenticatedUserId;
      if (!authenticatedUserId) {
        return deny("authentication_required", 401, "Shared beta posting requires an authenticated user.");
      }

      if (authenticatedUserId !== input.post.userId) {
        return deny("identity_mismatch", 403, "Authenticated users may create shared beta posts only as themselves.");
      }

      if (!input.serverValidatedImagePath) {
        return deny(
          "validated_image_required",
          403,
          "Shared beta posting requires an image verified by the server upload boundary."
        );
      }

      const command: SubmitPostCommand = {
        context: {
          currentUserId: authenticatedUserId,
          requestSource: "api_route"
        },
        input: {
          userId: input.post.userId,
          groupId: input.post.groupId,
          themeId: input.post.themeId,
          caption: input.post.caption ?? "",
          imageUrl: input.serverValidatedImagePath
        }
      };

      try {
        assertSharedBetaPostSubmissionAllowed(dependencies.repository, command, dependencies.authorization);
      } catch (error) {
        if (error instanceof SharedBetaPostAuthorizationError) {
          return deny(error.code, statusForAuthorizationFailure(error.code), error.message);
        }
        throw error;
      }

      return {
        ok: true,
        post: dependencies.postCommandService.submitPost(command)
      };
    }
  };
}

function statusForAuthorizationFailure(code: SharedBetaPostAuthorizationFailure): number {
  switch (code) {
    case "authentication_required":
      return 401;
    case "server_request_required":
    case "identity_mismatch":
    case "group_membership_required":
    case "active_group_theme_required":
    case "validated_image_required":
    case "private_image_path_required":
      return 403;
  }
}

function deny(code: SharedBetaPostRouteFailureCode, status: number, message: string): SharedBetaPostRouteResult {
  return {
    ok: false,
    code,
    status,
    message
  };
}
