import type { Post } from "@mewri/core";
import type { SharedBetaPostRouteBoundary } from "@mewri/data";
import { describe, expect, it, vi } from "vitest";
import { createSharedBetaPostRouteHandler } from "./route-boundary";

const SUBMITTED_POST: Post = {
  id: "post_shared_beta_created",
  userId: "user_demo",
  groupId: "group_first",
  themeId: "theme_cycle_group_first_2026-05-20_1",
  imageUrl: "post-images/group_first/user_demo/photo.webp",
  caption: "shared beta post",
  visibility: "group_only",
  createdAt: "2026-05-20T09:00:00.000Z",
  updatedAt: "2026-05-20T09:00:00.000Z"
};

describe("shared beta post HTTP route boundary", () => {
  it("responds with only the submitted post after a successful server-boundary command", async () => {
    const boundary: SharedBetaPostRouteBoundary = {
      submitPost() {
        return { ok: true, post: SUBMITTED_POST };
      }
    };
    const handler = createSharedBetaPostRouteHandler({
      async resolveAuthenticatedUserId() {
        return "user_demo";
      },
      async resolveValidatedImagePath() {
        return "post-images/group_first/user_demo/photo.webp";
      },
      resolveBoundary() {
        return boundary;
      }
    });

    const response = await handler(
      new Request("http://localhost/api/shared-beta/posts", {
        method: "POST",
        body: JSON.stringify({
          userId: "user_demo",
          groupId: "group_first",
          themeId: "theme_cycle_group_first_2026-05-20_1",
          caption: "shared beta post"
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, post: SUBMITTED_POST });
    expect(body).not.toHaveProperty("state");
  });

  it("rejects a request that claims its own image path was validated", async () => {
    const submitPost = vi.fn();
    const resolveValidatedImagePath = vi.fn();
    const handler = createSharedBetaPostRouteHandler({
      async resolveAuthenticatedUserId() {
        return "user_demo";
      },
      resolveValidatedImagePath,
      resolveBoundary() {
        return { submitPost };
      }
    });

    const response = await handler(
      new Request("http://localhost/api/shared-beta/posts", {
        method: "POST",
        body: JSON.stringify({
          userId: "user_demo",
          groupId: "group_first",
          themeId: "theme_cycle_group_first_2026-05-20_1",
          validatedImagePath: "post-images/group_first/user_demo/forged.webp"
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ ok: false, error: { code: "invalid_request_body" } });
    expect(resolveValidatedImagePath).not.toHaveBeenCalled();
    expect(submitPost).not.toHaveBeenCalled();
  });

  it("rejects a multipart request that claims its own image path was validated", async () => {
    const submitPost = vi.fn();
    const resolveValidatedImagePath = vi.fn();
    const handler = createSharedBetaPostRouteHandler({
      async resolveAuthenticatedUserId() {
        return "user_demo";
      },
      resolveValidatedImagePath,
      resolveBoundary() {
        return { submitPost };
      }
    });
    const formData = makeMultipartFormData();
    formData.set("imageUrl", "post-images/group_first/user_demo/forged.webp");

    const response = await handler(
      new Request("http://localhost/api/shared-beta/posts", {
        method: "POST",
        headers: {
          "content-length": "1024"
        },
        body: formData
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ ok: false, error: { code: "invalid_request_body" } });
    expect(resolveValidatedImagePath).not.toHaveBeenCalled();
    expect(submitPost).not.toHaveBeenCalled();
  });

  it("passes a multipart image file to server upload verification", async () => {
    const submitPost = vi.fn(() => ({ ok: true as const, post: SUBMITTED_POST }));
    const resolveValidatedImagePath = vi.fn(async (input) => {
      expect(input.post.imageFile).toMatchObject({
        name: "photo.webp",
        type: "image/webp",
        size: 3
      });
      return "post-images/group_first/user_demo/photo.webp";
    });
    const handler = createSharedBetaPostRouteHandler({
      async resolveAuthenticatedUserId() {
        return "user_demo";
      },
      resolveValidatedImagePath,
      resolveBoundary() {
        return { submitPost };
      }
    });

    const response = await handler(
      new Request("http://localhost/api/shared-beta/posts", {
        method: "POST",
        headers: {
          "content-length": "1024"
        },
        body: makeMultipartFormData()
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, post: SUBMITTED_POST });
    expect(resolveValidatedImagePath).toHaveBeenCalledOnce();
    expect(submitPost).toHaveBeenCalledOnce();
  });

  it("rejects unauthenticated multipart requests before body parsing", async () => {
    const resolveAuthenticatedUserId = vi.fn(async () => undefined);
    const resolveValidatedImagePath = vi.fn();
    const submitPost = vi.fn();
    const handler = createSharedBetaPostRouteHandler({
      resolveAuthenticatedUserId,
      resolveValidatedImagePath,
      resolveBoundary() {
        return { submitPost };
      }
    });

    const response = await handler(
      new Request("http://localhost/api/shared-beta/posts", {
        method: "POST",
        body: makeMultipartFormData()
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ ok: false, error: { code: "authentication_required" } });
    expect(resolveAuthenticatedUserId).toHaveBeenCalledOnce();
    expect(resolveValidatedImagePath).not.toHaveBeenCalled();
    expect(submitPost).not.toHaveBeenCalled();
  });

  it("rejects authenticated multipart requests without content-length before body parsing", async () => {
    const resolveAuthenticatedUserId = vi.fn(async () => "user_demo");
    const resolveValidatedImagePath = vi.fn();
    const submitPost = vi.fn();
    const handler = createSharedBetaPostRouteHandler({
      resolveAuthenticatedUserId,
      resolveValidatedImagePath,
      resolveBoundary() {
        return { submitPost };
      }
    });

    const response = await handler(
      new Request("http://localhost/api/shared-beta/posts", {
        method: "POST",
        body: makeMultipartFormData()
      })
    );
    const body = await response.json();

    expect(response.status).toBe(411);
    expect(body).toMatchObject({ ok: false, error: { code: "invalid_request_body" } });
    expect(resolveAuthenticatedUserId).toHaveBeenCalledOnce();
    expect(resolveValidatedImagePath).not.toHaveBeenCalled();
    expect(submitPost).not.toHaveBeenCalled();
  });

  it("rejects malformed multipart content-length before body parsing", async () => {
    const resolveAuthenticatedUserId = vi.fn(async () => "user_demo");
    const resolveValidatedImagePath = vi.fn();
    const submitPost = vi.fn();
    const handler = createSharedBetaPostRouteHandler({
      resolveAuthenticatedUserId,
      resolveValidatedImagePath,
      resolveBoundary() {
        return { submitPost };
      }
    });

    const response = await handler(
      new Request("http://localhost/api/shared-beta/posts", {
        method: "POST",
        headers: {
          "content-length": "1024 bytes"
        },
        body: makeMultipartFormData()
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ ok: false, error: { code: "invalid_request_body" } });
    expect(resolveAuthenticatedUserId).toHaveBeenCalledOnce();
    expect(resolveValidatedImagePath).not.toHaveBeenCalled();
    expect(submitPost).not.toHaveBeenCalled();
  });

  it("rejects oversized multipart requests after auth but before body parsing", async () => {
    const resolveAuthenticatedUserId = vi.fn(async () => "user_demo");
    const resolveValidatedImagePath = vi.fn();
    const submitPost = vi.fn();
    const handler = createSharedBetaPostRouteHandler({
      resolveAuthenticatedUserId,
      resolveValidatedImagePath,
      resolveBoundary() {
        return { submitPost };
      }
    });

    const response = await handler(
      new Request("http://localhost/api/shared-beta/posts", {
        method: "POST",
        headers: {
          "content-length": String(11 * 1024 * 1024)
        },
        body: makeMultipartFormData()
      })
    );
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toMatchObject({ ok: false, error: { code: "invalid_request_body" } });
    expect(resolveAuthenticatedUserId).toHaveBeenCalledOnce();
    expect(resolveValidatedImagePath).not.toHaveBeenCalled();
    expect(submitPost).not.toHaveBeenCalled();
  });

  it("does not invoke the post boundary when server upload verification finds no image", async () => {
    const submitPost = vi.fn();
    const handler = createSharedBetaPostRouteHandler({
      async resolveAuthenticatedUserId() {
        return "user_demo";
      },
      async resolveValidatedImagePath() {
        return undefined;
      },
      resolveBoundary() {
        return { submitPost };
      }
    });

    const response = await handler(
      new Request("http://localhost/api/shared-beta/posts", {
        method: "POST",
        body: JSON.stringify({
          userId: "user_demo",
          groupId: "group_first",
          themeId: "theme_cycle_group_first_2026-05-20_1"
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, error: { code: "validated_image_required" } });
    expect(submitPost).not.toHaveBeenCalled();
  });

  it("does not verify an image path for an impersonated user id", async () => {
    const submitPost = vi.fn();
    const resolveValidatedImagePath = vi.fn();
    const handler = createSharedBetaPostRouteHandler({
      async resolveAuthenticatedUserId() {
        return "user_demo";
      },
      resolveValidatedImagePath,
      resolveBoundary() {
        return { submitPost };
      }
    });

    const response = await handler(
      new Request("http://localhost/api/shared-beta/posts", {
        method: "POST",
        body: JSON.stringify({
          userId: "user_other",
          groupId: "group_first",
          themeId: "theme_cycle_group_first_2026-05-20_1"
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, error: { code: "identity_mismatch" } });
    expect(resolveValidatedImagePath).not.toHaveBeenCalled();
    expect(submitPost).not.toHaveBeenCalled();
  });

  it("does not invoke image verification or posting without an authenticated user", async () => {
    const submitPost = vi.fn();
    const resolveValidatedImagePath = vi.fn();
    const handler = createSharedBetaPostRouteHandler({
      async resolveAuthenticatedUserId() {
        return undefined;
      },
      resolveValidatedImagePath,
      resolveBoundary() {
        return { submitPost };
      }
    });

    const response = await handler(
      new Request("http://localhost/api/shared-beta/posts", {
        method: "POST",
        body: JSON.stringify({
          userId: "user_demo",
          groupId: "group_first",
          themeId: "theme_cycle_group_first_2026-05-20_1"
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ ok: false, error: { code: "authentication_required" } });
    expect(resolveValidatedImagePath).not.toHaveBeenCalled();
    expect(submitPost).not.toHaveBeenCalled();
  });
});

function makeMultipartFormData(): FormData {
  const formData = new FormData();
  formData.set("userId", "user_demo");
  formData.set("groupId", "group_first");
  formData.set("themeId", "theme_cycle_group_first_2026-05-20_1");
  formData.set("caption", "shared beta post");
  formData.set("image", new File([new Uint8Array([1, 2, 3])], "photo.webp", { type: "image/webp" }));
  return formData;
}
