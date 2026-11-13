import { Command } from "effect/cli";
import { snippetsListCommand } from "./list/list.command.ts";
import { snippetsDownloadCommand } from "./download/download.command.ts";

export const snippetsCommand = Command.make("snippets").pipe(
  Command.withDescription("Manage DBase SQL snippets."),
  Command.withShortDescription("Manage DBase SQL snippets"),
  Command.withSubcommands([snippetsListCommand, snippetsDownloadCommand]),
);
