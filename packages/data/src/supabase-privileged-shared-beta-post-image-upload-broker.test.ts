import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabasePrivilegedSharedBetaPostImageUploadBroker,
  resolveStagingSupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment
} from "./supabase-privileged-shared-beta-post-image-upload-broker";
import type { SharedBetaPostImageUploadBrokerInput } from "./shared-beta-post-image-upload-broker";
import type { SharedBetaPostImageFile } from "./supabase-post-image-storage";

const { createClientMock, uploadMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  uploadMock: vi.fn()
}));

const ANON_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature";
const SECRET_KEY = "sb_secret_test_key";

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock
}));

describe("resolveStagingSupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment", () => {
  it("is not exported through the package root used by browser-facing imports", () => {
    const packageRootIndex = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

    expect(packageRootIndex).not.toContain("supabase-privileged-shared-beta-post-image-upload-broker");
  });

  it("requires a valid project URL and server-only privileged credential", () => {
    expect(
      resolveStagingSupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: ANON_KEY
      })
    ).toBeUndefined();

    expect(
      resolveStagingSupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: ANON_KEY
      })
    ).toBeUndefined();

    expect(
      resolveStagingSupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      privilegedKey: SERVICE_ROLE_KEY
    });

    expect(
      resolveStagingSupabasePrivilegedSharedBetaPostImageUploadBrokerEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: SECRET_KEY
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      privilegedKey: SECRET_KEY
    });
  });
});

describe("createSupabasePrivilegedSharedBetaPostImageUploadBroker", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    uploadMock.mockReset();
    createClientMock.mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          upload: uploadMock
        }))
      }
    });
  });

  it("uploads private post images with the privileged credential only inside broker storage", async () => {
    uploadMock.mockResolvedValue({
      data: { path: "group_first/user_demo/photo.webp" },
      error: null
    });
    const broker = createSupabasePrivilegedSharedBetaPostImageUploadBroker({
      projectUrl: "https://project.supabase.co",
      privilegedKey: SERVICE_ROLE_KEY
    });

    const result = await broker.uploadPostImage(makeBrokerInput());

    expect(createClientMock).toHaveBeenCalledWith("https://project.supabase.co", SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    expect(uploadMock).toHaveBeenCalledWith("group_first/user_demo/photo.webp", expect.any(ArrayBuffer), {
      contentType: "image/webp",
      upsert: false
    });
    expect(result).toEqual({
      ok: true,
      bucket: "post-images",
      objectPath: "group_first/user_demo/photo.webp"
    });
  });

  it("rejects public anon credentials in the privileged credential slot", () => {
    expect(() =>
      createSupabasePrivilegedSharedBetaPostImageUploadBroker({
        projectUrl: "https://project.supabase.co",
        privilegedKey: ANON_KEY
      })
    ).toThrow("server-only Supabase credentials");
  });

  it("still rejects identity mismatch before privileged storage upload", async () => {
    const broker = createSupabasePrivilegedSharedBetaPostImageUploadBroker({
      projectUrl: "https://project.supabase.co",
      privilegedKey: SERVICE_ROLE_KEY
    });

    const result = await broker.uploadPostImage(
      makeBrokerInput({ authContext: { authenticatedUserId: "user_other", accessToken: "member-token" } })
    );

    expect(result).toMatchObject({ ok: false });
    expect(uploadMock).not.toHaveBeenCalled();
  });
});

function makeBrokerInput(
  overrides: Partial<SharedBetaPostImageUploadBrokerInput> = {}
): SharedBetaPostImageUploadBrokerInput {
  return {
    authContext: { authenticatedUserId: "user_demo", accessToken: "member-token" },
    bucket: "post-images",
    groupId: "group_first",
    userId: "user_demo",
    objectPath: "group_first/user_demo/photo.webp",
    file: makeFile({ name: "photo.webp", type: "image/webp", size: 12 }),
    ...overrides
  };
}

function makeFile(input: { name: string; type: string; size: number }): SharedBetaPostImageFile {
  return {
    ...input,
    async arrayBuffer() {
      return new ArrayBuffer(input.size);
    }
  };
}
