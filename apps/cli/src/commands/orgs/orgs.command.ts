import { Command } from "effect/cli";
import { orgsCreateCommand } from "./create/create.command.ts";
import { orgsListCommand } from "./list/list.command.ts";
import { orgsMembersCommand } from "./members/members.command.ts";

// There is no Long description, so the Short string is reused for both the subcommand
// summary and the `dbase orgs --help` long description. No trailing
// period.
export const orgsCommand = Command.make("orgs").pipe(
  Command.withDescription("Manage DBase organizations"),
  Command.withShortDescription("Manage DBase organizations"),
  Command.withSubcommands([orgsListCommand, orgsCreateCommand, orgsMembersCommand]),
);
