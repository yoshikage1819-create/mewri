import { resolveSharedBetaRuntimeDecision } from "@mewri/data";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRODUCT_BRAND,
  formatProductBrandTitle,
  resolveProductBrandForEnvironment,
  resolveProductBrandForRuntimeDecision,
  SHARED_BETA_EXPERIMENT_PRODUCT_BRAND
} from "./brand";

describe("product brand resolver", () => {
  it("resolves shared-beta configured mode to the 7bam experiment", () => {
    const brand = resolveProductBrandForRuntimeDecision({
      mode: "shared_beta_configured",
      config: {
        projectUrl: "https://project.supabase.co",
        serviceRoleKey: "server-only-secret",
        postImageBucket: "post-images"
      }
    });

    expect(brand.displayName).toBe("7bam");
    expect(brand.isExperimental).toBe(true);
    expect(brand.experimentLabel).toBe("試験名称");
  });

  it("includes the intended Japanese reading in the shared-beta accessible name", () => {
    expect(SHARED_BETA_EXPERIMENT_PRODUCT_BRAND.accessibleName).toContain("セブンバム");
  });

  it("keeps the default and local demo brand as Mewri", () => {
    expect(resolveProductBrandForEnvironment({})).toEqual(DEFAULT_PRODUCT_BRAND);
    expect(
      resolveProductBrandForEnvironment({
        MEWRI_RUNTIME_MODE: "browser_local_demo"
      })
    ).toEqual(DEFAULT_PRODUCT_BRAND);
  });

  it("falls back to Mewri for unknown or incomplete shared-beta configuration", () => {
    expect(
      resolveProductBrandForEnvironment({
        MEWRI_RUNTIME_MODE: "unknown"
      })
    ).toEqual(DEFAULT_PRODUCT_BRAND);

    expect(
      resolveProductBrandForEnvironment({
        MEWRI_RUNTIME_MODE: "shared_beta",
        SUPABASE_URL: "https://project.supabase.co"
      })
    ).toEqual(DEFAULT_PRODUCT_BRAND);
  });

  it("does not enable shared mode merely by resolving a display brand", () => {
    const environment = {
      MEWRI_RUNTIME_MODE: "shared_beta",
      SUPABASE_URL: "https://project.supabase.co"
    };

    expect(resolveProductBrandForEnvironment(environment)).toEqual(DEFAULT_PRODUCT_BRAND);
    expect(resolveSharedBetaRuntimeDecision(environment)).toMatchObject({
      mode: "browser_local_demo",
      reason: "shared_beta_configuration_incomplete"
    });
  });

  it("formats the experimental title without changing the permanent default title", () => {
    expect(formatProductBrandTitle(SHARED_BETA_EXPERIMENT_PRODUCT_BRAND)).toBe(
      "7bam beta | みんなの今日が、あとで一冊になる。"
    );
    expect(formatProductBrandTitle(DEFAULT_PRODUCT_BRAND)).toBe("Mewri | 今日のテーマからZINEへ");
  });
});
