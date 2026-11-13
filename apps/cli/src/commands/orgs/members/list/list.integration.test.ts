import type { V1ListOrganizationMembersOutput } from "@supabase/api/effect";
import { describe, expect, it } from "@effect/vitest";
import { Effect, Exit, Option } from "effect";

import { mockOutput } from "../../../../../tests/helpers/mocks.ts";
import {
  buildTestRuntime,
  mockCommandSettings,
  mockCommandPlatformApi,
  useTempWorkdir,
} from "../../../../../tests/helpers/command-mocks.ts";
import { orgsMembersList } from "./list.handler.ts";

type Members = typeof V1ListOrganizationMembersOutput.Type;

const SAMPLE_MEMBER: Members[number] = {
  user_id: "495c85bb-e536-4a6b-a2c7-f7384747d8ac",
  user_name: "Read Only",
  email: "read-only@example.com",
  role_name: "Read-only",
  mfa_enabled: true,
  avatar_url: null,
};

const tempRoot = useTempWorkdir("supabase-orgs-members-list-int-");

function setup(
  opts: {
    readonly format?: "text" | "json" | "stream-json";
    readonly goOutput?: "json" | "yaml" | "toml" | "env" | "pretty";
    readonly response?: Members;
    readonly status?: number;
  } = {},
) {
  const out = mockOutput({ format: opts.format ?? "text" });
  const api = mockCommandPlatformApi({
    response: { status: opts.status ?? 200, body: opts.response ?? [SAMPLE_MEMBER] },
  });
  const cliSettings = mockCommandSettings({ workdir: tempRoot.current });
  const layer = buildTestRuntime({
    out,
    api,
    cliSettings,
    goOutput: opts.goOutput === undefined ? Option.none() : Option.some(opts.goOutput),
  });
  return { layer, out, api };
}

describe("orgs members list integration", () => {
  it.live("renders a table with the member columns in text mode", () => {
    const { layer, out } = setup();
    return Effect.gen(function* () {
      yield* orgsMembersList({ slug: "acme" });
      expect(out.stdoutText).toContain("USER ID");
      expect(out.stdoutText).toContain("EMAIL");
      expect(out.stdoutText).toContain("read-only@example.com");
      expect(out.stdoutText).toContain("Read-only");
    }).pipe(Effect.provide(layer));
  });

  it.live("calls GET /v1/organizations/{slug}/members", () => {
    const { layer, api } = setup();
    return Effect.gen(function* () {
      yield* orgsMembersList({ slug: "acme" });
      expect(api.requests).toHaveLength(1);
      expect(api.requests[0]?.method).toBe("GET");
      expect(api.requests[0]?.url).toContain("/v1/organizations/acme/members");
    }).pipe(Effect.provide(layer));
  });

  it.live("emits a success event for --output-format=json", () => {
    const { layer, out } = setup({ format: "json" });
    return Effect.gen(function* () {
      yield* orgsMembersList({ slug: "acme" });
      const success = out.messages.find((message) => message.type === "success");
      expect(success?.data).toMatchObject({ members: [SAMPLE_MEMBER] });
    }).pipe(Effect.provide(layer));
  });

  it.live("emits JSON for --output json", () => {
    const { layer, out } = setup({ goOutput: "json" });
    return Effect.gen(function* () {
      yield* orgsMembersList({ slug: "acme" });
      expect(out.stdoutText).toContain('"email": "read-only@example.com"');
    }).pipe(Effect.provide(layer));
  });

  it.live("fails with OrgsMembersListUnexpectedStatusError on HTTP 503", () => {
    const { layer } = setup({ status: 503, response: [] });
    return Effect.gen(function* () {
      const exit = yield* Effect.exit(orgsMembersList({ slug: "acme" }));
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        expect(JSON.stringify(exit.cause)).toContain("OrgsMembersListUnexpectedStatusError");
      }
    }).pipe(Effect.provide(layer));
  });
});
