import "server-only";
import { createSharedBetaPostRouteHandler } from "./route-boundary";
import { createLiveStagingSharedBetaPostServerDependenciesFromEnvironment } from "./live-server-dependencies";

export const POST = createSharedBetaPostRouteHandler(
  createLiveStagingSharedBetaPostServerDependenciesFromEnvironment(process.env)
);
