import type { ID } from "@mewri/core";
import {
  createSharedBetaPostRouteBoundary,
  DEFAULT_POST_IMAGE_BUCKET,
  type MewriRuntimeEnvironment
} from "@mewri/data";
import type { SharedBetaPostAuthorizationSource } from "@mewri/data/src/shared-beta-post-authorization-source";
import {
  resolveAccessTokenFromRequest,
  resolveSupabaseAuthenticatedUserIdFromRequest,
  type SupabaseAuthSessionClient
} from "@mewri/data/src/supabase-auth-session";
import type { SharedBetaPostImageUploadBroker } from "@mewri/data/src/shared-beta-post-image-upload-broker";
import {
  toSharedBetaPostImageObjectPath,
  uploadSharedBetaPostImage,
  type SharedBetaPostImageFile
} from "@mewri/data/src/supabase-post-image-storage";
import {
  resolveStagingSupabaseSharedBetaPostRpcEnvironment,
  type SupabaseSharedBetaPostRpcEnvironment
} from "@mewri/data/src/supabase-shared-beta-post-rpc-client";
import {
  createSupabaseSharedBetaPostGateway,
  type SupabaseSharedBetaPostRpcClient
} from "@mewri/data/src/supabase-shared-beta-post-gateway";
import {
  defaultSharedBetaPostRouteDependencies,
  type SharedBetaPostRouteDependencies
} from "./route-boundary";

export const STAGING_SHARED_BETA_POST_ROUTE_GATE = "MEWRI_ENABLE_STAGING_SHARED_BETA_POST_ROUTE";
export const STAGING_SHARED_BETA_UPLOAD_BROKER_GATE = "MEWRI_ENABLE_STAGING_SHARED_BETA_UPLOAD_BROKER";
export const STAGING_SHARED_BETA_UPLOAD_BROKER_MODE = "SUPABASE_UPLOAD_BROKER_MODE";

export interface StagingSharedBetaPostRouteEnvironment extends SupabaseSharedBetaPostRpcEnvironment {
  postImageBucket: string;
}

export interface StagingSharedBetaUploadBrokerEnvironment extends StagingSharedBetaPostRouteEnvironment {
  uploadBrokerMode: "server";
}

export interface SharedBetaPostServerDependencyFactoryOptions {
  authClient?: SupabaseAuthSessionClient;
  imageUploadBroker?: SharedBetaPostImageUploadBroker;
  imageUploadBrokerFactory?: (input: {
    accessToken: string;
    environment: StagingSharedBetaUploadBrokerEnvironment;
  }) => SharedBetaPostImageUploadBroker;
  postGatewayClient?: SupabaseSharedBetaPostRpcClient;
  postGatewayClientFactory?: (input: { accessToken: string }) => SupabaseSharedBetaPostRpcClient;
  authorizationSource?: SharedBetaPostAuthorizationSource;
  authorizationSourceFactory?: (input: { accessToken: string }) => SharedBetaPostAuthorizationSource;
  resolveImageFile?: (input: {
    request: Request;
    authenticatedUserId: ID;
    post: {
      userId: ID;
      groupId: ID;
      themeId: ID;
      caption?: string;
      imageFile?: SharedBetaPostImageFile;
    };
  }) => Promise<SharedBetaPostImageFile | undefined>;
  generateImageFilename?: Parameters<typeof uploadSharedBetaPostImage>[0]["generateFilename"];
}

export function createSharedBetaPostServerDependenciesFromEnvironment(
  environment: MewriRuntimeEnvironment,
  options: SharedBetaPostServerDependencyFactoryOptions = {}
): SharedBetaPostRouteDependencies {
  const routeEnvironment = resolveStagingSharedBetaPostRouteEnvironment(environment);
  if (!routeEnvironment) {
    return defaultSharedBetaPostRouteDependencies;
  }

  const uploadBrokerEnvironment = resolveStagingSharedBetaUploadBrokerEnvironment(environment, routeEnvironment);
  if (!uploadBrokerEnvironment) {
    return defaultSharedBetaPostRouteDependencies;
  }

  if (
    !options.authClient ||
    (!options.authorizationSource && !options.authorizationSourceFactory) ||
    (!options.imageUploadBroker && !options.imageUploadBrokerFactory) ||
    (!options.postGatewayClient && !options.postGatewayClientFactory)
  ) {
    return defaultSharedBetaPostRouteDependencies;
  }

  const resolveImageFile = options.resolveImageFile ?? ((input) => Promise.resolve(input.post.imageFile));
  const postImageBucket = routeEnvironment.postImageBucket;
  const validatedImagePaths = new Set<string>();

  return {
    isRouteAvailable() {
      return true;
    },
    async resolveAuthenticatedUserId(request) {
      try {
        return await resolveSupabaseAuthenticatedUserIdFromRequest(request, options.authClient!);
      } catch {
        return undefined;
      }
    },
    async resolveValidatedImagePath(input) {
      const accessToken = resolveAccessTokenFromRequest(input.request);
      const authorizationSource = resolveAuthorizationSource(options, accessToken);
      if (!authorizationSource) {
        return undefined;
      }

      const authorization = await authorizationSource.canCreatePost({
        authenticatedUserId: input.authenticatedUserId,
        groupId: input.post.groupId,
        themeId: input.post.themeId
      });
      if (!authorization.ok) {
        return undefined;
      }

      const file = await resolveImageFile(input);
      const broker = resolveImageUploadBroker(options, accessToken, uploadBrokerEnvironment);
      if (!broker) {
        return undefined;
      }

      const upload = await uploadSharedBetaPostImage({
        broker,
        authContext: {
          authenticatedUserId: input.authenticatedUserId,
          accessToken
        },
        bucket: postImageBucket,
        groupId: input.post.groupId,
        userId: input.authenticatedUserId,
        file,
        generateFilename: options.generateImageFilename
      });

      if (!upload.ok) {
        return undefined;
      }

      validatedImagePaths.add(validatedImageKey(upload.imagePath, input.post.groupId, input.authenticatedUserId));
      return upload.imagePath;
    },
    resolveBoundary(input) {
      const accessToken = input ? resolveAccessTokenFromRequest(input.request) : undefined;
      const authorizationSource = resolveAuthorizationSource(options, accessToken);
      if (!authorizationSource) {
        return undefined;
      }

      const postGatewayClient = resolvePostGatewayClient(options, accessToken);
      if (!postGatewayClient) {
        return undefined;
      }

      const postGateway = createSupabaseSharedBetaPostGateway(postGatewayClient);
      return createSharedBetaPostRouteBoundary({
        authorizationSource,
        postCommandService: postGateway,
        authorization: {
          postImageBucket,
          isPostImageUploadValidated(input) {
            if (!validatedImagePaths.has(validatedImageKey(input.imagePath, input.groupId, input.userId))) {
              return false;
            }

            return (
              toSharedBetaPostImageObjectPath(input.imagePath, postImageBucket, input.groupId, input.userId) !==
              undefined
            );
          }
        }
      });
    }
  };
}

export function resolveStagingSharedBetaPostRouteEnvironment(
  environment: MewriRuntimeEnvironment
): StagingSharedBetaPostRouteEnvironment | undefined {
  if (environment[STAGING_SHARED_BETA_POST_ROUTE_GATE]?.trim().toLowerCase() !== "true") {
    return undefined;
  }

  const supabaseEnvironment = resolveStagingSupabaseSharedBetaPostRpcEnvironment(environment);
  if (!supabaseEnvironment) {
    return undefined;
  }

  const postImageBucket = environment.SUPABASE_POST_IMAGE_BUCKET?.trim() || DEFAULT_POST_IMAGE_BUCKET;
  if (postImageBucket !== DEFAULT_POST_IMAGE_BUCKET) {
    return undefined;
  }

  return {
    ...supabaseEnvironment,
    postImageBucket
  };
}

export function resolveStagingSharedBetaUploadBrokerEnvironment(
  environment: MewriRuntimeEnvironment,
  routeEnvironment = resolveStagingSharedBetaPostRouteEnvironment(environment)
): StagingSharedBetaUploadBrokerEnvironment | undefined {
  if (!routeEnvironment) {
    return undefined;
  }

  if (environment[STAGING_SHARED_BETA_UPLOAD_BROKER_GATE]?.trim().toLowerCase() !== "true") {
    return undefined;
  }

  if (environment[STAGING_SHARED_BETA_UPLOAD_BROKER_MODE]?.trim().toLowerCase() !== "server") {
    return undefined;
  }

  return {
    ...routeEnvironment,
    uploadBrokerMode: "server"
  };
}

function resolveAuthorizationSource(
  options: SharedBetaPostServerDependencyFactoryOptions,
  accessToken: string | undefined
): SharedBetaPostAuthorizationSource | undefined {
  if (options.authorizationSource) {
    return options.authorizationSource;
  }

  if (!accessToken) {
    return undefined;
  }

  return options.authorizationSourceFactory?.({ accessToken });
}

function resolveImageUploadBroker(
  options: SharedBetaPostServerDependencyFactoryOptions,
  accessToken: string | undefined,
  environment: StagingSharedBetaUploadBrokerEnvironment
): SharedBetaPostImageUploadBroker | undefined {
  if (options.imageUploadBroker) {
    return options.imageUploadBroker;
  }

  if (!accessToken) {
    return undefined;
  }

  return options.imageUploadBrokerFactory?.({ accessToken, environment });
}

function resolvePostGatewayClient(
  options: SharedBetaPostServerDependencyFactoryOptions,
  accessToken: string | undefined
): SupabaseSharedBetaPostRpcClient | undefined {
  if (options.postGatewayClient) {
    return options.postGatewayClient;
  }

  if (!accessToken) {
    return undefined;
  }

  return options.postGatewayClientFactory?.({ accessToken });
}

function validatedImageKey(imagePath: string, groupId: ID, userId: ID): string {
  return `${groupId}\n${userId}\n${imagePath}`;
}
