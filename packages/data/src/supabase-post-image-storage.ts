import type { ID } from "@mewri/core";
import type { SharedBetaPostImageUploadBroker } from "./shared-beta-post-image-upload-broker";

export const SHARED_BETA_POST_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const SHARED_BETA_POST_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type SharedBetaPostImageMimeType = (typeof SHARED_BETA_POST_IMAGE_MIME_TYPES)[number];

export interface SharedBetaPostImageFile {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface SharedBetaPostImageStorageClient {
  uploadObject(input: {
    bucket: string;
    objectPath: string;
    body: ArrayBuffer;
    contentType: SharedBetaPostImageMimeType;
  }): Promise<{ ok: true; bucket: string; objectPath: string } | { ok: false; error?: unknown }>;
  objectExists?(input: { bucket: string; objectPath: string }): Promise<boolean>;
}

export type SharedBetaPostImageFailureCode =
  | "image_required"
  | "unsupported_image_type"
  | "image_too_large"
  | "invalid_image_filename"
  | "storage_upload_failed"
  | "private_image_path_required"
  | "storage_object_not_found";

export type SharedBetaPostImageResult =
  | {
      ok: true;
      imagePath: string;
    }
  | {
      ok: false;
      code: SharedBetaPostImageFailureCode;
      message: string;
    };

export interface SharedBetaPostImageUploadOptions {
  broker: SharedBetaPostImageUploadBroker;
  authContext: {
    authenticatedUserId?: ID;
    accessToken?: string;
  };
  bucket: string;
  groupId: ID;
  userId: ID;
  file?: SharedBetaPostImageFile;
  generateFilename?: (input: { contentType: SharedBetaPostImageMimeType; originalName: string }) => string;
}

export async function uploadSharedBetaPostImage(
  options: SharedBetaPostImageUploadOptions
): Promise<SharedBetaPostImageResult> {
  const file = options.file;
  if (!file) {
    return deny("image_required", "Shared beta posting requires an image file.");
  }

  const contentType = normalizeSharedBetaPostImageMimeType(file.type);
  if (!contentType) {
    return deny("unsupported_image_type", "Shared beta post images must be JPEG, PNG, or WebP.");
  }

  if (file.size > SHARED_BETA_POST_IMAGE_MAX_BYTES) {
    return deny("image_too_large", "Shared beta post images must be 10 MB or smaller.");
  }

  const filename =
    options.generateFilename?.({ contentType, originalName: file.name }) ??
    `${defaultRandomId()}.${extensionForContentType(contentType)}`;
  if (!isSafeSharedBetaPostImageObjectFilename(filename)) {
    return deny("invalid_image_filename", "Shared beta post image filenames must be storage-safe.");
  }

  const objectPath = `${options.groupId}/${options.userId}/${filename}`;
  let upload: Awaited<ReturnType<SharedBetaPostImageUploadBroker["uploadPostImage"]>>;
  try {
    upload = await options.broker.uploadPostImage({
      authContext: options.authContext,
      bucket: options.bucket,
      groupId: options.groupId,
      userId: options.userId,
      objectPath,
      file
    });
  } catch {
    return deny("storage_upload_failed", "Shared beta post image upload failed.");
  }

  if (!upload.ok) {
    return deny("storage_upload_failed", "Shared beta post image upload failed.");
  }

  if (upload.bucket !== options.bucket || upload.objectPath !== objectPath) {
    return deny("storage_upload_failed", "Shared beta post image upload returned an unexpected object path.");
  }

  return {
    ok: true,
    imagePath: `${options.bucket}/${objectPath}`
  };
}

export async function verifySharedBetaPostImageObjectPath(input: {
  storage: Pick<SharedBetaPostImageStorageClient, "objectExists">;
  bucket: string;
  imagePath: string;
  groupId: ID;
  userId: ID;
}): Promise<SharedBetaPostImageResult> {
  const objectPath = toSharedBetaPostImageObjectPath(input.imagePath, input.bucket, input.groupId, input.userId);
  if (!objectPath) {
    return deny(
      "private_image_path_required",
      "Shared beta post images must be private objects owned by the authenticated group member."
    );
  }

  let objectExists = false;
  try {
    objectExists = input.storage.objectExists
      ? await input.storage.objectExists({ bucket: input.bucket, objectPath })
      : false;
  } catch {
    objectExists = false;
  }

  if (!objectExists) {
    return deny("storage_object_not_found", "Shared beta post image object could not be verified.");
  }

  return {
    ok: true,
    imagePath: input.imagePath
  };
}

export function toSharedBetaPostImageObjectPath(
  imagePath: string,
  bucket: string,
  groupId: ID,
  userId: ID
): string | undefined {
  const segments = imagePath.split("/");
  if (
    segments.length !== 4 ||
    segments[0] !== bucket ||
    segments[1] !== groupId ||
    segments[2] !== userId ||
    !isSafeSharedBetaPostImageObjectFilename(segments[3])
  ) {
    return undefined;
  }

  return `${segments[1]}/${segments[2]}/${segments[3]}`;
}

export function normalizeSharedBetaPostImageMimeType(contentType: string): SharedBetaPostImageMimeType | undefined {
  return SHARED_BETA_POST_IMAGE_MIME_TYPES.find((allowed) => allowed === contentType.trim().toLowerCase());
}

function extensionForContentType(contentType: SharedBetaPostImageMimeType): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

export function isSafeSharedBetaPostImageObjectFilename(filename: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(filename) && filename !== "." && filename !== "..";
}

function defaultRandomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function deny(code: SharedBetaPostImageFailureCode, message: string): SharedBetaPostImageResult {
  return { ok: false, code, message };
}
