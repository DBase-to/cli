import { Argument, Command } from "effect/unstable/cli";
import type * as CliCommand from "effect/unstable/cli/Command";

import { withJsonErrorHandling } from "../../../../shared/output/json-error-handling.ts";
import { managementApiRuntimeLayer } from "../../../../command-internal/management-api-runtime.layer.ts";
import { withCommandTelemetry } from "../../../../telemetry/command-telemetry.ts";
import { orgsMembersList } from "./list.handler.ts";

const config = {
  slug: Argument.string("slug").pipe(
    Argument.withDescription("Slug of the organization whose members to list."),
  ),
};
export type OrgsMembersListFlags = CliCommand.Command.Config.Infer<typeof config>;

export const orgsMembersListCommand = Command.make("list", config).pipe(
  Command.withDescription("List members of an organization."),
  Command.withShortDescription("List organization members"),
  Command.withHandler((flags) =>
    orgsMembersList(flags).pipe(withCommandTelemetry({ flags }), withJsonErrorHandling),
  ),
  Command.provide(managementApiRuntimeLayer(["orgs", "members", "list"])),
);
