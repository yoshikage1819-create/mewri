import type { MewriState } from "@mewri/core";
import type { MewriRepository } from "./repository";
import { createSeedState } from "./seed";
import { createStateRepository } from "./state-repository";

const STORAGE_KEY = "mewri.mvp.v0.state";

export function createBrowserLocalRepository(): MewriRepository {
  let memoryState: MewriState | undefined;

  const readStoredState = () => {
    if (typeof window === "undefined") return undefined;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return undefined;
      return JSON.parse(raw) as MewriState;
    } catch {
      return undefined;
    }
  };

  const writeStoredState = (state: MewriState) => {
    memoryState = state;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Mobile private browsing can reject localStorage; keep the MVP usable in memory.
    }
  };

  return createStateRepository({
    load() {
      const stored = readStoredState();
      if (stored) {
        memoryState = stored;
        return stored;
      }
      if (!memoryState) {
        const seed = createSeedState();
        writeStoredState(seed);
        memoryState = seed;
      }
      return memoryState;
    },
    save(state: MewriState) {
      writeStoredState(state);
    },
    reset() {
      const seed = createSeedState();
      writeStoredState(seed);
      return seed;
    }
  });
}

