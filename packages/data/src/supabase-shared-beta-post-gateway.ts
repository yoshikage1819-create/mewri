import type { Post } from "@mewri/core";
import { postFromDbRow } from "./db-mappers";
import type { DbPostRow } from "./db-row-types";
import type { SubmitPostCommand } from "./mewri-app-service";

export const CREATE_SHARED_BETA_POST_RPC = "create_shared_beta_post";

export interface SupabaseSharedBetaPostRpcClient {
  rpc(
    name: typeof CREATE_SHARED_BETA_POST_RPC,
    params: {
      p_user_id: string;
      p_group_id: string;
      p_theme_id: string;
      p_image_path: string;
      p_caption: string;
    }
  ): Promise<{
    data: DbPostRow[] | null;
    error: unknown;
  }>;
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
  client: SupabaseSharedBetaPostRpcClient
): AsyncSharedBetaPostCommandService {
  return {
    async submitPost(command) {
      const result = await client.rpc(CREATE_SHARED_BETA_POST_RPC, {
        p_user_id: command.input.userId,
        p_group_id: command.input.groupId,
        p_theme_id: command.input.themeId,
        p_image_path: command.input.imageUrl,
        p_caption: command.input.caption
      });

      if (result.error) {
        throw new Error("Shared beta post gateway failed to create the post and event atomically.");
      }

      if (!result.data || result.data.length !== 1) {
        throw new Error("Shared beta post gateway must return exactly one created post row.");
      }

      const postRow = result.data[0];
      if (
        postRow.user_id !== command.input.userId ||
        postRow.group_id !== command.input.groupId ||
        postRow.theme_id !== command.input.themeId ||
        postRow.image_url !== command.input.imageUrl
      ) {
        throw new Error("Shared beta post gateway returned a post row that does not match the command.");
      }

      return postFromDbRow(postRow);
    }
  };
}
