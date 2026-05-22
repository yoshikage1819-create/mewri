import type { MewriState } from "@mewri/core";
import { mewriStateFromDbRows, mewriStateToDbRows } from "./db-mappers";
import type { DbMewriRows } from "./db-row-types";
import type { MewriRepository } from "./repository";
import { createSeedState } from "./seed";
import { createStateRepository } from "./state-repository";

export interface DatabaseRepositoryConfig {
  connectionString?: string;
  schema?: string;
  purpose?: "server_runtime" | "contract_test" | "test_harness";
  seedState?: MewriState;
}

export interface TestDatabaseRepositoryHarness {
  repository: MewriRepository;
  readRows(): DbMewriRows;
}

/**
 * Placeholder boundary for a future database-backed repository adapter.
 *
 * This deliberately does not connect to anything in MVP v0.5. The future
 * implementation must satisfy the MewriRepository contract, return domain
 * models instead of raw rows, and enforce the documented transaction
 * boundaries for submit and publish commands.
 */
export function createDatabaseRepository(config: DatabaseRepositoryConfig = {}): MewriRepository {
  if (config.purpose === "contract_test" || config.purpose === "test_harness") {
    return createTestDatabaseRepositoryHarness(config.seedState).repository;
  }

  throw createDatabaseRepositoryNotImplementedError();
}

export function createDatabaseRepositoryNotImplementedError(): Error {
  return new Error(
    "Database-backed MewriRepository is not implemented yet. Add a real adapter, isolated test database setup, and transaction-safe write behavior before enabling database mode."
  );
}

export function createTestDatabaseRepositoryHarness(seedState = createSeedState()): TestDatabaseRepositoryHarness {
  const initialRows = cloneRows(mewriStateToDbRows(seedState));
  let rows = cloneRows(initialRows);

  return {
    repository: createStateRepository({
      load() {
        return mewriStateFromDbRows(cloneRows(rows));
      },
      save(state) {
        rows = cloneRows(mewriStateToDbRows(state));
      },
      reset() {
        rows = cloneRows(initialRows);
        return mewriStateFromDbRows(cloneRows(rows));
      }
    }),
    readRows() {
      return cloneRows(rows);
    }
  };
}

function cloneRows(rows: DbMewriRows): DbMewriRows {
  return structuredClone(rows);
}
