# Security Policy

Thank you for helping keep the DBase CLI and its users safe.

## Reporting a vulnerability

Please report suspected vulnerabilities privately through GitHub's
[private vulnerability reporting](https://github.com/DBase-to/cli/security/advisories/new).
Do not open a public issue or pull request for a security problem.

Include the affected version, the command you ran, the operating system, and a
minimal reproduction. We will acknowledge the report and keep you updated while
we investigate.

## Scope

This repository contains the DBase CLI. It runs on a developer's machine or in
CI, starts the local development stack (`dbase start`), manages migrations,
deploys and downloads Edge Functions, and talks to the hosted DBase Management
API on the user's behalf.

In scope:

- Theft of a CLI access token or project secret.
- Redirecting CLI credentials to a server the user did not choose.
- Connecting to a database or API without properly verifying the peer.
- Writing files outside the directory the user asked the CLI to use.
- Running code from downloaded content without the user choosing to.

Out of scope:

- Vulnerabilities in the hosted DBase platform itself. Report those through
  DBase support instead.
- Vulnerabilities in third-party services the CLI integrates with.
- Social engineering, physical access, or attacks that require an already
  compromised machine.

Please give us reasonable time to fix an issue before publishing details. Do not
include customer data or credentials in a report.
