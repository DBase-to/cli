import { Argument, Command } from "effect/cli";
import type * as CliCommand from "effect/cli/Command";

import { withPermissions } from "../../../../command-internal/command-permissions/command-permissions.annotation.ts";
import { withTargetPolicy } from "../../../../command-internal/target/target-policy.ts";
import { withJsonErrorHandling } from "../../../../shared/output/json-error-handling.ts";
import { managementApiRuntimeLayer } from "../../../../command-internal/management-api-runtime.layer.ts";
import { withCommandTelemetry } from "../../../../telemetry/command-telemetry.ts";
import { orgsMembersList } from "./list.handler.ts";

const config = {
  slug: Argument.String("slug").pipe(
    Argument.withDescription("Slug of the organization whose members to list."),
  ),
};
export type OrgsMembersListFlags = CliCommand.Command.Config.Infer<typeof config>;

export const orgsMembersListCommand = Command.make("list", config).pipe(
  Command.withDescription("List members of an organization."),
  Command.withShortDescription("List organization members"),
  withPermissions({
    operations: [{ operationId: "v1-list-organization-members", kind: "required" }],
  }),
  Command.withHandler((flags) =>
    orgsMembersList(flags).pipe(withCommandTelemetry({ flags }), withJsonErrorHandling),
  ),
  Command.provide(managementApiRuntimeLayer(["orgs", "members", "list"])),
  withTargetPolicy({ group: "account", consent: "none" }),
);
