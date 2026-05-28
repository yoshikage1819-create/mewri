import type { MewriState } from "@mewri/core";
import { createServerMewriAppService } from "./server-repository-factory";
import type { MewriAppService } from "./mewri-app-service";

export const SHARED_BETA_RUNTIME_MODE = "shared_beta";
export const DEFAULT_POST_IMAGE_BUCKET = "post-images";

export type MewriRuntimeEnvironment = Record<string, string | undefined>;

export interface SharedBetaSupabaseConfig {
  projectUrl: string;
  serviceRoleKey: string;
  postImageBucket: string;
}

export type SharedBetaRuntimeDecision =
  | {
      mode: "browser_local_demo";
      reason: "default_local_demo" | "shared_beta_configuration_incomplete" | "shared_beta_post_image_bucket_mismatch";
      missingEnvironmentVariables: string[];
    }
  | {
      mode: "shared_beta_configured";
      config: SharedBetaSupabaseConfig;
    };

const REQUIRED_SERVER_ENVIRONMENT_VARIABLES = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

/**
 * Chooses the future server runtime mode without exposing secrets to browser code.
 * Browser-local demo behavior stays the default until shared mode is explicitly enabled.
 */
export function resolveSharedBetaRuntimeDecision(environment: MewriRuntimeEnvironment): SharedBetaRuntimeDecision {
  if (environment.MEWRI_RUNTIME_MODE !== SHARED_BETA_RUNTIME_MODE) {
    return {
      mode: "browser_local_demo",
      reason: "default_local_demo",
      missingEnvironmentVariables: []
    };
  }

  const configuredPostImageBucket = environment.SUPABASE_POST_IMAGE_BUCKET?.trim();
  if (configuredPostImageBucket && configuredPostImageBucket !== DEFAULT_POST_IMAGE_BUCKET) {
    return {
      mode: "browser_local_demo",
      reason: "shared_beta_post_image_bucket_mismatch",
      missingEnvironmentVariables: []
    };
  }

  const missingEnvironmentVariables = REQUIRED_SERVER_ENVIRONMENT_VARIABLES.filter(
    (name) => !environment[name]?.trim()
  );

  if (missingEnvironmentVariables.length > 0) {
    return {
      mode: "browser_local_demo",
      reason: "shared_beta_configuration_incomplete",
      missingEnvironmentVariables: [...missingEnvironmentVariables]
    };
  }

  return {
    mode: "shared_beta_configured",
    config: {
      projectUrl: environment.SUPABASE_URL!.trim(),
      serviceRoleKey: environment.SUPABASE_SERVICE_ROLE_KEY!.trim(),
      postImageBucket: DEFAULT_POST_IMAGE_BUCKET
    }
  };
}

/**
 * Future Next.js server actions or route handlers can use this selector.
 * Configured shared mode intentionally fails until the authenticated adapter exists.
 */
export function createServerMewriAppServiceFromEnvironment(
  environment: MewriRuntimeEnvironment,
  seedState?: MewriState
): MewriAppService {
  const decision = resolveSharedBetaRuntimeDecision(environment);

  if (decision.mode === "browser_local_demo") {
    return createServerMewriAppService({ mode: "memory_demo", seedState });
  }

  throw new Error(
    "Shared beta Supabase configuration is present, but authenticated server writes and the Supabase repository adapter are not implemented. Do not enable shared mode yet."
  );
}
