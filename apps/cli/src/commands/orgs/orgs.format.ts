import type { OrganizationResponseV1_Output } from "@supabase/api/effect";

import { renderGlamourTable } from "../../output/glamour-table.ts";

const HEADERS = ["ID", "NAME"] as const;

type Organization = typeof OrganizationResponseV1_Output.Type;

/**
 * Renders the `orgs list` / `orgs create` table.
 *
 * `renderGlamourTable` lays out cells directly, so raw `id`/`name` values pass through
 * unescaped — including any literal `|` and without stripping ANSI or other control bytes,
 * matching established output. Add sanitization in `renderGlamourTable` if it's ever needed,
 * not here.
 */
export function renderOrgsListTable(orgs: ReadonlyArray<Organization>): string {
  const rows = orgs.map((o) => [o.id, o.name]);
  return renderGlamourTable(HEADERS, rows);
}

const MEMBER_HEADERS = ["USER ID", "NAME", "EMAIL", "ROLE", "MFA"] as const;

export type OrganizationMemberRow = {
  user_id: string;
  user_name: string;
  email?: string;
  role_name: string;
  mfa_enabled: boolean;
};

export function renderOrgsMembersTable(members: ReadonlyArray<OrganizationMemberRow>): string {
  const rows = members.map((member) => [
    member.user_id,
    member.user_name,
    member.email ?? "",
    member.role_name,
    member.mfa_enabled ? "true" : "false",
  ]);
  return renderGlamourTable(MEMBER_HEADERS, rows);
}
