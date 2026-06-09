import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createSupabaseSharedBetaPostImageStorageClient,
  resolveSharedBetaSupabasePostImageStorageEnvironment,
  resolveStagingSupabaseSharedBetaPostImageStorageEnvironment
} from "./supabase-shared-beta-post-image-storage-client";

const { createClientMock, uploadMock, listMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  uploadMock: vi.fn(),
  listMock: vi.fn()
}));

const ANON_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature";
const PUBLISHABLE_KEY = "sb_publishable_test_key";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature";
const SECRET_KEY = "sb_secret_test_key";

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock
}));

describe("resolveStagingSupabaseSharedBetaPostImageStorageEnvironment", () => {
  it("reuses staging public env resolution", () => {
    expect(
      resolveStagingSupabaseSharedBetaPostImageStorageEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: ANON_KEY
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY
    });
  });

  it("accepts Supabase publishable keys", () => {
    expect(
      resolveStagingSupabaseSharedBetaPostImageStorageEnvironment({
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_ANON_KEY: PUBLISHABLE_KEY
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: PUBLISHABLE_KEY
    });
  });
});

describe("resolveSharedBetaSupabasePostImageStorageEnvironment", () => {
  it("requires shared_beta mode", () => {
    expect(
      resolveSharedBetaSupabasePostImageStorageEnvironment({
        MEWRI_RUNTIME_MODE: "shared_beta",
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-secret",
        SUPABASE_ANON_KEY: ANON_KEY
      })
    ).toEqual({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY
    });
  });
});

describe("createSupabaseSharedBetaPostImageStorageClient", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    uploadMock.mockReset();
    listMock.mockReset();
    createClientMock.mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          upload: uploadMock,
          list: listMock
        }))
      }
    });
  });

  it("uploads to the private group/user object path with the member JWT", async () => {
    uploadMock.mockResolvedValue({
      data: {
        path: "group_staging_a/00000000-0000-0000-0000-000000000001/photo.webp"
      },
      error: null
    });
    const body = new ArrayBuffer(8);

    const storage = createSupabaseSharedBetaPostImageStorageClient({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY,
      accessToken: "member-access-token"
    });

    const result = await storage.uploadObject({
      bucket: "post-images",
      objectPath: "group_staging_a/00000000-0000-0000-0000-000000000001/photo.webp",
      body,
      contentType: "image/webp"
    });

    expect(createClientMock).toHaveBeenCalledWith("https://project.supabase.co", ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          Authorization: "Bearer member-access-token"
        }
      }
    });
    expect(uploadMock).toHaveBeenCalledWith(
      "group_staging_a/00000000-0000-0000-0000-000000000001/photo.webp",
      body,
      {
        contentType: "image/webp",
        upsert: false
      }
    );
    expect(result).toEqual({
      ok: true,
      bucket: "post-images",
      objectPath: "group_staging_a/00000000-0000-0000-0000-000000000001/photo.webp"
    });
  });

  it("returns upload failure without throwing", async () => {
    uploadMock.mockResolvedValue({ error: new Error("new row violates row-level security policy") });

    const storage = createSupabaseSharedBetaPostImageStorageClient({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY,
      accessToken: "member-access-token"
    });

    const result = await storage.uploadObject({
      bucket: "post-images",
      objectPath: "group_staging_a/00000000-0000-0000-0000-000000000001/photo.webp",
      body: new ArrayBuffer(4),
      contentType: "image/png"
    });

    expect(result).toEqual({ ok: false, error: expect.any(Error) });
  });

  it("fails closed when Supabase does not confirm the uploaded object path", async () => {
    uploadMock.mockResolvedValue({
      data: {
        path: "group_staging_a/00000000-0000-0000-0000-000000000001/other.webp"
      },
      error: null
    });

    const storage = createSupabaseSharedBetaPostImageStorageClient({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY,
      accessToken: "member-access-token"
    });

    const result = await storage.uploadObject({
      bucket: "post-images",
      objectPath: "group_staging_a/00000000-0000-0000-0000-000000000001/photo.webp",
      body: new ArrayBuffer(4),
      contentType: "image/webp"
    });

    expect(result).toEqual({ ok: false, error: expect.any(Error) });

    uploadMock.mockResolvedValue({ data: null, error: null });
    await expect(
      storage.uploadObject({
        bucket: "post-images",
        objectPath: "group_staging_a/00000000-0000-0000-0000-000000000001/photo.webp",
        body: new ArrayBuffer(4),
        contentType: "image/webp"
      })
    ).resolves.toEqual({ ok: false, error: expect.any(Error) });
  });

  it("checks object existence via storage list in the object folder", async () => {
    listMock.mockResolvedValue({
      data: [{ name: "read-check.webp" }, { name: "other.webp" }],
      error: null
    });

    const storage = createSupabaseSharedBetaPostImageStorageClient({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY,
      accessToken: "member-access-token"
    });

    await expect(
      storage.objectExists?.({
        bucket: "post-images",
        objectPath: "group_staging_a/00000000-0000-0000-0000-000000000001/read-check.webp"
      })
    ).resolves.toBe(true);

    expect(listMock).toHaveBeenCalledWith("group_staging_a/00000000-0000-0000-0000-000000000001", {
      limit: 100,
      search: "read-check.webp"
    });
  });

  it("returns false when list fails or the filename is missing", async () => {
    listMock.mockResolvedValue({ data: [{ name: "other.webp" }], error: null });

    const storage = createSupabaseSharedBetaPostImageStorageClient({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY,
      accessToken: "member-access-token"
    });

    await expect(
      storage.objectExists?.({
        bucket: "post-images",
        objectPath: "group_staging_a/00000000-0000-0000-0000-000000000001/read-check.webp"
      })
    ).resolves.toBe(false);

    listMock.mockResolvedValue({ data: null, error: new Error("denied") });
    await expect(
      storage.objectExists?.({
        bucket: "post-images",
        objectPath: "group_staging_a/00000000-0000-0000-0000-000000000001/read-check.webp"
      })
    ).resolves.toBe(false);
  });

  it("rejects service role style access tokens", () => {
    expect(() =>
      createSupabaseSharedBetaPostImageStorageClient({
        projectUrl: "https://project.supabase.co",
        anonKey: ANON_KEY,
        accessToken: "eyJservice_role_payload"
      })
    ).toThrow("service role");
  });

  it("rejects service role keys in the anon key slot", () => {
    expect(() =>
      createSupabaseSharedBetaPostImageStorageClient({
        projectUrl: "https://project.supabase.co",
        anonKey: SERVICE_ROLE_KEY,
        accessToken: "member-access-token"
      })
    ).toThrow("public anon or publishable key");

    expect(() =>
      createSupabaseSharedBetaPostImageStorageClient({
        projectUrl: "https://project.supabase.co",
        anonKey: SECRET_KEY,
        accessToken: "member-access-token"
      })
    ).toThrow("public anon or publishable key");
  });
});
