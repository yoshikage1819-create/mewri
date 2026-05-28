import type { ID, Post } from "@mewri/core";
import type { SubmitPostCommand } from "./mewri-app-service";
import { submitPost } from "./mewri-service";
import type { MewriRepository } from "./repository";

export type SharedBetaPostAuthorizationFailure =
  | "server_request_required"
  | "authentication_required"
  | "identity_mismatch"
  | "group_membership_required"
  | "active_group_theme_required"
  | "validated_image_required"
  | "private_image_path_required";

export interface SharedBetaPostAuthorizationOptions {
  postImageBucket: string;
  isPostImageUploadValidated(input: {
    imagePath: string;
    groupId: ID;
    userId: ID;
  }): boolean;
}

export interface SharedBetaPostCommandService {
  submitPost(command: SubmitPostCommand): Post;
}

export class SharedBetaPostAuthorizationError extends Error {
  constructor(
    readonly code: SharedBetaPostAuthorizationFailure,
    message: string
  ) {
    super(message);
    this.name = "SharedBetaPostAuthorizationError";
  }
}

/**
 * Verifies inputs that an authenticated server post route must prove before
 * it may use server-only credentials to write a shared-beta post.
 */
export function assertSharedBetaPostSubmissionAllowed(
  repository: MewriRepository,
  command: SubmitPostCommand,
  options: SharedBetaPostAuthorizationOptions
): void {
  const context = command.context;
  const actorId = context?.currentUserId;

  if (context?.requestSource !== "server_action" && context?.requestSource !== "api_route") {
    deny("server_request_required", "Shared beta posts must be submitted through an authenticated server route.");
  }

  if (!actorId) {
    deny("authentication_required", "Shared beta posts require an authenticated user.");
  }

  if (actorId !== command.input.userId) {
    deny("identity_mismatch", "Authenticated users may create posts only as themselves.");
  }

  const isMember = repository.groupMembers
    .listByGroupId(command.input.groupId)
    .some((member) => member.userId === actorId);
  if (!isMember) {
    deny("group_membership_required", "Shared beta posts require membership in the destination group.");
  }

  const theme = repository.themes.getById(command.input.themeId);
  if (!theme || theme.groupId !== command.input.groupId || theme.status !== "active") {
    deny("active_group_theme_required", "Shared beta posts require an active theme in the destination group.");
  }

  if (!isPrivatePostImagePath(command.input.imageUrl, options.postImageBucket, command.input.groupId, actorId)) {
    deny(
      "private_image_path_required",
      "Shared beta posts require a private image object path owned by the authenticated group member."
    );
  }

  if (
    !options.isPostImageUploadValidated({
      imagePath: command.input.imageUrl,
      groupId: command.input.groupId,
      userId: actorId
    })
  ) {
    deny(
      "validated_image_required",
      "Shared beta posts require an image verified by a server-side upload or storage lookup."
    );
  }
}

/**
 * Narrow server-route entry point for shared-beta posting. It does not expose
 * demo controls or unguarded write commands.
 */
export function createSharedBetaPostCommandService(
  repository: MewriRepository,
  options: SharedBetaPostAuthorizationOptions
): SharedBetaPostCommandService {
  return {
    submitPost(command) {
      assertSharedBetaPostSubmissionAllowed(repository, command, options);
      const state = submitPost(repository, command.input);
      const post = state.posts[0];
      if (!post) {
        throw new Error("Shared beta post submission completed without a created post.");
      }
      return post;
    }
  };
}

function isPrivatePostImagePath(imagePath: string, bucket: string, groupId: ID, userId: ID): boolean {
  const segments = imagePath.split("/");
  return (
    segments.length === 4 &&
    segments[0] === bucket &&
    segments[1] === groupId &&
    segments[2] === userId &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segments[3]) &&
    segments[3] !== "." &&
    segments[3] !== ".."
  );
}

function deny(code: SharedBetaPostAuthorizationFailure, message: string): never {
  throw new SharedBetaPostAuthorizationError(code, message);
}
