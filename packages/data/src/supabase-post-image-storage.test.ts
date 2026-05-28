import { describe, expect, it, vi } from "vitest";
import {
  toSharedBetaPostImageObjectPath,
  uploadSharedBetaPostImage,
  verifySharedBetaPostImageObjectPath,
  type SharedBetaPostImageFile,
  type SharedBetaPostImageStorageClient
} from "./supabase-post-image-storage";

describe("supabase post image storage boundary", () => {
  it("uploads an allowed image to a private group/user object path", async () => {
    const storage: SharedBetaPostImageStorageClient = {
      uploadObject: vi.fn(async () => ({ ok: true }))
    };

    const result = await uploadSharedBetaPostImage({
      storage,
      bucket: "post-images",
      groupId: "group_first",
      userId: "user_demo",
      file: makeFile({ name: "original.png", type: "image/png", size: 12 }),
      generateFilename: () => "photo.png"
    });

    expect(result).toEqual({ ok: true, imagePath: "post-images/group_first/user_demo/photo.png" });
    expect(storage.uploadObject).toHaveBeenCalledWith({
      bucket: "post-images",
      objectPath: "group_first/user_demo/photo.png",
      body: expect.any(ArrayBuffer),
      contentType: "image/png"
    });
  });

  it.each([
    {
      name: "missing image",
      expectedCode: "image_required",
      file: undefined
    },
    {
      name: "bad MIME type",
      expectedCode: "unsupported_image_type",
      file: makeFile({ name: "photo.gif", type: "image/gif", size: 12 })
    },
    {
      name: "oversized image",
      expectedCode: "image_too_large",
      file: makeFile({ name: "photo.webp", type: "image/webp", size: 10 * 1024 * 1024 + 1 })
    }
  ])("rejects $name before upload", async ({ expectedCode, file }) => {
    const storage: SharedBetaPostImageStorageClient = {
      uploadObject: vi.fn(async () => ({ ok: true }))
    };

    const result = await uploadSharedBetaPostImage({
      storage,
      bucket: "post-images",
      groupId: "group_first",
      userId: "user_demo",
      file
    });

    expect(result).toMatchObject({ ok: false, code: expectedCode });
    expect(storage.uploadObject).not.toHaveBeenCalled();
  });

  it("rejects unsafe generated filenames", async () => {
    const storage: SharedBetaPostImageStorageClient = {
      uploadObject: vi.fn(async () => ({ ok: true }))
    };

    const result = await uploadSharedBetaPostImage({
      storage,
      bucket: "post-images",
      groupId: "group_first",
      userId: "user_demo",
      file: makeFile({ name: "photo.webp", type: "image/webp", size: 12 }),
      generateFilename: () => "../photo.webp"
    });

    expect(result).toMatchObject({ ok: false, code: "invalid_image_filename" });
    expect(storage.uploadObject).not.toHaveBeenCalled();
  });

  it("verifies only matching private post image paths", async () => {
    const storage: SharedBetaPostImageStorageClient = {
      uploadObject: vi.fn(),
      objectExists: vi.fn(async () => true)
    };

    await expect(
      verifySharedBetaPostImageObjectPath({
        storage,
        bucket: "post-images",
        imagePath: "post-images/group_first/user_demo/photo.webp",
        groupId: "group_first",
        userId: "user_demo"
      })
    ).resolves.toEqual({ ok: true, imagePath: "post-images/group_first/user_demo/photo.webp" });
    expect(storage.objectExists).toHaveBeenCalledWith({
      bucket: "post-images",
      objectPath: "group_first/user_demo/photo.webp"
    });

    expect(
      await verifySharedBetaPostImageObjectPath({
        storage,
        bucket: "post-images",
        imagePath: "post-images/group_first/user_other/photo.webp",
        groupId: "group_first",
        userId: "user_demo"
      })
    ).toMatchObject({ ok: false, code: "private_image_path_required" });
  });

  it("maps a full private image path to the bucket object path", () => {
    expect(
      toSharedBetaPostImageObjectPath(
        "post-images/group_first/user_demo/photo.webp",
        "post-images",
        "group_first",
        "user_demo"
      )
    ).toBe("group_first/user_demo/photo.webp");
  });
});

function makeFile(input: { name: string; type: string; size: number }): SharedBetaPostImageFile {
  return {
    ...input,
    async arrayBuffer() {
      return new ArrayBuffer(input.size);
    }
  };
}
