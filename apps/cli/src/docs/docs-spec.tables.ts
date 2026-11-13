import type { DocsFlag } from "./docs-spec.ts";
import { genTypesLanguageFlagDefaults } from "../commands/gen/types/types.languages.ts";

/**
 * Static data the Effect command tree cannot express structurally: docs-site section tags,
 * `--experimental`-required leaves, deprecated commands, and flag defaults that
 * `Flag.withDefault` only captures in a closure. `buildDocsSpec` fails the build on stale keys.
 */

export interface DocsInfoTag {
  readonly id: string;
  readonly title: string;
}

export const DOCS_INFO_TAGS: ReadonlyArray<DocsInfoTag> = [
  { id: "quick-start", title: "Quick Start" },
  { id: "local-dev", title: "Local Development" },
  { id: "management-api", title: "Management APIs" },
  { id: "other-commands", title: "Additional Commands" },
];

/** Docs-site section tag per top-level command. */
export const DOCS_TAGS: Readonly<Record<string, ReadonlyArray<string>>> = {
  "dbase-bootstrap": ["quick-start"],
  "dbase-backups": ["management-api"],
  "dbase-branches": ["management-api"],
  "dbase-completion": ["other-commands"],
  "dbase-config": ["management-api"],
  "dbase-db": ["local-dev"],
  "dbase-domains": ["management-api"],
  "dbase-encryption": ["management-api"],
  "dbase-feedback": ["other-commands"],
  "dbase-functions": ["management-api"],
  "dbase-gen": ["local-dev"],
  "dbase-init": ["local-dev"],
  "dbase-inspect": ["local-dev"],
  "dbase-issue": ["other-commands"],
  "dbase-link": ["local-dev"],
  "dbase-login": ["local-dev"],
  "dbase-logout": ["local-dev"],
  "dbase-logs": ["management-api", "local-dev"],
  "dbase-migration": ["local-dev"],
  "dbase-network-bans": ["management-api"],
  "dbase-network-restrictions": ["management-api"],
  "dbase-notebooks": ["management-api"],
  "dbase-orgs": ["management-api"],
  "dbase-postgres-config": ["management-api"],
  "dbase-projects": ["management-api"],
  "dbase-pull": ["other-commands"],
  "dbase-secrets": ["management-api"],
  "dbase-seed": ["local-dev"],
  "dbase-services": ["local-dev"],
  "dbase-snippets": ["management-api"],
  "dbase-ssl-enforcement": ["management-api"],
  "dbase-sso": ["management-api"],
  "dbase-start": ["local-dev"],
  "dbase-status": ["local-dev"],
  "dbase-stop": ["local-dev"],
  "dbase-storage": ["management-api"],
  "dbase-telemetry": ["local-dev"],
  "dbase-test": ["local-dev"],
  "dbase-unlink": ["local-dev"],
  "dbase-vanity-subdomains": ["management-api"],
  "dbase-whoami": ["management-api"],
};

/** Leaves that require `--experimental`. */
export const DOCS_EXPERIMENTAL: ReadonlySet<string> = new Set([
  "dbase-network-bans-get",
  "dbase-network-bans-remove",
  "dbase-network-restrictions-get",
  "dbase-network-restrictions-update",
  "dbase-postgres-config-delete",
  "dbase-postgres-config-get",
  "dbase-postgres-config-update",
  "dbase-ssl-enforcement-get",
  "dbase-ssl-enforcement-update",
  "dbase-storage-cp",
  "dbase-storage-ls",
  "dbase-storage-mv",
  "dbase-storage-rm",
  "dbase-vanity-subdomains-activate",
  "dbase-vanity-subdomains-check-availability",
  "dbase-vanity-subdomains-delete",
  "dbase-vanity-subdomains-get",
]);

/**
 * Leaves gated on `--experimental` OR `[experimental.pgdelta] enabled` (default true)
 * in config.toml — the flag is documented but not marked required, since the gate
 * is open unless config sets `enabled = false`.
 */
export const DOCS_EXPERIMENTAL_OPTIONAL: ReadonlySet<string> = new Set([
  "dbase-db-schema-declarative-generate",
  "dbase-db-schema-declarative-sync",
]);

/**
 * Deprecated commands: kept visible in `--help` (with a "(deprecated)"
 * suffix) but excluded from the published reference.
 */
export const DOCS_EXCLUDED: ReadonlySet<string> = new Set([
  "dbase-inspect-db-cache-hit",
  "dbase-inspect-db-index-sizes",
  "dbase-inspect-db-index-usage",
  "dbase-inspect-db-role-configs",
  "dbase-inspect-db-role-connections",
  "dbase-inspect-db-seq-scans",
  "dbase-inspect-db-table-record-counts",
  "dbase-inspect-db-table-sizes",
  "dbase-inspect-db-unused-indexes",
]);

/**
 * Flag defaults that differ from the primitive type's zero value, keyed
 * `"<doc id> <flag id>"` (root global flags use doc id `dbase`). TS-only
 * flags add entries by hand.
 */
export const DOCS_DEFAULT_OVERRIDES: Readonly<Record<string, string>> = {
  ...genTypesLanguageFlagDefaults(),
  "dbase agent": "auto",
  "dbase dns-resolver": "native",
  "dbase output": "pretty",
  "dbase output-format": "text",
  "dbase profile": "dbase",
  "dbase-db-advisors fail-on": "none",
  "dbase-db-advisors level": "warn",
  "dbase-db-advisors type": "all",
  "dbase-db-lint fail-on": "none",
  "dbase-db-lint level": "warning",
  "dbase-db-pull diff-engine": "pg-delta",
  "dbase-db-schema-declarative-sync file": "declarative_sync",
  "dbase-functions-deploy jobs": "1",
  "dbase-functions-new auth": "apikey",
  "dbase-gen-bearer-jwt payload": "{}",
  "dbase-gen-bearer-jwt sub": "anonymous",
  "dbase-gen-bearer-jwt valid-for": "30m0s",
  "dbase-gen-signing-key algorithm": "ES256",
  "dbase-gen-types lang": "typescript",
  "dbase-gen-types query-timeout": "15s",
  "dbase-inspect-report output-dir": ".",
  "dbase-login name": "built-in token name generator",
  "dbase-migration-down last": "1",
  "dbase-storage-cp cache-control": "max-age=3600",
  "dbase-storage-cp content-type": "auto-detect",
  "dbase-storage-cp jobs": "1",
  "dbase-test-new template": "pgtap",
};

/**
 * Flag docs injected into specific commands beyond what their Effect config
 * declares, keyed by doc id. `db query` reuses the global `-o, --output`
 * choice at parse time (which documents only the globally valid formats), so
 * its own page documents the query-specific formats here.
 */
export const DOCS_EXTRA_FLAGS: Readonly<Record<string, ReadonlyArray<DocsFlag>>> = {
  "dbase-db-query": [
    {
      id: "output",
      name: "-o, --output <[ json | table | csv ]>",
      description: "Output format: table, json, or csv.",
      default_value: "json",
      accepted_values: [
        { id: "json", name: "json", type: "[ json | table | csv ]" },
        { id: "table", name: "table", type: "[ json | table | csv ]" },
        { id: "csv", name: "csv", type: "[ json | table | csv ]" },
      ],
    },
  ],
};

export const DOCS_CHOICE_OVERRIDES: Readonly<Record<string, ReadonlyArray<string>>> = {
  "dbase output": ["env", "pretty", "json", "toml", "yaml"],
};

/**
 * Flags excluded from the published reference, keyed `"<doc id> <flag id>"`. Validated at build
 * time like the other tables.
 */
export const DOCS_EXCLUDED_FLAGS: ReadonlySet<string> = new Set([]);

/**
 * Usage argument overrides, keyed by doc id, for commands whose published argument rendering
 * can't be derived from the Effect tree: the parser accepts zero occurrences here
 * (`secrets set --env-file` passes no positionals; `storage rm` validates in the handler), but
 * the documented shape is required.
 */
export const DOCS_ARG_OVERRIDES: Readonly<Record<string, string>> = {
  "dbase-secrets-set": "<NAME=VALUE> ...",
  "dbase-storage-rm": "<file> ...",
};

/**
 * Flags rendered with a Required badge on the docs site, keyed
 * `"<doc id> <flag id>"`. Effect optionality cannot express this — several
 * of these TS flags are intentionally `Flag.optional` at parse time for
 * validation-ordering reasons unrelated to required-ness.
 */
export const DOCS_REQUIRED: ReadonlySet<string> = new Set([
  "dbase-domains-create custom-hostname",
  "dbase-gen-bearer-jwt role",
  "dbase-migration-repair status",
  "dbase-sso-add type",
  "dbase-vanity-subdomains-activate desired-subdomain",
  "dbase-vanity-subdomains-check-availability desired-subdomain",
]);

export const DOCS_INFO_DESCRIPTION =
  "DBase CLI provides you with tools to develop your application locally, and deploy your application to the DBase platform.";
