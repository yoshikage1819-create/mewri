import { createDatabaseRepositoryForTest } from "./database-repository-test-adapter";
import { describeMewriRepositoryContract } from "./repository-contract.test-helper";

// This suite runs only against the in-memory, database-shaped harness.
// It does not connect to any external service and does not enable real DB mode.
describeMewriRepositoryContract("database-harness", () => createDatabaseRepositoryForTest());
