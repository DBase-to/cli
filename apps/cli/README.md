# dbase

The DBase CLI: run the local stack, manage database migrations, deploy Edge
Functions, and generate types from your terminal.

## Install

See the [repository README](../../README.md#installation) for the current
install channels. The npm, Homebrew, and Scoop channels are not published yet;
until then, run the CLI from source as described below.

## Run from source

From the workspace:

```sh
cd apps/cli
pnpm dev -- --help
```

### CLI and the Go binary

A fixed, small command surface (see
[`docs/binary-distribution.md`](./docs/binary-distribution.md)) proxies to the
Go CLI binary. To run those commands from source, put `dbase-go` on `PATH`, or
point `DBASE_GO_BINARY` at it. The older `SUPABASE_GO_BINARY` name still works
as a fallback.

For convenience, use a shell alias instead of `pnpm dev` directly. For example,
in `.zshrc`:

```sh
alias dbase-dev="bun /absolute/path/to/cli/apps/cli/src/main.ts"
```

Then proxied commands resolve the Go binary via `PATH` automatically.

## Build

There are two separate build paths depending on what you need.

### Source bundles (development)

From `apps/cli`:

```sh
pnpm build
pnpm build:binary
pnpm build:shim
```

Output in `dist/`:

- `dist/dbase.js` — base shim that routes to the correct platform binary
- `dist/dbase` — CLI compiled binary (Bun single-file executable for the host platform)
- `dist/dbase-go` — Go sidecar used by the residual proxied commands

The shim resolves `SUPABASE_CLI_BINARY_OVERRIDE` (an absolute binary path)
before falling back to the `@dbase/cli-<platform>` optional-dependency lookup.
The e2e test harness uses this override to invoke the real shim + compiled
binary handoff against the per-shell builds in `dist/`.

### Platform releases (Bun single-file executables)

Used at release time to produce the compiled binaries that go into the
platform-specific npm packages:

```sh
bun scripts/build.ts --version X.Y.Z
```

This also cross-compiles the Go CLI binary from `apps/cli-go/` and places both
binaries in `packages/cli-{platform}/bin/`.

See [`docs/binary-distribution.md`](./docs/binary-distribution.md) for the full
packaging model.

## Architecture

The CLI is built on `effect/unstable/cli`.

Important areas:

- `src/shared/cli/` for shared runner logic, roots, and global flags
- `src/commands/` for the command tree
- `src/shared/output/` for text / JSON / NDJSON output policies
- `src/shared/runtime/` for TTY, stdin, browser, and process-control services
- `src/shared/auth/` for login-related services

The local stack commands use `@supabase/stack` for lifecycle, status, logs, and
runtime operations. Managed ownership uses stable loopback `GET /owner` and
session-fenced `POST /stop`; same-version runtime calls use Effect RPC over
framed NDJSON at `POST /rpc`. The stack layer has an explicit preparation
phase, so foreground and detached `start` flows can surface `Downloading`
before normal runtime states. CLI-managed stacks use lazy service startup:
direct listeners and Realtime start with the stack, while HTTP services
activate on first proxied use. The package API keeps eager startup as its
default.

Useful companion docs:

- [`../../packages/stack/README.md`](../../packages/stack/README.md)

## Development

Repo-wide quality checks run from the repository root:

```sh
pnpm check:all
pnpm fix:all
```

Package-local checks and tests run from `apps/cli`:

```sh
pnpm types:check
pnpm test
```

Useful subsets:

```sh
pnpm run test:unit && pnpm run test:integration  # unit + integration (no binary required)
pnpm test:e2e                  # end-to-end subprocess tests
```

## Publishing

This workspace publishes the umbrella CLI package. Release channels are split
by npm dist-tag:

- `stable` publishes the CLI to `latest`
- `beta` publishes the CLI to `beta`

The release automation lives in
[`.github/workflows/release.yml`](../../.github/workflows/release.yml).

### Platform packages

Platform-specific packages live under:

- `packages/cli-darwin-*`
- `packages/cli-linux-*`
- `packages/cli-windows-*`

Each platform package ships two binaries:

- `bin/dbase` — the compiled TypeScript CLI (Bun single-file executable)
- `bin/dbase-go` — the compiled Go CLI binary, used by the residual proxied commands

The Go binary is compiled from `apps/cli-go/` at release time. Run
`pnpm repos:install` after a fresh clone to make that source available.
