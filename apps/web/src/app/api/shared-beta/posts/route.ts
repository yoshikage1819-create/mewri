import "server-only";
import { createSharedBetaPostRouteHandler } from "./route-boundary";
import { createSharedBetaPostServerDependenciesFromEnvironment } from "./server-dependencies";

export const POST = createSharedBetaPostRouteHandler(
  createSharedBetaPostServerDependenciesFromEnvironment(process.env)
);
