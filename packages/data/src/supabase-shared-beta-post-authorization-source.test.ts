import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabaseSharedBetaPostAuthorizationReadClient,
  createSupabaseSharedBetaPostAuthorizationSource,
  type SupabaseSharedBetaPostAuthorizationGroupMemberRow,
  type SupabaseSharedBetaPostAuthorizationReadClient,
  type SupabaseSharedBetaPostAuthorizationThemeRow
} from "./supabase-shared-beta-post-authorization-source";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn()
}));

const ANON_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature";
const SECRET_KEY = "sb_secret_test_key";

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock
}));

const INPUT = {
  authenticatedUserId: "user_demo",
  groupId: "group_first",
  themeId: "theme_first_active"
};

describe("supabase shared beta post authorization source", () => {
  it("allows an authenticated member to post to an active theme in the same group", async () => {
    const client = makeClient();
    const source = createSupabaseSharedBetaPostAuthorizationSource(client);

    await expect(source.canCreatePost(INPUT)).resolves.toEqual({ ok: true });
    expect(client.selectGroupMembership).toHaveBeenCalledWith({
      groupId: "group_first",
      userId: "user_demo"
    });
    expect(client.selectTheme).toHaveBeenCalledWith({
      groupId: "group_first",
      themeId: "theme_first_active"
    });
  });

  it("denies non-members before checking the theme", async () => {
    const client = makeClient({
      membershipRows: []
    });
    const source = createSupabaseSharedBetaPostAuthorizationSource(client);

    await expect(source.canCreatePost(INPUT)).resolves.toMatchObject({
      ok: false,
      code: "group_membership_required"
    });
    expect(client.selectTheme).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "missing theme",
      themeRows: []
    },
    {
      name: "other-group theme",
      themeRows: [makeThemeRow({ group_id: "group_other" })]
    },
    {
      name: "inactive theme",
      themeRows: [makeThemeRow({ status: "closed" })]
    }
  ])("denies $name", async ({ themeRows }) => {
    const source = createSupabaseSharedBetaPostAuthorizationSource(makeClient({ themeRows }));

    await expect(source.canCreatePost(INPUT)).resolves.toMatchObject({
      ok: false,
      code: "active_group_theme_required"
    });
  });

  it.each([
    {
      name: "membership read error",
      client: makeClient({ membershipError: new Error("membership read failed") }),
      expectedCode: "group_membership_required"
    },
    {
      name: "theme read error",
      client: makeClient({ themeError: new Error("theme read failed") }),
      expectedCode: "active_group_theme_required"
    },
    {
      name: "thrown membership read",
      client: makeClient({ throwMembership: true }),
      expectedCode: "group_membership_required"
    },
    {
      name: "thrown theme read",
      client: makeClient({ throwTheme: true }),
      expectedCode: "active_group_theme_required"
    }
  ])("fails closed on $name", async ({ client, expectedCode }) => {
    const source = createSupabaseSharedBetaPostAuthorizationSource(client);

    await expect(source.canCreatePost(INPUT)).resolves.toMatchObject({
      ok: false,
      code: expectedCode
    });
  });

  it.each([
    {
      name: "zero membership rows",
      membershipRows: []
    },
    {
      name: "multiple membership rows",
      membershipRows: [makeMembershipRow(), makeMembershipRow({ user_id: "user_duplicate" })]
    },
    {
      name: "malformed membership row",
      membershipRows: [makeMembershipRow({ user_id: null })]
    },
    {
      name: "mismatched membership row",
      membershipRows: [makeMembershipRow({ group_id: "group_other" })]
    }
  ])("fails closed on $name", async ({ membershipRows }) => {
    const source = createSupabaseSharedBetaPostAuthorizationSource(makeClient({ membershipRows }));

    await expect(source.canCreatePost(INPUT)).resolves.toMatchObject({
      ok: false,
      code: "group_membership_required"
    });
  });

  it.each([
    {
      name: "zero theme rows",
      themeRows: []
    },
    {
      name: "multiple theme rows",
      themeRows: [makeThemeRow(), makeThemeRow({ id: "theme_duplicate" })]
    },
    {
      name: "malformed theme row",
      themeRows: [makeThemeRow({ status: null })]
    },
    {
      name: "mismatched theme row",
      themeRows: [makeThemeRow({ id: "theme_other" })]
    }
  ])("fails closed on $name", async ({ themeRows }) => {
    const source = createSupabaseSharedBetaPostAuthorizationSource(makeClient({ themeRows }));

    await expect(source.canCreatePost(INPUT)).resolves.toMatchObject({
      ok: false,
      code: "active_group_theme_required"
    });
  });

  it("does not expose raw rows, table clients, or MewriState through the source or result", async () => {
    const client = makeClient();
    const source = createSupabaseSharedBetaPostAuthorizationSource(client);
    const result = await source.canCreatePost(INPUT);

    expect(Object.keys(source)).toEqual(["canCreatePost"]);
    expect(Object.keys(client).sort()).toEqual(["selectGroupMembership", "selectTheme"]);
    expect(result).toEqual({ ok: true });
    expect(result).not.toHaveProperty("state");
    expect(result).not.toHaveProperty("group_members");
    expect(result).not.toHaveProperty("themes");
    expect(result).not.toHaveProperty("from");
  });
});

describe("supabase shared beta post authorization read client", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("reads membership and active theme through narrow table queries", async () => {
    const fromMock = vi.fn((table: string) => makeSupabaseTable(table));
    createClientMock.mockReturnValue({ from: fromMock });
    const client = createSupabaseSharedBetaPostAuthorizationReadClient({
      projectUrl: "https://project.supabase.co",
      anonKey: ANON_KEY,
      accessToken: "member-access-token"
    });

    await expect(
      client.selectGroupMembership({ groupId: "group_first", userId: "user_demo" })
    ).resolves.toEqual({
      data: [makeMembershipRow()],
      error: null
    });
    await expect(client.selectTheme({ groupId: "group_first", themeId: "theme_first_active" })).resolves.toEqual({
      data: [makeThemeRow()],
      error: null
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
    expect(fromMock).toHaveBeenCalledWith("group_members");
    expect(fromMock).toHaveBeenCalledWith("themes");
  });

  it("rejects invalid public config and service-role-looking member tokens", () => {
    expect(() =>
      createSupabaseSharedBetaPostAuthorizationReadClient({
        projectUrl: "http://project.supabase.co",
        anonKey: ANON_KEY,
        accessToken: "member-access-token"
      })
    ).toThrow("valid https://<ref>.supabase.co project URL");

    expect(() =>
      createSupabaseSharedBetaPostAuthorizationReadClient({
        projectUrl: "https://project.supabase.co",
        anonKey: SERVICE_ROLE_KEY,
        accessToken: "member-access-token"
      })
    ).toThrow("public anon or publishable key");

    expect(() =>
      createSupabaseSharedBetaPostAuthorizationReadClient({
        projectUrl: "https://project.supabase.co",
        anonKey: SECRET_KEY,
        accessToken: "member-access-token"
      })
    ).toThrow("public anon or publishable key");

    expect(() =>
      createSupabaseSharedBetaPostAuthorizationReadClient({
        projectUrl: "https://project.supabase.co",
        anonKey: ANON_KEY,
        accessToken: "service_role_token"
      })
    ).toThrow("service role");
  });

  it("is not exported through the package root used by browser-facing imports", () => {
    const packageRootIndex = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

    expect(packageRootIndex).not.toContain("supabase-shared-beta-post-authorization-source");
    expect(packageRootIndex).not.toContain("createSupabaseSharedBetaPostAuthorizationReadClient");
  });
});

function makeClient(
  options: {
    membershipRows?: SupabaseSharedBetaPostAuthorizationGroupMemberRow[];
    membershipError?: unknown;
    themeRows?: SupabaseSharedBetaPostAuthorizationThemeRow[];
    themeError?: unknown;
    throwMembership?: boolean;
    throwTheme?: boolean;
  } = {}
): SupabaseSharedBetaPostAuthorizationReadClient {
  return {
    selectGroupMembership: vi.fn(async () => {
      if (options.throwMembership) {
        throw new Error("membership read failed");
      }

      return {
        data: options.membershipRows ?? [makeMembershipRow()],
        error: options.membershipError ?? null
      };
    }),
    selectTheme: vi.fn(async () => {
      if (options.throwTheme) {
        throw new Error("theme read failed");
      }

      return {
        data: options.themeRows ?? [makeThemeRow()],
        error: options.themeError ?? null
      };
    })
  };
}

function makeSupabaseTable(table: string) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    limit: vi.fn(async () => {
      if (table === "group_members") {
        return { data: [makeMembershipRow()], error: null };
      }

      if (table === "themes") {
        return { data: [makeThemeRow()], error: null };
      }

      return { data: [], error: new Error(`Unexpected table: ${table}`) };
    })
  };
  return query;
}

function makeMembershipRow(
  overrides: Partial<SupabaseSharedBetaPostAuthorizationGroupMemberRow> = {}
): SupabaseSharedBetaPostAuthorizationGroupMemberRow {
  return {
    group_id: "group_first",
    user_id: "user_demo",
    ...overrides
  };
}

function makeThemeRow(
  overrides: Partial<SupabaseSharedBetaPostAuthorizationThemeRow> = {}
): SupabaseSharedBetaPostAuthorizationThemeRow {
  return {
    id: "theme_first_active",
    group_id: "group_first",
    status: "active",
    ...overrides
  };
}
