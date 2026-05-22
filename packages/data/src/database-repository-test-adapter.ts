import type { MewriRepository } from "./repository";
import { createDatabaseRepository } from "./database-repository";
import { createSeedState } from "./seed";

/**
 * Future test seam for a database-backed repository adapter.
 *
 * This is intentionally not implemented in MVP v0.5 because the project does
 * not yet have an isolated Postgres/Supabase test database, database
 * dependency, or server-side write boundary.
 */
export function createDatabaseRepositoryForTest(): MewriRepository {
  return createDatabaseRepository({
    purpose: "contract_test",
    seedState: createSeedState(new Date("2026-05-20T09:00:00.000Z"))
  });
}
