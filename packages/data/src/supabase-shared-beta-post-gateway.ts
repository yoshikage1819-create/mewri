import type { Post } from "@mewri/core";
import { postFromDbRow } from "./db-mappers";
import type { DbPostRow } from "./db-row-types";
import type { SubmitPostCommand } from "./mewri-app-service";

export interface SupabaseSharedBetaPostGatewayClient {
  createPostWithEvent(input: {
    userId: string;
    groupId: string;
    themeId: string;
    imagePath: string;
    caption: string;
  }): Promise<
    | {
        ok: true;
        post: DbPostRow;
        eventCreated: true;
      }
    | {
        ok: false;
        error?: unknown;
      }
  >;
}

export interface AsyncSharedBetaPostCommandService {
  submitPost(command: SubmitPostCommand): Promise<Post>;
}

/**
 * Server-controlled shared-beta post gateway.
 *
 * This intentionally models one atomic post+event operation. A real Supabase
 * implementation should back this with a narrow RPC or equivalent transaction;
 * separate table inserts are not sufficient for beta rollout.
 */
export function createSupabaseSharedBetaPostGateway(
  client: SupabaseSharedBetaPostGatewayClient
): AsyncSharedBetaPostCommandService {
  return {
    async submitPost(command) {
      const result = await client.createPostWithEvent({
        userId: command.input.userId,
        groupId: command.input.groupId,
        themeId: command.input.themeId,
        imagePath: command.input.imageUrl,
        caption: command.input.caption
      });

      if (!result.ok) {
        throw new Error("Shared beta post gateway failed to create the post and event atomically.");
      }

      if (result.eventCreated !== true) {
        throw new Error("Shared beta post gateway must create a post_created event with the post.");
      }

      return postFromDbRow(result.post);
    }
  };
}
