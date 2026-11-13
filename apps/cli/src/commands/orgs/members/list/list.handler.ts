import type { V1ListOrganizationMembersOutput } from "@supabase/api/effect";
import { Effect, Option } from "effect";

import { CommandPlatformApi } from "../../../../auth/command-platform-api.service.ts";
import { TelemetryState } from "../../../../telemetry/telemetry-state.service.ts";
import { OutputFlag } from "../../../../command-internal/global-flags.ts";
import { Output } from "../../../../shared/output/output.service.ts";
import { encodeGoJson } from "../../../../command-internal/go-output.encoders.ts";
import {
  encodeGoToml,
  encodeGoYaml,
} from "../../../../command-internal/go-struct-output.encoders.ts";
import { mapHttpError } from "../../../../command-internal/http-errors.ts";
import { GO_ORGS_MEMBERS_LIST, GO_ORGS_MEMBERS_TOML_WRAPPER } from "../../orgs.go-payload.ts";
import {
  OrgsEnvNotSupportedError,
  OrgsMembersListNetworkError,
  OrgsMembersListUnexpectedStatusError,
} from "../../orgs.errors.ts";
import { renderOrgsMembersTable } from "../../orgs.format.ts";
import type { OrgsMembersListFlags } from "./list.command.ts";

type Members = typeof V1ListOrganizationMembersOutput.Type;

const mapListMembersError = mapHttpError({
  networkError: OrgsMembersListNetworkError,
  statusError: OrgsMembersListUnexpectedStatusError,
  networkMessage: (cause) => `failed to list organization members: ${cause}`,
  statusMessage: (status, body) => `unexpected list organization members status ${status}: ${body}`,
});

export const orgsMembersList = Effect.fn("orgs.members.list")(function* (
  flags: OrgsMembersListFlags,
) {
  const output = yield* Output;
  const goOutputFlag = yield* OutputFlag;
  const api = yield* CommandPlatformApi;
  const telemetryState = yield* TelemetryState;

  yield* Effect.gen(function* () {
    const fetching =
      output.format === "text" ? yield* output.task("Fetching organization members...") : undefined;
    const members: Members = yield* api.v1.listOrganizationMembers({ slug: flags.slug }).pipe(
      Effect.tapError(() => fetching?.fail() ?? Effect.void),
      Effect.catch(mapListMembersError),
    );
    yield* fetching?.clear() ?? Effect.void;

    const goFmt = Option.getOrUndefined(goOutputFlag);

    if (goFmt === "env") {
      return yield* new OrgsEnvNotSupportedError({
        message: "--output env flag is not supported",
      });
    }
    if (goFmt === "json") {
      yield* output.raw(encodeGoJson(members));
      return;
    }
    if (goFmt === "yaml") {
      yield* output.raw(encodeGoYaml(members, GO_ORGS_MEMBERS_LIST));
      return;
    }
    if (goFmt === "toml") {
      yield* output.raw(encodeGoToml({ members }, GO_ORGS_MEMBERS_TOML_WRAPPER));
      return;
    }

    if (output.format === "json" || output.format === "stream-json") {
      yield* output.success("", { members });
      return;
    }

    yield* output.raw(renderOrgsMembersTable(members));
  }).pipe(Effect.ensuring(telemetryState.flush));
});
