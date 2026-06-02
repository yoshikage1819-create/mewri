import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync("supabase/migrations/202605290001_shared_beta_create_post_rpc.sql", "utf8");

describe("shared beta post RPC migration contract", () => {
  it("exposes only the public RPC entrypoint to authenticated users", () => {
    expect(migrationSql).toContain(
      "grant execute on function public.create_shared_beta_post(uuid, text, text, text, text) to authenticated"
    );
    expect(migrationSql).not.toContain(
      "grant execute on function private.create_shared_beta_post(uuid, text, text, text, text) to authenticated"
    );
  });

  it("keeps anon and public grants revoked for both RPC functions", () => {
    expect(migrationSql).toContain(
      "revoke all on function private.create_shared_beta_post(uuid, text, text, text, text) from public"
    );
    expect(migrationSql).toContain(
      "revoke all on function public.create_shared_beta_post(uuid, text, text, text, text) from public"
    );
    expect(migrationSql).toContain(
      "revoke all on function private.create_shared_beta_post(uuid, text, text, text, text) from anon"
    );
    expect(migrationSql).toContain(
      "revoke all on function public.create_shared_beta_post(uuid, text, text, text, text) from anon"
    );
  });

  it("uses a security definer public wrapper for the private implementation", () => {
    const publicWrapper = migrationSql.match(
      /create or replace function public\.create_shared_beta_post[\s\S]*?\$\$;/
    )?.[0];

    expect(publicWrapper).toBeDefined();
    expect(publicWrapper).toContain("security definer");
    expect(publicWrapper).toContain("set search_path = ''");
    expect(publicWrapper).toContain("from private.create_shared_beta_post");
  });
});
