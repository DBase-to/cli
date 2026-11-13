# OpenAPI Sync Workflows

> This document covers the GitHub Actions workflows that keep checked-in OpenAPI
> types in sync with the live Management API.

Two workflows keep the generated clients in sync with the Management API:

| Workflow                                 | Generated output                                                                  | Source                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `.github/workflows/api-package-sync.yml` | `packages/api/src/generated` (`contracts.ts`, `openapi.json`, `effect-client.ts`) | Management API OpenAPI documents (`/api/v1-json`, `/api/v2-json`)      |
| `.github/workflows/cli-go-api-sync.yml`  | `apps/cli-go/api/v1-openapi.yaml` and `apps/cli-go/pkg/api`                       | The v1 OpenAPI document, regenerated with `go generate` (oapi-codegen) |

`api-package-sync.yml` runs the package's `pnpm generate`. `cli-go-api-sync.yml`
refreshes the committed snapshot and runs oapi-codegen. Both open a PR against
`develop` and enable auto-merge rather than pushing directly.

## Triggers

- `api-package-sync.yml`: `workflow_dispatch` only. The hourly schedule is
  disabled.
- `cli-go-api-sync.yml`: `repository_dispatch` (`api-sync`) and
  `workflow_dispatch`. The daily schedule is disabled.

Both schedules are off while the DBase Management API document is reconciled
with the generated client surface. `https://api.dbase.to/openapi.json` renames
48 operation ids and omits 12 paths the CLI still calls, so both workflows
continue to read the upstream documents. Re-enable the schedules once that gap
is closed; at that point `api-package-sync.yml` must also switch from the split
`/api/v1-json` + `/api/v2-json` documents to the combined `/openapi.json`
document.

## Change detection

Both workflows rely on `git diff` rather than spec hashes or ETags:

- If the generated files are byte-identical, the workflow stops without opening
  a PR.
- If they differ, the PR contains only the generated paths and the snapshot, so
  an unrelated lockfile update cannot leak into the sync.
- Auto-merge is enabled on the PR once checks pass.

## Sender workflow (API repo)

The legacy sender dispatched `openapi-spec-changed` to `supabase/cli`. A DBase
equivalent should dispatch the `api-sync` event consumed by
`cli-go-api-sync.yml` after a production deploy, using a GitHub App installation
token rather than a PAT: installation tokens are short-lived (~1 hour), scoped
to specific repositories, and are not tied to a personal account.

That sender lives outside this repository.
