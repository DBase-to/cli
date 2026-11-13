# `dbase unlink`

Operates entirely on local state under `<workdir>/supabase/.temp/` and the OS
keyring — no API calls.

## Files Read

| Path                         | Format     | When                                   |
| ---------------------------- | ---------- | -------------------------------------- |
| `supabase/.temp/project-ref` | plain text | always, to find the linked project ref |

The ref bytes are read **without trimming** — `link` writes the ref with no trailing newline, so the
value round-trips exactly and is reused verbatim for both the stderr message and the keyring key.

## Files Written / Deleted

| Path              | Action              | When                           |
| ----------------- | ------------------- | ------------------------------ |
| `supabase/.temp/` | removed recursively | always (after reading the ref) |

Also deletes the stored **database-password** credential from the OS keyring (service `"DBase CLI"`,
account = the **project ref**). A missing entry is ignored; the access-token credential is left untouched.

## API Routes

None.

## Environment Variables

| Variable                   | Purpose                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `DBASE_WORKDIR`            | `--workdir` resolution                                                                                                                          |
| `DBASE_EXPERIMENTAL_STACK` | `1` or `0` selects stack project-state mode over `[experimental] stack`; unset or empty uses the config. Any other value fails (see Exit Codes) |

## Exit Codes

| Code | Condition                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------ |
| `0`  | success — project unlinked; prints `Finished dbase unlink.`                                            |
| `1`  | not linked — `supabase/.temp/project-ref` absent (`Cannot find project ref. Have you run dbase link?`) |
| `1`  | project-ref read error                                                                                 |
| `1`  | temp-dir removal error                                                                                 |
| `1`  | keyring delete error other than not-found (e.g. permission denied)                                     |
| `1`  | `DBASE_EXPERIMENTAL_STACK` is set to a non-empty value other than `0` or `1`; nothing is removed       |

## Output

### `--output-format text`

- stderr: `Unlinking project: <ref>`
- stdout: `Finished dbase unlink.`

### `--output-format json` / `stream-json`

Emits a structured success (`{ project_ref }`) and suppresses the human `Finished` line.

## Stack mode

In stack project-state mode, `unlink` reads the ref from `supabase/.link.json`
(`active_branch.ref`), removes that file instead of `supabase/.temp/`, and deletes the same
keyring credential. A missing document fails with `ProjectRefNotLinkedError`; the legacy `.temp`
directory is left untouched. The file is removed under the project lease
`supabase/.supabase.lock.lease` (created if absent), the lease `dbase link` publishes
`.link.json` under; `supabase/.gitignore` gains the lease entries whenever the lease is taken. A
lease that stays busy fails with `LockResolutionError` reason `lease-busy`
and exit code `1` before the link or the credential is touched. A document that does not decode is still removed, so a damaged link
can be cleared; the ref is then unknown, so no credential is deleted and the structured success
carries `project_ref: null`.

## Notes

The `Finished dbase unlink.` line is emitted as **plain text**, with no ANSI color on
`dbase unlink` (color helpers are rendered plain); ANSI-stripping scripts are unaffected.
