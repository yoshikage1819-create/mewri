import type { ID } from "@mewri/core";
import {
  SHARED_BETA_POST_IMAGE_MAX_BYTES,
  isSafeSharedBetaPostImageObjectFilename,
  normalizeSharedBetaPostImageMimeType,
  type SharedBetaPostImageFile,
  type SharedBetaPostImageStorageClient
} from "./supabase-post-image-storage";

export interface SharedBetaPostImageUploadBrokerAuthContext {
  authenticatedUserId?: ID;
  accessToken?: string;
}

export interface SharedBetaPostImageUploadBrokerInput {
  authContext: SharedBetaPostImageUploadBrokerAuthContext;
  bucket: string;
  groupId: ID;
  userId: ID;
  objectPath: string;
  file: SharedBetaPostImageFile;
}

export type SharedBetaPostImageUploadBrokerResult =
  | {
      ok: true;
      bucket: string;
      objectPath: string;
    }
  | {
      ok: false;
      error?: unknown;
    };

export interface SharedBetaPostImageUploadBroker {
  uploadPostImage(
    input: SharedBetaPostImageUploadBrokerInput
  ): Promise<SharedBetaPostImageUploadBrokerResult>;
}

export function createStorageSharedBetaPostImageUploadBroker(
  storage: SharedBetaPostImageStorageClient
): SharedBetaPostImageUploadBroker {
  return {
    async uploadPostImage(input) {
      if (!input.authContext.authenticatedUserId || input.authContext.authenticatedUserId !== input.userId) {
        return { ok: false, error: new Error("Shared beta image upload requires authenticated member context.") };
      }

      if (!isExpectedPrivateObjectPath(input.objectPath, input.groupId, input.userId)) {
        return { ok: false, error: new Error("Shared beta image upload object path is not allowed.") };
      }

      const contentType = normalizeSharedBetaPostImageMimeType(input.file.type);
      if (!contentType) {
        return { ok: false, error: new Error("Shared beta image upload MIME type is not allowed.") };
      }

      if (input.file.size > SHARED_BETA_POST_IMAGE_MAX_BYTES) {
        return { ok: false, error: new Error("Shared beta image upload file is too large.") };
      }

      let body: ArrayBuffer;
      try {
        body = await input.file.arrayBuffer();
      } catch (error) {
        return { ok: false, error };
      }

      try {
        const upload = await storage.uploadObject({
          bucket: input.bucket,
          objectPath: input.objectPath,
          body,
          contentType
        });

        if (!upload.ok || upload.bucket !== input.bucket || upload.objectPath !== input.objectPath) {
          return { ok: false, error: upload.ok ? undefined : upload.error };
        }

        return {
          ok: true,
          bucket: upload.bucket,
          objectPath: upload.objectPath
        };
      } catch (error) {
        return { ok: false, error };
      }
    }
  };
}

function isExpectedPrivateObjectPath(objectPath: string, groupId: ID, userId: ID): boolean {
  const segments = objectPath.split("/");
  return (
    segments.length === 3 &&
    segments[0] === groupId &&
    segments[1] === userId &&
    isSafeSharedBetaPostImageObjectFilename(segments[2])
  );
}
