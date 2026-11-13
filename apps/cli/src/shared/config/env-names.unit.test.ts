import { describe, expect, it } from "vitest";
import { ConfigProvider, Effect, Option } from "effect";
import {
  configOptionBoth,
  configStringBoth,
  readEnvBoth,
  readNonEmptyConfigBoth,
  readNonEmptyEnvBoth,
} from "./env-names.ts";

describe("readEnvBoth", () => {
  it("prefers DBASE_* over SUPABASE_*", () => {
    expect(
      readEnvBoth(
        { DBASE_API_URL: "https://dbase.example", SUPABASE_API_URL: "https://s.example" },
        "DBASE_API_URL",
        "SUPABASE_API_URL",
      ),
    ).toEqual(Option.some("https://dbase.example"));
  });

  it("falls back to SUPABASE_* when DBASE_* is unset", () => {
    expect(
      readEnvBoth({ SUPABASE_API_URL: "https://s.example" }, "DBASE_API_URL", "SUPABASE_API_URL"),
    ).toEqual(Option.some("https://s.example"));
  });

  it("returns none when neither is set", () => {
    expect(readEnvBoth({}, "DBASE_API_URL", "SUPABASE_API_URL")).toEqual(Option.none());
  });

  it("counts an empty DBASE_* as set (mirrors readEnv)", () => {
    // A present-but-empty DBASE_* wins over SUPABASE_*, exactly like a
    // present-but-empty SUPABASE_* resolves to Some("") today.
    expect(
      readEnvBoth(
        { DBASE_API_URL: "", SUPABASE_API_URL: "https://s.example" },
        "DBASE_API_URL",
        "SUPABASE_API_URL",
      ),
    ).toEqual(Option.some(""));
  });
});

describe("readNonEmptyEnvBoth", () => {
  it("prefers DBASE_* over SUPABASE_*", () => {
    expect(
      readNonEmptyEnvBoth(
        {
          DBASE_TELEMETRY_POSTHOG_HOST: "https://d.example",
          SUPABASE_TELEMETRY_POSTHOG_HOST: "https://s.example",
        },
        "DBASE_TELEMETRY_POSTHOG_HOST",
        "SUPABASE_TELEMETRY_POSTHOG_HOST",
      ),
    ).toEqual(Option.some("https://d.example"));
  });

  it("falls back to SUPABASE_* when DBASE_* is unset", () => {
    expect(
      readNonEmptyEnvBoth(
        { SUPABASE_TELEMETRY_POSTHOG_HOST: "https://s.example" },
        "DBASE_TELEMETRY_POSTHOG_HOST",
        "SUPABASE_TELEMETRY_POSTHOG_HOST",
      ),
    ).toEqual(Option.some("https://s.example"));
  });

  it("treats an empty DBASE_* as unset (mirrors nonEmptyString)", () => {
    expect(
      readNonEmptyEnvBoth(
        { DBASE_TELEMETRY_POSTHOG_HOST: "", SUPABASE_TELEMETRY_POSTHOG_HOST: "https://s.example" },
        "DBASE_TELEMETRY_POSTHOG_HOST",
        "SUPABASE_TELEMETRY_POSTHOG_HOST",
      ),
    ).toEqual(Option.some("https://s.example"));
  });

  it("returns none when both are missing or empty", () => {
    expect(
      readNonEmptyEnvBoth({}, "DBASE_TELEMETRY_POSTHOG_HOST", "SUPABASE_TELEMETRY_POSTHOG_HOST"),
    ).toEqual(Option.none());
    expect(
      readNonEmptyEnvBoth(
        { DBASE_TELEMETRY_POSTHOG_HOST: "", SUPABASE_TELEMETRY_POSTHOG_HOST: "" },
        "DBASE_TELEMETRY_POSTHOG_HOST",
        "SUPABASE_TELEMETRY_POSTHOG_HOST",
      ),
    ).toEqual(Option.none());
  });
});

describe("Config twins", () => {
  const provider = (record: Readonly<Record<string, string>>) =>
    ConfigProvider.fromEnvRecord(record);

  it("configStringBoth prefers DBASE_* over SUPABASE_*", () => {
    const value = Effect.runSync(
      configStringBoth("DBASE_API_URL", "SUPABASE_API_URL").parse(
        provider({ DBASE_API_URL: "https://dbase.example", SUPABASE_API_URL: "https://s.example" }),
      ),
    );
    expect(value).toBe("https://dbase.example");
  });

  it("configOptionBoth falls back to SUPABASE_* and returns none when both are unset", () => {
    expect(
      Effect.runSync(
        configOptionBoth("DBASE_PROFILE", "SUPABASE_PROFILE").parse(
          provider({ SUPABASE_PROFILE: "staging" }),
        ),
      ),
    ).toEqual(Option.some("staging"));
    expect(
      Effect.runSync(configOptionBoth("DBASE_PROFILE", "SUPABASE_PROFILE").parse(provider({}))),
    ).toEqual(Option.none());
  });

  it("readNonEmptyConfigBoth lets an empty DBASE_* fall through to SUPABASE_*", () => {
    expect(
      Effect.runSync(
        readNonEmptyConfigBoth(
          provider({
            DBASE_TELEMETRY_POSTHOG_HOST: "",
            SUPABASE_TELEMETRY_POSTHOG_HOST: "https://s.example",
          }),
          "DBASE_TELEMETRY_POSTHOG_HOST",
          "SUPABASE_TELEMETRY_POSTHOG_HOST",
        ),
      ),
    ).toEqual(Option.some("https://s.example"));
    expect(
      Effect.runSync(
        readNonEmptyConfigBoth(
          provider({ DBASE_TELEMETRY_POSTHOG_HOST: "https://d.example" }),
          "DBASE_TELEMETRY_POSTHOG_HOST",
          "SUPABASE_TELEMETRY_POSTHOG_HOST",
        ),
      ),
    ).toEqual(Option.some("https://d.example"));
  });
});
