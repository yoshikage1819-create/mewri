import { describe, expect, it } from "vitest";
import { createSeedState } from "./seed";
import {
  createServerMewriAppServiceFromEnvironment,
  DEFAULT_POST_IMAGE_BUCKET,
  resolveSharedBetaRuntimeDecision
} from "./shared-beta-runtime";

describe("shared beta runtime boundary", () => {
  it("keeps the local demo as the default without Supabase configuration", () => {
    expect(resolveSharedBetaRuntimeDecision({})).toEqual({
      mode: "browser_local_demo",
      reason: "default_local_demo",
      missingEnvironmentVariables: []
    });

    const service = createServerMewriAppServiceFromEnvironment(
      {},
      createSeedState(new Date("2026-05-20T09:00:00.000Z"))
    );
    expect(service.load().groups[0]).toMatchObject({ id: "group_first" });
  });

  it("falls back to local mode when shared beta is requested without server credentials", () => {
    expect(
      resolveSharedBetaRuntimeDecision({
        MEWRI_RUNTIME_MODE: "shared_beta",
        SUPABASE_URL: "https://project.supabase.co"
      })
    ).toEqual({
      mode: "browser_local_demo",
      reason: "shared_beta_configuration_incomplete",
      missingEnvironmentVariables: ["SUPABASE_SERVICE_ROLE_KEY"]
    });
  });

  it("recognizes complete server-only Supabase configuration", () => {
    expect(
      resolveSharedBetaRuntimeDecision({
        MEWRI_RUNTIME_MODE: "shared_beta",
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "server-secret"
      })
    ).toEqual({
      mode: "shared_beta_configured",
      config: {
        projectUrl: "https://project.supabase.co",
        serviceRoleKey: "server-secret",
        postImageBucket: DEFAULT_POST_IMAGE_BUCKET
      }
    });
  });

  it("fails closed to local mode when shared beta requests a non-contract image bucket", () => {
    expect(
      resolveSharedBetaRuntimeDecision({
        MEWRI_RUNTIME_MODE: "shared_beta",
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "server-secret",
        SUPABASE_POST_IMAGE_BUCKET: "beta-post-images"
      })
    ).toEqual({
      mode: "browser_local_demo",
      reason: "shared_beta_post_image_bucket_mismatch",
      missingEnvironmentVariables: []
    });
  });

  it("refuses to run configured shared mode before authenticated server writes exist", () => {
    expect(() =>
      createServerMewriAppServiceFromEnvironment({
        MEWRI_RUNTIME_MODE: "shared_beta",
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "server-secret",
        SUPABASE_POST_IMAGE_BUCKET: "post-images"
      })
    ).toThrowError("authenticated server writes and the Supabase repository adapter are not implemented");
  });
});
