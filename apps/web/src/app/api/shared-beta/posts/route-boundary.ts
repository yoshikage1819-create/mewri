import type { ID } from "@mewri/core";
import type { SharedBetaPostRouteBoundary } from "@mewri/data";

export interface SharedBetaPostRouteDependencies {
  resolveAuthenticatedUserId(request: Request): Promise<ID | undefined>;
  resolveValidatedImagePath(input: {
    request: Request;
    authenticatedUserId: ID;
    post: {
      userId: ID;
      groupId: ID;
      themeId: ID;
      caption?: string;
    };
  }): Promise<string | undefined>;
  resolveBoundary(): SharedBetaPostRouteBoundary | undefined;
}

/**
 * Shared-beta post route stays unavailable until authenticated server adapter
 * wiring is implemented. This keeps local demo behavior untouched.
 */
export const defaultSharedBetaPostRouteDependencies: SharedBetaPostRouteDependencies = {
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
    const boundary = dependencies.resolveBoundary();
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
        { status: 400 }
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

    const result = boundary.submitPost({
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
      value: {
        userId: string;
        groupId: string;
        themeId: string;
        caption?: string;
      };
    }
  | { ok: false; error: string }
> {
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
