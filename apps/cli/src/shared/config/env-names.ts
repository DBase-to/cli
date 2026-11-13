import { Config, ConfigProvider, Effect, Option } from "effect";

/**
 * Tier 2-B env migration: every `SUPABASE_*` shell/project env var gains a
 * `DBASE_*` twin. The `DBASE_*` name is primary; the `SUPABASE_*` name stays
 * as a fallback (accept-both, not rename — zero-breakage migration).
 *
 * Precedence is always `DBASE_*` first, `SUPABASE_*` second, and the
 * `SUPABASE_*` name stays in code as the fallback argument so the remaining
 * legacy references stay grep-able for the Tier-4 cleanup.
 *
 * Empty-string semantics mirror the existing per-site helpers exactly:
 * - {@link readEnvBoth} counts empty as SET (matches `readEnv` in
 *   `cli-settings.layer.ts`: `value === undefined ? none : some(value)`).
 *   A present-but-empty `DBASE_*` therefore wins over `SUPABASE_*`.
 * - {@link readNonEmptyEnvBoth} counts empty as UNSET (matches
 *   `nonEmptyString` in `posthog-config.ts`). A present-but-empty `DBASE_*`
 *   falls through to `SUPABASE_*`.
 *
 * These helpers twin env NAMES only. Default values, value parsing, and
 * enablement semantics are owned by each call site and unchanged here.
 * `DO_NOT_TRACK` intentionally has no twin (cross-tool standard).
 */
export function readEnvBoth(
  env: Readonly<Record<string, string | undefined>>,
  dbaseKey: string,
  supabaseKey: string,
): Option.Option<string> {
  const dbase = env[dbaseKey];
  if (dbase !== undefined) return Option.some(dbase);
  const supabase = env[supabaseKey];
  return supabase === undefined ? Option.none() : Option.some(supabase);
}

/**
 * `DBASE_*`-first twin of `posthog-config.ts`'s `readNonEmptyEnv`: the first
 * non-empty value wins, else `None`.
 */
export function readNonEmptyEnvBoth(
  env: Readonly<Record<string, string | undefined>>,
  dbaseKey: string,
  supabaseKey: string,
): Option.Option<string> {
  const dbase = env[dbaseKey];
  if (dbase !== undefined && dbase !== "") return Option.some(dbase);
  const supabase = env[supabaseKey];
  return supabase === undefined || supabase === "" ? Option.none() : Option.some(supabase);
}

/** Effect `Config` twin: `DBASE_*` first, else `SUPABASE_*`. */
export const configStringBoth = (dbaseKey: string, supabaseKey: string) =>
  Config.String(dbaseKey).pipe(Config.orElse(() => Config.String(supabaseKey)));

/** Optional Effect `Config` twin: `DBASE_*` first, else `SUPABASE_*`. */
export const configOptionBoth = (dbaseKey: string, supabaseKey: string) =>
  Config.option(Config.String(dbaseKey)).pipe(
    Config.flatMap((value) =>
      Option.isSome(value) ? Config.succeed(value) : Config.option(Config.String(supabaseKey)),
    ),
  );

/** Non-empty Effect `Config` twin: an empty `DBASE_*` falls through to `SUPABASE_*`. */
export const readNonEmptyConfigBoth = (
  provider: ConfigProvider.ConfigProvider,
  dbaseKey: string,
  supabaseKey: string,
): Effect.Effect<Option.Option<string>, Config.ConfigError> =>
  Effect.gen(function* () {
    const dbase = yield* Config.option(Config.String(dbaseKey)).parse(provider);
    if (Option.isSome(dbase) && dbase.value !== "") return dbase;
    const supabase = yield* Config.option(Config.String(supabaseKey)).parse(provider);
    return Option.filter(supabase, (value) => value !== "");
  });
