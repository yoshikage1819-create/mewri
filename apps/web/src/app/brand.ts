import {
  resolveSharedBetaRuntimeDecision,
  type MewriRuntimeEnvironment,
  type SharedBetaRuntimeDecision
} from "@mewri/data";

export type ProductBrand = {
  displayName: string;
  accessibleName: string;
  tagline: string;
  isExperimental: boolean;
  experimentLabel?: string;
};

export const DEFAULT_PRODUCT_BRAND: ProductBrand = {
  displayName: "Mewri",
  accessibleName: "Mewri",
  tagline: "今日のテーマからZINEへ",
  isExperimental: false
};

export const SHARED_BETA_EXPERIMENT_PRODUCT_BRAND: ProductBrand = {
  displayName: "7bam",
  accessibleName: "7bam（セブンバム）",
  tagline: "みんなの今日が、あとで一冊になる。",
  isExperimental: true,
  experimentLabel: "試験名称"
};

export function resolveProductBrandForRuntimeDecision(decision: SharedBetaRuntimeDecision): ProductBrand {
  if (decision.mode === "shared_beta_configured") {
    return SHARED_BETA_EXPERIMENT_PRODUCT_BRAND;
  }

  return DEFAULT_PRODUCT_BRAND;
}

export function resolveProductBrandForEnvironment(environment: MewriRuntimeEnvironment): ProductBrand {
  return resolveProductBrandForRuntimeDecision(resolveSharedBetaRuntimeDecision(environment));
}

export function formatProductBrandTitle(brand: ProductBrand): string {
  if (brand.isExperimental) {
    return `${brand.displayName} beta | ${brand.tagline}`;
  }

  return `${brand.displayName} | ${brand.tagline}`;
}
