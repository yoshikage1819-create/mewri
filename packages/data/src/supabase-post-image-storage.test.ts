import { describe, expect, it, vi } from "vitest";
import { createStorageSharedBetaPostImageUploadBroker } from "./shared-beta-post-image-upload-broker";
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
      uploadObject: vi.fn(async (input: { bucket: string; objectPath: string }) => ({
        ok: true,
        bucket: input.bucket,
        objectPath: input.objectPath
      }))
    };

    const result = await uploadSharedBetaPostImage({
      broker: createStorageSharedBetaPostImageUploadBroker(storage),
      authContext: { authenticatedUserId: "user_demo" },
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
  ])("rejects $name before broker upload", async ({ expectedCode, file }) => {
    const broker = {
      uploadPostImage: vi.fn()
    };

    const result = await uploadSharedBetaPostImage({
      broker,
      authContext: { authenticatedUserId: "user_demo" },
      bucket: "post-images",
      groupId: "group_first",
      userId: "user_demo",
      file
    });

    expect(result).toMatchObject({ ok: false, code: expectedCode });
    expect(broker.uploadPostImage).not.toHaveBeenCalled();
  });

  it("rejects unsafe generated filenames", async () => {
    const broker = {
      uploadPostImage: vi.fn()
    };

    const result = await uploadSharedBetaPostImage({
      broker,
      authContext: { authenticatedUserId: "user_demo" },
      bucket: "post-images",
      groupId: "group_first",
      userId: "user_demo",
      file: makeFile({ name: "photo.webp", type: "image/webp", size: 12 }),
      generateFilename: () => "../photo.webp"
    });

    expect(result).toMatchObject({ ok: false, code: "invalid_image_filename" });
    expect(broker.uploadPostImage).not.toHaveBeenCalled();
  });

  it("rejects upload success when storage returns a different bucket or object path", async () => {
    const storage: SharedBetaPostImageStorageClient = {
      uploadObject: vi.fn(async () => ({
        ok: true,
        bucket: "other-bucket",
        objectPath: "group_first/user_demo/photo.webp"
      }))
    };

    const result = await uploadSharedBetaPostImage({
      broker: createStorageSharedBetaPostImageUploadBroker(storage),
      authContext: { authenticatedUserId: "user_demo" },
      bucket: "post-images",
      groupId: "group_first",
      userId: "user_demo",
      file: makeFile({ name: "photo.webp", type: "image/webp", size: 12 }),
      generateFilename: () => "photo.webp"
    });

    expect(result).toMatchObject({ ok: false, code: "storage_upload_failed" });
    expect(storage.uploadObject).toHaveBeenCalledOnce();
  });

  it("fails closed when the file read or storage upload throws", async () => {
    const throwingStorage: SharedBetaPostImageStorageClient = {
      uploadObject: vi.fn(async () => {
        throw new Error("network unavailable");
      })
    };

    await expect(
      uploadSharedBetaPostImage({
        broker: createStorageSharedBetaPostImageUploadBroker(throwingStorage),
        authContext: { authenticatedUserId: "user_demo" },
        bucket: "post-images",
        groupId: "group_first",
        userId: "user_demo",
        file: makeFile({ name: "photo.webp", type: "image/webp", size: 12 }),
        generateFilename: () => "photo.webp"
      })
    ).resolves.toMatchObject({ ok: false, code: "storage_upload_failed" });

    const storage: SharedBetaPostImageStorageClient = {
      uploadObject: vi.fn()
    };
    await expect(
      uploadSharedBetaPostImage({
        broker: createStorageSharedBetaPostImageUploadBroker(storage),
        authContext: { authenticatedUserId: "user_demo" },
        bucket: "post-images",
        groupId: "group_first",
        userId: "user_demo",
        file: makeFile({ name: "photo.webp", type: "image/webp", size: 12, throwRead: true }),
        generateFilename: () => "photo.webp"
      })
    ).resolves.toMatchObject({ ok: false, code: "storage_upload_failed" });
    expect(storage.uploadObject).not.toHaveBeenCalled();
  });

  it("fails closed when an injected upload broker throws", async () => {
    const broker = {
      uploadPostImage: vi.fn(async () => {
        throw new Error("broker unavailable");
      })
    };

    await expect(
      uploadSharedBetaPostImage({
        broker,
        authContext: { authenticatedUserId: "user_demo" },
        bucket: "post-images",
        groupId: "group_first",
        userId: "user_demo",
        file: makeFile({ name: "photo.webp", type: "image/webp", size: 12 }),
        generateFilename: () => "photo.webp"
      })
    ).resolves.toMatchObject({ ok: false, code: "storage_upload_failed" });
    expect(broker.uploadPostImage).toHaveBeenCalledOnce();
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

  it("fails closed when object existence verification throws", async () => {
    const storage: SharedBetaPostImageStorageClient = {
      uploadObject: vi.fn(),
      objectExists: vi.fn(async () => {
        throw new Error("storage list denied");
      })
    };

    await expect(
      verifySharedBetaPostImageObjectPath({
        storage,
        bucket: "post-images",
        imagePath: "post-images/group_first/user_demo/photo.webp",
        groupId: "group_first",
        userId: "user_demo"
      })
    ).resolves.toMatchObject({ ok: false, code: "storage_object_not_found" });
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

function makeFile(input: { name: string; type: string; size: number; throwRead?: boolean }): SharedBetaPostImageFile {
  return {
    ...input,
    async arrayBuffer() {
      if (input.throwRead) {
        throw new Error("file read failed");
      }

      return new ArrayBuffer(input.size);
    }
  };
}
