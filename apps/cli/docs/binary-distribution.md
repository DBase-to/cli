# Binary Distribution

This document explains how the DBase CLI is packaged and distributed as a compiled binary per platform.

## Overview

The CLI is distributed as a set of platform-specific npm packages. Each platform package contains one binary:

```
@dbase.to/cli-darwin-arm64/
└── bin/
    └── dbase          ← TypeScript CLI (Bun single-file executable)
```

The base `@dbase.to/cli` package routes to the correct platform package via `src/shared/cli/bin.ts`, which resolves and `execFileSync`s the platform-specific `bin/dbase` binary.

## Package Layout

```
packages/
  cli-darwin-arm64/bin/      dbase
  cli-darwin-x64/bin/        dbase
  cli-linux-arm64/bin/       dbase
  cli-linux-x64/bin/         dbase
  cli-linux-arm64-musl/bin/  dbase
  cli-linux-x64-musl/bin/    dbase
  cli-windows-arm64/bin/     dbase.exe
  cli-windows-x64/bin/       dbase.exe
```

## Development Workflow

No build step is required to run the CLI from source.

1. Create a shell alias to run the CLI from source. For example in `.zshrc`:

   ```sh
   alias dbase-dev="bun /path/to/dx-lab/apps/cli/src/main.ts"
   ```

2. Run commands directly:

   ```sh
   dbase-dev login
   ```

## Release Workflow

The `scripts/build.ts` script compiles the binary for all target platforms:

```sh
bun scripts/build.ts --version X.Y.Z
```

This:

1. Compiles the TS CLI to a Bun SFE for each platform → `packages/cli-{platform}/bin/dbase`
2. Signs the macOS binaries before archiving, so every channel ships the signed bytes — see [release-process.md § Code signing (macOS)](./release-process.md#code-signing-macos) and
3. Bundles the binary into the platform archives (`.tar.gz` / `.zip`)
4. Includes the binary in the Linux package manager packages (deb/rpm/apk)

## See Also

- [`release-process.md`](./release-process.md) — operational playbook for local, PoC, and production releases.
