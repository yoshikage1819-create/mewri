import type { MewriState } from "@mewri/core";
import { createDatabaseRepository, type DatabaseRepositoryConfig } from "./database-repository";
import { createMewriAppService, type MewriAppService } from "./mewri-app-service";
import { createMemoryRepository } from "./memory-repository";
import type { MewriRepository } from "./repository";

export type ServerRepositoryMode = "memory_demo" | "database";

export interface ServerRepositoryFactoryOptions {
  mode: ServerRepositoryMode;
  seedState?: MewriState;
  database?: DatabaseRepositoryConfig;
}

/**
 * Server-side repository selection seam.
 *
 * Today it supports only the in-process memory/demo path. Database mode is
 * explicit but intentionally unavailable until a real adapter exists.
 */
export function createServerRepository(options: ServerRepositoryFactoryOptions): MewriRepository {
  switch (options.mode) {
    case "memory_demo":
      return createMemoryRepository(options.seedState);
    case "database":
      return createDatabaseRepository({
        ...options.database,
        purpose: options.database?.purpose ?? "server_runtime"
      });
  }
}

export function createServerMewriAppService(options: ServerRepositoryFactoryOptions): MewriAppService {
  return createMewriAppService(createServerRepository(options));
}
