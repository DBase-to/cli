import { Command } from "effect/cli";
import { inspectDbCommand } from "./db/db.command.ts";
import { inspectReportCommand } from "./report/report.command.ts";

export const inspectCommand = Command.make("inspect").pipe(
  Command.withDescription("Tools to inspect your DBase project."),
  Command.withShortDescription("Inspect project tools"),
  Command.withSubcommands([inspectReportCommand, inspectDbCommand]),
);
