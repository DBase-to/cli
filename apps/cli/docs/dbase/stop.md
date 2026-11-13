## dbase-stop

Stops the DBase local development stack.

Requires `supabase/config.toml` to be created in your current working directory by running `dbase init`.

All Docker resources are maintained across restarts. Use `--no-backup` flag to reset your local development data between restarts.

Use the `--all` flag to stop all local DBase projects instances on the machine. Use with caution with `--no-backup` as it will delete all DBase local projects data.
