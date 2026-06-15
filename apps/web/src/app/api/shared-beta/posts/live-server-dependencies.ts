import "server-only";
import { createSupabaseAuthSessionClient } from "@mewri/data/src/supabase-auth-session-client";
import {
  createSupabaseSharedBetaPostAuthorizationReadClient,
  createSupabaseSharedBetaPostAuthorizationSource
} from "@mewri/data/src/supabase-shared-beta-post-authorization-source";
import { createSupabaseSharedBetaPostRpcClient } from "@mewri/data/src/supabase-shared-beta-post-rpc-client";
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

  // A real C-7/C-8 server-side broker must be added before this route can upload live images.
  // Do not substitute member-JWT Storage insert here; that would weaken the refusal boundary.
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
    }
  });
}
