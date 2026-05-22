import type { ID, MewriState } from "@mewri/core";
import type {
  MewriAppService,
  MewriCommandContext,
  PublishZineForCycleCommand,
  SubmitPostCommand
} from "./mewri-app-service";

export interface MewriRequestCallerInput {
  authenticatedUserId?: ID;
  requestSource: "server_action" | "api_route";
}

export interface SubmitPostRequestCommand {
  request: MewriRequestCallerInput;
  input: SubmitPostCommand["input"];
}

export interface PublishZineForCycleRequestCommand {
  request: MewriRequestCallerInput;
  input: PublishZineForCycleCommand["input"];
}

/**
 * Pure caller layer for future server actions or API routes.
 *
 * This module derives command context from request-like input and delegates to
 * the existing application-service command boundary. It does not perform auth,
 * membership validation, or any database work yet.
 */
export function createMewriCommandCaller(appService: Pick<MewriAppService, "commands">) {
  return {
    buildCommandContext(request: MewriRequestCallerInput): MewriCommandContext {
      return {
        currentUserId: request.authenticatedUserId,
        requestSource: request.requestSource
      };
    },
    submitPost(command: SubmitPostRequestCommand): MewriState {
      return appService.commands.submitPost({
        context: this.buildCommandContext(command.request),
        input: command.input
      });
    },
    publishZineForCycle(command: PublishZineForCycleRequestCommand): MewriState {
      return appService.commands.publishZineForCycle({
        context: this.buildCommandContext(command.request),
        input: command.input
      });
    }
  };
}
