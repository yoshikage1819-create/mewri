import "server-only";
import { createSupabaseAuthSessionClient } from "@mewri/data/src/supabase-auth-session-client";
import {
  createSupabaseSharedBetaPostAuthorizationReadClient,
  createSupabaseSharedBetaPostAuthorizationSource
} from "@mewri/data/src/supabase-shared-beta-post-authorization-source";
import { createSupabaseSharedBetaPostRpcClient } from "@mewri/data/src/supabase-shared-beta-post-rpc-client";
import { createSupabasePrivilegedSharedBetaPostImageUploadBroker } from "@mewri/data/src/supabase-privileged-shared-beta-post-image-upload-broker";
import type { MewriRuntimeEnvironment } from "@mewri/data";
import type { SharedBetaPostRouteDependencies } from "./route-boundary";
import {
  createSharedBetaPostServerDependenciesFromEnvironment,
  resolveStagingSharedBetaPostRouteEnvironment
} from "./server-dependencies";

export function createLiveStagingSharedBetaPostServerDependenciesFromEnvironment(
  environment: MewriRuntimeEnvironment
): SharedBetaPostRouteDependencies {
  const routeEnvironment = resolveStagingSharedBetaPostRouteEnvironment(environment);

  if (!routeEnvironment) {
    return createSharedBetaPostServerDependenciesFromEnvironment(environment);
  }

  return createSharedBetaPostServerDependenciesFromEnvironment(environment, {
    authClient: {
      getUser(accessToken) {
        return createSupabaseAuthSessionClient(routeEnvironment).getUser(accessToken);
      }
    },
    authorizationSourceFactory({ accessToken }) {
      return createSupabaseSharedBetaPostAuthorizationSource(
        createSupabaseSharedBetaPostAuthorizationReadClient({
          ...routeEnvironment,
          accessToken
        })
      );
    },
    postGatewayClientFactory({ accessToken }) {
      return createSupabaseSharedBetaPostRpcClient({
        ...routeEnvironment,
        accessToken
      });
    },
    imageUploadBrokerFactory({ environment: uploadBrokerEnvironment }) {
      return createSupabasePrivilegedSharedBetaPostImageUploadBroker({
        projectUrl: uploadBrokerEnvironment.projectUrl,
        privilegedKey: uploadBrokerEnvironment.privilegedKey
      });
    }
  });
}
