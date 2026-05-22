import type { MewriState } from "@mewri/core";
import type { MewriRepository } from "./repository";
import { createSeedState } from "./seed";
import { createStateRepository } from "./state-repository";

export function createMemoryRepository(seedState = createSeedState()): MewriRepository {
  let state = cloneState(seedState);

  return createStateRepository({
    load() {
      return cloneState(state);
    },
    save(nextState) {
      state = cloneState(nextState);
    },
    reset() {
      state = createSeedState();
      return cloneState(state);
    }
  });
}

function cloneState(state: MewriState): MewriState {
  return structuredClone(state);
}

