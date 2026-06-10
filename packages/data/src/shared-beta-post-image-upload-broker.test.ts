import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  createStorageSharedBetaPostImageUploadBroker,
  type SharedBetaPostImageUploadBrokerInput
} from "./shared-beta-post-image-upload-broker";
import type { SharedBetaPostImageFile, SharedBetaPostImageStorageClient } from "./supabase-post-image-storage";

describe("shared beta post image upload broker", () => {
  it("is not exported through the package root used by browser-facing imports", () => {
    const packageRootIndex = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

    expect(packageRootIndex).not.toContain("shared-beta-post-image-upload-broker");
  });

  it("uploads through fake storage and returns only the confirmed bucket/object path", async () => {
    const storage: SharedBetaPostImageStorageClient = {
      uploadObject: vi.fn(async (input) => ({
        ok: true,
        bucket: input.bucket,
        objectPath: input.objectPath
      }))
    };
    const broker = createStorageSharedBetaPostImageUploadBroker(storage);

    const result = await broker.uploadPostImage(makeBrokerInput());

    expect(result).toEqual({
      ok: true,
      bucket: "post-images",
      objectPath: "group_first/user_demo/photo.webp"
    });
    expect(result).not.toHaveProperty("imageUrl");
    expect(result).not.toHaveProperty("validatedImagePath");
    expect(storage.uploadObject).toHaveBeenCalledWith({
      bucket: "post-images",
      objectPath: "group_first/user_demo/photo.webp",
      body: expect.any(ArrayBuffer),
      contentType: "image/webp"
    });
  });

  it.each([
    {
      label: "missing auth context",
      input: makeBrokerInput({ authContext: {} })
    },
    {
      label: "identity mismatch",
      input: makeBrokerInput({ authContext: { authenticatedUserId: "user_other" } })
    },
    {
      label: "unsafe object path",
      input: makeBrokerInput({ objectPath: "group_first/user_demo/../photo.webp" })
    },
    {
      label: "other group object path",
      input: makeBrokerInput({ objectPath: "group_other/user_demo/photo.webp" })
    },
    {
      label: "bad MIME",
      input: makeBrokerInput({ file: makeFile({ name: "photo.gif", type: "image/gif", size: 12 }) })
    },
    {
      label: "oversized image",
      input: makeBrokerInput({
        file: makeFile({ name: "photo.webp", type: "image/webp", size: 10 * 1024 * 1024 + 1 })
      })
    }
  ])("rejects $label before storage upload", async ({ input }) => {
    const storage: SharedBetaPostImageStorageClient = {
      uploadObject: vi.fn()
    };
    const broker = createStorageSharedBetaPostImageUploadBroker(storage);

    const result = await broker.uploadPostImage(input);

    expect(result).toMatchObject({ ok: false });
    expect(storage.uploadObject).not.toHaveBeenCalled();
  });

  it("fails closed when storage confirms a mismatched bucket or object path", async () => {
    const storage: SharedBetaPostImageStorageClient = {
      uploadObject: vi.fn(async () => ({
        ok: true,
        bucket: "post-images",
        objectPath: "group_first/user_demo/other.webp"
      }))
    };
    const broker = createStorageSharedBetaPostImageUploadBroker(storage);

    await expect(broker.uploadPostImage(makeBrokerInput())).resolves.toMatchObject({ ok: false });

    storage.uploadObject = vi.fn(async () => ({
      ok: true,
      bucket: "other-bucket",
      objectPath: "group_first/user_demo/photo.webp"
    }));

    await expect(broker.uploadPostImage(makeBrokerInput())).resolves.toMatchObject({ ok: false });
  });

  it("fails closed when file read or upload throws", async () => {
    const storage: SharedBetaPostImageStorageClient = {
      uploadObject: vi.fn(async () => {
        throw new Error("broker storage unavailable");
      })
    };
    const broker = createStorageSharedBetaPostImageUploadBroker(storage);

    await expect(broker.uploadPostImage(makeBrokerInput())).resolves.toMatchObject({ ok: false });

    const readFailureStorage: SharedBetaPostImageStorageClient = {
      uploadObject: vi.fn()
    };
    const readFailureBroker = createStorageSharedBetaPostImageUploadBroker(readFailureStorage);

    await expect(
      readFailureBroker.uploadPostImage(makeBrokerInput({ file: makeFile({ name: "photo.webp", type: "image/webp", size: 12, throwRead: true }) }))
    ).resolves.toMatchObject({ ok: false });
    expect(readFailureStorage.uploadObject).not.toHaveBeenCalled();
  });
});

function makeBrokerInput(overrides: Partial<SharedBetaPostImageUploadBrokerInput> = {}): SharedBetaPostImageUploadBrokerInput {
  return {
    authContext: { authenticatedUserId: "user_demo" },
    bucket: "post-images",
    groupId: "group_first",
    userId: "user_demo",
    objectPath: "group_first/user_demo/photo.webp",
    file: makeFile({ name: "photo.webp", type: "image/webp", size: 12 }),
    ...overrides
  };
}

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
