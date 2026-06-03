import type { ID } from "@mewri/core";
import type { SharedBetaPostRouteBoundary } from "@mewri/data";
import {
  SHARED_BETA_POST_IMAGE_MAX_BYTES,
  type SharedBetaPostImageFile
} from "@mewri/data/src/supabase-post-image-storage";
import { formValueToSharedBetaPostImageFile, SHARED_BETA_POST_IMAGE_FORM_FIELD } from "./image-file";

const SHARED_BETA_MULTIPART_OVERHEAD_MAX_BYTES = 64 * 1024;
const SHARED_BETA_MULTIPART_MAX_BYTES =
  SHARED_BETA_POST_IMAGE_MAX_BYTES + SHARED_BETA_MULTIPART_OVERHEAD_MAX_BYTES;

interface SharedBetaPostRoutePostInput {
  userId: string;
  groupId: string;
  themeId: string;
  caption?: string;
  imageFile?: SharedBetaPostImageFile;
}

export interface SharedBetaPostRouteDependencies {
  isRouteAvailable?(): boolean;
  resolveAuthenticatedUserId(request: Request): Promise<ID | undefined>;
  resolveValidatedImagePath(input: {
    request: Request;
    authenticatedUserId: ID;
    post: SharedBetaPostRoutePostInput;
  }): Promise<string | undefined>;
  resolveBoundary(input?: {
    request: Request;
    authenticatedUserId: ID;
    post: SharedBetaPostRoutePostInput;
  }): SharedBetaPostRouteBoundary | undefined;
}

/**
 * Shared-beta post route stays unavailable until authenticated server adapter
 * wiring is implemented. This keeps local demo behavior untouched.
 */
export const defaultSharedBetaPostRouteDependencies: SharedBetaPostRouteDependencies = {
  isRouteAvailable() {
    return false;
  },
  async resolveAuthenticatedUserId() {
    return undefined;
  },
  async resolveValidatedImagePath() {
    return undefined;
  },
  resolveBoundary() {
    return undefined;
  }
};

export function createSharedBetaPostRouteHandler(
  dependencies: SharedBetaPostRouteDependencies = defaultSharedBetaPostRouteDependencies
): (request: Request) => Promise<Response> {
  return async function POST(request: Request): Promise<Response> {
    const routeAvailable = dependencies.isRouteAvailable?.() ?? Boolean(dependencies.resolveBoundary());
    if (!routeAvailable) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "shared_beta_route_unavailable",
            message:
              "Shared beta post route is not enabled. Authenticated server adapter wiring is required before rollout."
          }
        },
        { status: 503 }
      );
    }

    const authenticatedUserId = await dependencies.resolveAuthenticatedUserId(request);

    if (!authenticatedUserId) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "authentication_required",
            message: "Shared beta posting requires an authenticated user."
          }
        },
        { status: 401 }
      );
    }

    const parsedBody = await parseBody(request);
    if (!parsedBody.ok) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "invalid_request_body",
            message: parsedBody.error
          }
        },
        { status: parsedBody.status ?? 400 }
      );
    }

    if (authenticatedUserId !== parsedBody.value.userId) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "identity_mismatch",
            message: "Authenticated users may create shared beta posts only as themselves."
          }
        },
        { status: 403 }
      );
    }

    const validatedImagePath = await dependencies.resolveValidatedImagePath({
      request,
      authenticatedUserId,
      post: parsedBody.value
    });

    if (!validatedImagePath) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "validated_image_required",
            message: "Shared beta posting requires an image verified by the server upload boundary."
          }
        },
        { status: 403 }
      );
    }

    const boundary = dependencies.resolveBoundary({
      request,
      authenticatedUserId,
      post: parsedBody.value
    });
    if (!boundary) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "shared_beta_route_unavailable",
            message:
              "Shared beta post route is not enabled. Authenticated server adapter wiring is required before rollout."
          }
        },
        { status: 503 }
      );
    }

    const result = await boundary.submitPost({
      actor: { authenticatedUserId },
      post: parsedBody.value,
      serverValidatedImagePath: validatedImagePath
    });

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: {
            code: result.code,
            message: result.message
          }
        },
        { status: result.status }
      );
    }

    return Response.json(
      {
        ok: true,
        post: result.post
      },
      { status: 200 }
    );
  };
}

async function parseBody(request: Request): Promise<
  | {
      ok: true;
      value: SharedBetaPostRoutePostInput;
    }
  | { ok: false; error: string; status?: number }
> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().includes("multipart/form-data")) {
    return parseMultipartBody(request);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return { ok: false, error: "Request body must be valid JSON." };
  }

  if (!isRecord(body)) {
    return { ok: false, error: "Request body must be an object." };
  }

  if ("validatedImagePath" in body || "imageUrl" in body) {
    return { ok: false, error: "Client-supplied image paths are not accepted." };
  }

  const userId = asNonEmptyString(body.userId);
  const groupId = asNonEmptyString(body.groupId);
  const themeId = asNonEmptyString(body.themeId);
  const caption = asOptionalString(body.caption);

  if (!userId || !groupId || !themeId) {
    return {
      ok: false,
      error: "userId, groupId, and themeId are required strings."
    };
  }

  return {
    ok: true,
    value: {
      userId,
      groupId,
      themeId,
      caption
    }
  };
}

async function parseMultipartBody(request: Request): Promise<
  | {
      ok: true;
      value: SharedBetaPostRoutePostInput;
    }
  | { ok: false; error: string; status?: number }
> {
  const lengthCheck = validateMultipartContentLength(request);
  if (!lengthCheck.ok) {
    return lengthCheck;
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return { ok: false, error: "Multipart request body must be valid form data." };
  }

  if (formData.has("validatedImagePath") || formData.has("imageUrl")) {
    return { ok: false, error: "Client-supplied image paths are not accepted." };
  }

  const userId = asNonEmptyString(formData.get("userId"));
  const groupId = asNonEmptyString(formData.get("groupId"));
  const themeId = asNonEmptyString(formData.get("themeId"));
  const caption = asOptionalString(formData.get("caption"));

  if (!userId || !groupId || !themeId) {
    return {
      ok: false,
      error: "userId, groupId, and themeId are required strings."
    };
  }

  return {
    ok: true,
    value: {
      userId,
      groupId,
      themeId,
      caption,
      imageFile: formValueToSharedBetaPostImageFile(formData.get(SHARED_BETA_POST_IMAGE_FORM_FIELD))
    }
  };
}

function validateMultipartContentLength(request: Request): { ok: true } | { ok: false; error: string; status: number } {
  const rawContentLength = request.headers.get("content-length");
  if (!rawContentLength) {
    return {
      ok: false,
      error: "Multipart request content-length is required before reading an image upload.",
      status: 411
    };
  }

  if (!/^[0-9]+$/.test(rawContentLength)) {
    return {
      ok: false,
      error: "Multipart request content-length must be a positive integer.",
      status: 400
    };
  }

  const contentLength = Number.parseInt(rawContentLength, 10);
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
    return {
      ok: false,
      error: "Multipart request content-length must be a positive integer.",
      status: 400
    };
  }

  if (contentLength > SHARED_BETA_MULTIPART_MAX_BYTES) {
    return {
      ok: false,
      error: "Multipart request body is too large.",
      status: 413
    };
  }

  return { ok: true };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}
