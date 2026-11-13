import { Command } from "effect/cli";
import { backupsListCommand } from "./list/list.command.ts";
import { backupsRestoreCommand } from "./restore/restore.command.ts";

export const backupsCommand = Command.make("backups").pipe(
  Command.withDescription("Manage DBase physical backups."),
  Command.withShortDescription("Manage DBase physical backups"),
  Command.withSubcommands([backupsListCommand, backupsRestoreCommand]),
);
