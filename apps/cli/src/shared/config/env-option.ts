import { Config, Effect, Option } from "effect";

/** A variable from the ambient config provider; unset or unreadable is none. */
const envOption = (name: string): Effect.Effect<Option.Option<string>> =>
  Config.option(Config.String(name)).pipe(Effect.orElseSucceed(() => Option.none<string>()));

export const envValue = (name: string): Effect.Effect<string | undefined> =>
  Effect.map(envOption(name), Option.getOrUndefined);

/** `DBASE_*` first, then the legacy `SUPABASE_*` name. */
export const envOptionBoth = (
  dbaseName: string,
  supabaseName: string,
): Effect.Effect<Option.Option<string>> =>
  envOption(dbaseName).pipe(
    Effect.flatMap((value) =>
      Option.isSome(value) ? Effect.succeed(value) : envOption(supabaseName),
    ),
  );

export const envValueBoth = (
  dbaseName: string,
  supabaseName: string,
): Effect.Effect<string | undefined> =>
  Effect.map(envOptionBoth(dbaseName, supabaseName), Option.getOrUndefined);
