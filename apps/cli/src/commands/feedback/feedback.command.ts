import { Command } from "effect/cli";
import { feedbackAddCommand } from "./add/add.command.ts";
import { feedbackDeleteCommand } from "./delete/delete.command.ts";

export const feedbackCommand = Command.make("feedback").pipe(
  Command.withDescription("Send feedback about the DBase CLI to the DBase team."),
  Command.withShortDescription("Send feedback to the DBase team"),
  Command.withSubcommands([feedbackAddCommand, feedbackDeleteCommand]),
);
