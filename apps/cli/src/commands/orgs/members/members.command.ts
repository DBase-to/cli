import { Command } from "effect/cli";

import { orgsMembersListCommand } from "./list/list.command.ts";

export const orgsMembersCommand = Command.make("members").pipe(
  Command.withDescription("Manage DBase organization members"),
  Command.withShortDescription("Manage organization members"),
  Command.withSubcommands([orgsMembersListCommand]),
);
