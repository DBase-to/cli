## dbase-domains-activate

Activates the custom hostname configuration for a project.

This reconfigures your DBase project to respond to requests on your custom hostname.

After the custom hostname is activated, your project's third-party auth providers will no longer function on the DBase-provisioned subdomain. Please refer to [Prepare to activate your domain](/docs/guides/platform/custom-domains#prepare-to-activate-your-domain) section in our documentation to learn more about the steps you need to follow.

Asks for confirmation before activating, with a default of No. Pass `--yes` (or set `DBASE_YES` in the shell) to run without a prompt, which JSON output and non-interactive runs require.
