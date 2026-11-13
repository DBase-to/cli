import type { V1ListOrganizationMembersOutput } from "@supabase/api/effect";
import { Effect, Option } from "effect";

import { CommandPlatformApi } from "../../../../auth/command-platform-api.service.ts";
import { TelemetryState } from "../../../../telemetry/telemetry-state.service.ts";
import { OutputFlag } from "../../../../command-internal/global-flags.ts";
import { Output } from "../../../../shared/output/output.service.ts";
import { encodeSortedJson } from "../../../../command-internal/output.encoders.ts";
import {
  encodeStructToml,
  encodeStructYaml,
} from "../../../../command-internal/struct-output.encoders.ts";
import { mapHttpError } from "../../../../command-internal/http-errors.ts";
import {
  ORGS_MEMBERS_LIST_SHAPE,
  ORGS_MEMBERS_TOML_WRAPPER_SHAPE,
} from "../../orgs.response-shape.ts";
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
    yield* fetching?.clear ?? Effect.void;

    const goFmt = Option.getOrUndefined(goOutputFlag);

    if (goFmt === "env") {
      return yield* new OrgsEnvNotSupportedError({
        message: "--output env flag is not supported",
      });
    }
    if (goFmt === "json") {
      yield* output.raw(encodeSortedJson(members));
      return;
    }
    if (goFmt === "yaml") {
      yield* output.raw(encodeStructYaml(members, ORGS_MEMBERS_LIST_SHAPE));
      return;
    }
    if (goFmt === "toml") {
      yield* output.raw(encodeStructToml({ members }, ORGS_MEMBERS_TOML_WRAPPER_SHAPE));
      return;
    }

    if (output.format === "json" || output.format === "stream-json") {
      yield* output.success("", { members });
      return;
    }

    yield* output.raw(renderOrgsMembersTable(members));
  }).pipe(Effect.ensuring(telemetryState.flush));
});
