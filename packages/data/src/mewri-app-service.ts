import type { ID, MewriState } from "@mewri/core";
import { createBrowserLocalRepository } from "./browser-local-repository";
import { publishZineForCycle, type GenerateZineInput, type SubmitPostInput, submitPost } from "./mewri-service";
import type { MewriRepository } from "./repository";

export interface MewriCommandContext {
  currentUserId?: ID;
  requestSource?: "browser_demo" | "server_action" | "api_route";
}

export interface SubmitPostCommand {
  context?: MewriCommandContext;
  input: SubmitPostInput;
}

export interface PublishZineForCycleCommand {
  context?: MewriCommandContext;
  input: GenerateZineInput;
}

export interface MewriDemoControls {
  reset(): MewriState;
  replaceState(state: MewriState): MewriState;
}

export interface MewriWriteCommands {
  submitPost(command: SubmitPostCommand): MewriState;
  publishZineForCycle(command: PublishZineForCycleCommand): MewriState;
}

export interface MewriAppService {
  load(): MewriState;
  demo: MewriDemoControls;
  commands: MewriWriteCommands;
}

/**
 * Small application-service boundary for write paths that can later move
 * behind a Next.js server action or API route without changing product logic.
 */
export function createMewriAppService(repository: MewriRepository): MewriAppService {
  return {
    load() {
      return repository.load();
    },
    demo: {
      reset() {
        return repository.reset();
      },
      replaceState(state) {
        repository.save(state);
        return repository.load();
      }
    },
    commands: {
      submitPost(command) {
        return submitPost(repository, command.input);
      },
      publishZineForCycle(command) {
        return publishZineForCycle(repository, command.input);
      }
    }
  };
}

export function createBrowserLocalMewriAppService(): MewriAppService {
  return createMewriAppService(createBrowserLocalRepository());
}
