import { Command } from "effect/cli";
import { secretsListCommand } from "./list/list.command.ts";
import { secretsSetCommand } from "./set/set.command.ts";
import { secretsUnsetCommand } from "./unset/unset.command.ts";

export const secretsCommand = Command.make("secrets").pipe(
  Command.withDescription("Manage DBase secrets."),
  Command.withShortDescription("Manage DBase secrets"),
  Command.withSubcommands([secretsListCommand, secretsSetCommand, secretsUnsetCommand]),
);
