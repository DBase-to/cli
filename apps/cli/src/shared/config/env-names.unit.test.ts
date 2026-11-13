import { describe, expect, it } from "vitest";
import { Option } from "effect";
import { readEnvBoth, readNonEmptyEnvBoth } from "./env-names.ts";

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
