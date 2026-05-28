import type { ID } from "@mewri/core";
import {
  createSharedBetaPostRouteBoundary,
  DEFAULT_POST_IMAGE_BUCKET,
  resolveSharedBetaRuntimeDecision,
  type MewriRepository,
  type MewriRuntimeEnvironment
} from "@mewri/data";
import {
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
  postGatewayClient?: SupabaseSharedBetaPostRpcClient;
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
    !options.imageStorageClient ||
    !options.postGatewayClient ||
    !options.repository ||
    !options.resolveImageFile
  ) {
    return defaultSharedBetaPostRouteDependencies;
  }

  const postImageBucket = decision.config.postImageBucket || DEFAULT_POST_IMAGE_BUCKET;
  const validatedImagePaths = new Set<string>();
  const postGateway = createSupabaseSharedBetaPostGateway(options.postGatewayClient);

  return {
    async resolveAuthenticatedUserId(request) {
      return resolveSupabaseAuthenticatedUserIdFromRequest(request, options.authClient!);
    },
    async resolveValidatedImagePath(input) {
      if (!isUploadAuthorized(options.repository!, input.authenticatedUserId, input.post)) {
        return undefined;
      }

      const file = await options.resolveImageFile!(input);
      const upload = await uploadSharedBetaPostImage({
        storage: options.imageStorageClient!,
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
    resolveBoundary() {
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
