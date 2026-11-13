<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./docs/assets/DBase-Wordmark-Dark.png">
    <img src="./docs/assets/DBase-Wordmark-Light.png" alt="DBase CLI" width="360">
  </picture>
</p>

<p align="center">
  Develop locally and deploy to DBase from your terminal.
</p>

<p align="center">
  <a href="#license"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square"></a>
</p>

---

DBase CLI brings DBase to your terminal. Run the full local stack, manage database migrations, deploy Edge Functions, generate types, and automate project workflows.

## Installation

Install the CLI with the install script:

```sh
# macOS and Linux
curl -fsSL https://raw.githubusercontent.com/DBase-to/cli/main/install | bash
```

Linux packages (`.apk`, `.deb`, and `.rpm`) are available from
[Releases](https://github.com/DBase-to/cli/releases).

npm, Homebrew, and Scoop channels are planned. Until they are published, run
the CLI from source as described in [Developing](#developing).

## Start Local Development

Create a DBase workspace and start the local stack:

```sh
dbase init
dbase start
dbase status
```

The local stack includes Postgres, Auth, Realtime, Storage, Edge Functions, and the DBase APIs.

Start from a template:

```sh
dbase bootstrap
```

## Link A Project

Connect your local workspace to a hosted DBase project:

```sh
dbase login
dbase link
```

## Manage Your Database

Create migrations, compare schemas, and apply changes locally or to your linked project:

```sh
dbase migration new create_profiles
dbase db diff
dbase db push
dbase db reset
```

## Deploy Edge Functions

Build, serve, and deploy functions from the same project workspace:

```sh
dbase functions new hello-world
dbase functions serve
dbase functions deploy hello-world
```

## Generate Types

Generate TypeScript types from your local database or linked project:

```sh
dbase gen types --local
dbase gen types --linked
```

## Reference

Use `--help` on any command to explore flags and examples:

```sh
dbase db --help
dbase functions deploy --help
```

- [CLI reference](https://dbase.to/docs/reference/cli)
- [Local development guide](https://dbase.to/docs/guides/local-development)
- [DBase docs](https://dbase.to/docs)

## Developing

This repository is a pnpm monorepo. The published package lives in `apps/cli`.

```sh
pnpm install
pnpm check:all

cd apps/cli

pnpm dev -- --help
pnpm types:check
pnpm run test:unit && pnpm run test:integration
```

Useful source entry points:

| Path              | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `apps/cli`        | TypeScript/Bun CLI package                      |
| `apps/cli-go`     | Go CLI source used by the CLI                   |
| `packages/stack`  | Local DBase stack runtime                       |
| `packages/config` | Config schema and generated types               |
| `packages/api`    | Typed Management API client (OpenAPI-generated) |

After a fresh clone, install the reference repositories used for agent and developer inspection:

```sh
pnpm repos:install
```

## Contributing

We love focused pull requests with a clear problem, a small surface area, and tests that match the user-facing behavior.

DBase CLI is a downstream fork of [`supabase/cli`](https://github.com/supabase/cli). Changes that are not specific to DBase should be opened upstream; see [CONTRIBUTING.md](./CONTRIBUTING.md#upstream-first).

Open an issue first and wait for a maintainer to add the `open-for-contribution` label before starting work — external pull requests that don't link a labeled, open issue are closed automatically. See [CONTRIBUTING.md](./CONTRIBUTING.md#contribution-workflow) for the full workflow.

Before opening a PR, run repo-wide quality checks from the repository root,
then run the relevant package tests from each workspace you touched. For each
touched TypeScript workspace (or any workspace that declares it), also run its
`pnpm types:check` script. For example:

```sh
# From the repository root:
pnpm check:all

# From apps/cli (a touched TypeScript workspace):
cd apps/cli
pnpm types:check
pnpm run test:unit && pnpm run test:integration

# Repeat the relevant package tests for every touched workspace; run
# pnpm types:check there too when that workspace declares the script.
```

PR titles must use conventional commits, for example:

```text
fix(cli): handle linked projects without cached service versions
```

## License

DBase CLI packages are released under the MIT license.
