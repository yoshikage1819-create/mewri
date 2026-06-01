import type { ID } from "@mewri/core";
import {
  createSharedBetaPostRouteBoundary,
  DEFAULT_POST_IMAGE_BUCKET,
  resolveSharedBetaRuntimeDecision,
  type MewriRepository,
  type MewriRuntimeEnvironment
} from "@mewri/data";
import {
  resolveAccessTokenFromRequest,
  resolveSupabaseAuthenticatedUserIdFromRequest,
  type SupabaseAuthSessionClient
} from "@mewri/data/src/supabase-auth-session";
import {
  toSharedBetaPostImageObjectPath,
  uploadSharedBetaPostImage,
  type SharedBetaPostImageFile,
  type SharedBetaPostImageStorageClient
} from "@mewri/data/src/supabase-post-image-storage";
import {
  createSupabaseSharedBetaPostGateway,
  type SupabaseSharedBetaPostRpcClient
} from "@mewri/data/src/supabase-shared-beta-post-gateway";
import {
  defaultSharedBetaPostRouteDependencies,
  type SharedBetaPostRouteDependencies
} from "./route-boundary";

export interface SharedBetaPostServerDependencyFactoryOptions {
  authClient?: SupabaseAuthSessionClient;
  imageStorageClient?: SharedBetaPostImageStorageClient;
  imageStorageClientFactory?: (input: { accessToken: string }) => SharedBetaPostImageStorageClient;
  postGatewayClient?: SupabaseSharedBetaPostRpcClient;
  postGatewayClientFactory?: (input: { accessToken: string }) => SupabaseSharedBetaPostRpcClient;
  repository?: MewriRepository;
  resolveImageFile?: (input: {
    request: Request;
    authenticatedUserId: ID;
    post: {
      userId: ID;
      groupId: ID;
      themeId: ID;
      caption?: string;
    };
  }) => Promise<SharedBetaPostImageFile | undefined>;
  generateImageFilename?: Parameters<typeof uploadSharedBetaPostImage>[0]["generateFilename"];
}

export function createSharedBetaPostServerDependenciesFromEnvironment(
  environment: MewriRuntimeEnvironment,
  options: SharedBetaPostServerDependencyFactoryOptions = {}
): SharedBetaPostRouteDependencies {
  const decision = resolveSharedBetaRuntimeDecision(environment);
  if (decision.mode !== "shared_beta_configured") {
    return defaultSharedBetaPostRouteDependencies;
  }

  if (
    !options.authClient ||
    (!options.imageStorageClient && !options.imageStorageClientFactory) ||
    (!options.postGatewayClient && !options.postGatewayClientFactory) ||
    !options.repository ||
    !options.resolveImageFile
  ) {
    return defaultSharedBetaPostRouteDependencies;
  }

  const postImageBucket = decision.config.postImageBucket || DEFAULT_POST_IMAGE_BUCKET;
  const validatedImagePaths = new Set<string>();

  return {
    isRouteAvailable() {
      return true;
    },
    async resolveAuthenticatedUserId(request) {
      return resolveSupabaseAuthenticatedUserIdFromRequest(request, options.authClient!);
    },
    async resolveValidatedImagePath(input) {
      if (!isUploadAuthorized(options.repository!, input.authenticatedUserId, input.post)) {
        return undefined;
      }

      const file = await options.resolveImageFile!(input);
      const accessToken = resolveAccessTokenFromRequest(input.request);
      const storage = resolveImageStorageClient(options, accessToken);
      if (!storage) {
        return undefined;
      }

      const upload = await uploadSharedBetaPostImage({
        storage,
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
      const postGatewayClient = resolvePostGatewayClient(options, accessToken);
      if (!postGatewayClient) {
        return undefined;
      }

      const postGateway = createSupabaseSharedBetaPostGateway(postGatewayClient);
      return createSharedBetaPostRouteBoundary({
        repository: options.repository!,
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

function resolveImageStorageClient(
  options: SharedBetaPostServerDependencyFactoryOptions,
  accessToken: string | undefined
): SharedBetaPostImageStorageClient | undefined {
  if (options.imageStorageClient) {
    return options.imageStorageClient;
  }

  return accessToken ? options.imageStorageClientFactory?.({ accessToken }) : undefined;
}

function resolvePostGatewayClient(
  options: SharedBetaPostServerDependencyFactoryOptions,
  accessToken: string | undefined
): SupabaseSharedBetaPostRpcClient | undefined {
  if (options.postGatewayClient) {
    return options.postGatewayClient;
  }

  return accessToken ? options.postGatewayClientFactory?.({ accessToken }) : undefined;
}

function validatedImageKey(imagePath: string, groupId: ID, userId: ID): string {
  return `${groupId}\n${userId}\n${imagePath}`;
}

function isUploadAuthorized(
  repository: MewriRepository,
  authenticatedUserId: ID,
  post: {
    groupId: ID;
    themeId: ID;
  }
): boolean {
  const isMember = repository.groupMembers
    .listByGroupId(post.groupId)
    .some((member) => member.userId === authenticatedUserId);
  if (!isMember) {
    return false;
  }

  const theme = repository.themes.getById(post.themeId);
  return Boolean(theme && theme.groupId === post.groupId && theme.status === "active");
}
