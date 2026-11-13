import { Config, ConfigProvider, Effect, Layer, Option, Path, Redacted } from "effect";
import { configOptionBoth, configStringBoth } from "./env-names.ts";
import { resolveSupabaseHomeValue } from "./supabase-home.ts";
import { RuntimeInfo } from "../runtime/runtime-info.service.ts";
import { resolvePosthogConfig } from "../telemetry/posthog-config.ts";
import { CliSettings } from "./cli-settings.service.ts";
import { CliProjectContext } from "./cli-project-context.service.ts";

const SUPABASE_API_URL = "https://api.dbase.to";
const SUPABASE_DASHBOARD_URL = "https://dbase.to";
const SUPABASE_PROJECT_HOST = "dbase.to";

const makeCliSettings = Effect.gen(function* () {
  const path = yield* Path.Path;
  const runtimeInfo = yield* RuntimeInfo;
  const cliProjectContext = yield* CliProjectContext;
  const ambientProvider = yield* ConfigProvider.ConfigProvider;
  const provider = Option.match(cliProjectContext.projectEnv, {
    onNone: () => ambientProvider,
    onSome: (projectEnv) =>
      ConfigProvider.fromEnvRecord(projectEnv.values, { preserveEmptyStrings: true }).pipe(
        ConfigProvider.orElse(ambientProvider),
      ),
  });
  const read = <A>(config: Config.Config<A>) => config.parse(provider);
  const posthogConfig = yield* resolvePosthogConfig(provider);
  const supabaseHome = yield* read(configOptionBoth("DBASE_HOME", "SUPABASE_HOME"));

  return CliSettings.of({
    apiUrl: yield* read(
      configStringBoth("DBASE_API_URL", "SUPABASE_API_URL").pipe(
        Config.withDefault(SUPABASE_API_URL),
      ),
    ),
    dashboardUrl: yield* read(
      configStringBoth("DBASE_DASHBOARD_URL", "SUPABASE_DASHBOARD_URL").pipe(
        Config.withDefault(SUPABASE_DASHBOARD_URL),
      ),
    ),
    projectHost: yield* read(
      configStringBoth("DBASE_PROJECT_HOST", "SUPABASE_PROJECT_HOST").pipe(
        Config.withDefault(SUPABASE_PROJECT_HOST),
      ),
    ),
    telemetryPosthogHost: posthogConfig.host,
    telemetryPosthogKey: posthogConfig.key,
    accessToken: Option.map(
      yield* read(configOptionBoth("DBASE_ACCESS_TOKEN", "SUPABASE_ACCESS_TOKEN")),
      (token) => Redacted.make(token, { label: "DBASE_ACCESS_TOKEN" }),
    ),
    noKeyring: yield* read(configOptionBoth("DBASE_NO_KEYRING", "SUPABASE_NO_KEYRING")),
    supabaseHome: resolveSupabaseHomeValue(path, supabaseHome, runtimeInfo.homeDir),
    debug: yield* read(configOptionBoth("DBASE_DEBUG", "SUPABASE_DEBUG")),
    telemetryDebug: yield* read(
      configOptionBoth("DBASE_TELEMETRY_DEBUG", "SUPABASE_TELEMETRY_DEBUG"),
    ),
    telemetryDisabled: yield* read(
      configOptionBoth("DBASE_TELEMETRY_DISABLED", "SUPABASE_TELEMETRY_DISABLED"),
    ),
    doNotTrack: yield* read(Config.option(Config.String("DO_NOT_TRACK"))),
  });
});

export const cliSettingsLayer = Layer.effect(
  CliSettings,
  makeCliSettings.pipe(Effect.withSpan("CliSettings.load")),
);
