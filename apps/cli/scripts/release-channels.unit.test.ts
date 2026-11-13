import { describe, expect, test } from "vitest";
import {
  channelForTag,
  homebrewClassName,
  homebrewConflictsLine,
  isInChannelHistory,
  isPublishableNpmTag,
  releaseBranchForTag,
  releaseTypeBetween,
} from "./release-channels.ts";

describe("isPublishableNpmTag", () => {
  test.each(["latest", "beta", "next", "alpha", "v2.stable", "v10.stable"])("accepts %s", (tag) => {
    expect(isPublishableNpmTag(tag)).toBe(true);
  });

  test.each(["stable", "v2.x", "2.stable", "v0.stable", "next.1", "v2.stable.1", ""])(
    "rejects %j",
    (tag) => {
      expect(isPublishableNpmTag(tag)).toBe(false);
    },
  );
});

describe("homebrewClassName", () => {
  test.each([
    ["dbase", "Dbase"],
    ["dbase-beta", "DbaseBeta"],
    ["dbase-shim-poc", "DbaseShimPoc"],
    ["dbase@2", "DbaseAT2"],
    ["dbase@10", "DbaseAT10"],
  ])("%s -> %s", (name, expected) => {
    expect(homebrewClassName(name)).toBe(expected);
  });
});

describe("homebrewConflictsLine", () => {
  test.each(["dbase@2", "dbase@10"])("%s conflicts with the unversioned formula", (name) => {
    expect(homebrewConflictsLine(name)).toBe(
      '  conflicts_with "dbase", because: "both install a `dbase` binary"',
    );
  });

  test.each(["dbase", "dbase-beta", "dbase-shim-poc"])("%s declares no conflict", (name) => {
    expect(homebrewConflictsLine(name)).toBeUndefined();
  });
});

describe("releaseBranchForTag", () => {
  test.each([
    ["v3.0.0-beta.1", false, "develop"],
    ["v3.0.0-beta.1", true, "develop"],
    ["v3.0.0-next.4", false, "next"],
    ["v2.99.0-alpha.1", false, "main"],
    ["v3.0.0", true, "main"],
    ["v2.151.1", true, "main"],
    ["v2.151.1", false, "v2.x"],
    ["v10.2.0", false, "v10.x"],
  ])("%s (onMain=%s) -> %s", (tag, onMain, expected) => {
    expect(releaseBranchForTag(tag, onMain)).toBe(expected);
  });
});

describe("channelForTag", () => {
  test.each([
    ["v3.0.0-beta.1", "beta"],
    ["v3.0.0-next.4", "next"],
    ["v2.99.0-alpha.1", "alpha"],
    ["v2.151.1", "latest"],
  ])("%s -> %s", (tag, expected) => {
    expect(channelForTag(tag)).toBe(expected);
  });
});

describe("isInChannelHistory", () => {
  test.each([
    ["v3.1.0-beta.1", "beta", true],
    ["v3.0.0", "beta", true],
    ["v3.1.0-next.1", "beta", false],
    ["v2.99.0-alpha.1", "beta", false],
    ["v3.1.0-next.1", "next", true],
    ["v3.0.0", "next", true],
    ["v3.1.0-beta.1", "next", false],
    ["v2.99.0-alpha.1", "next", false],
    ["v3.0.0", "latest", true],
    ["v2.151.1", "latest", true],
    ["v3.1.0-beta.1", "latest", false],
    ["v3.1.0-next.1", "latest", false],
    ["v2.99.0-alpha.1", "latest", false],
    ["config-v1.2.0", "latest", false],
    ["apps/cli-go/pkg/v1.0.0", "latest", false],
    ["config-v1.2.0", "beta", false],
  ] as const)("%s in the %s history -> %s", (tag, channel, expected) => {
    expect(isInChannelHistory(tag, channel)).toBe(expected);
  });
});

describe("releaseTypeBetween", () => {
  test.each([
    ["2.122.0", "2.122.1", "patch"],
    ["2.122.1", "2.123.0", "minor"],
    ["2.123.4", "3.0.0", "major"],
    ["3.1.0-beta.4", "3.1.0-beta.5", "patch"],
    ["3.0.0", "3.1.0-beta.1", "minor"],
    ["2.151.0", "3.0.0-beta.1", "major"],
    [undefined, "3.0.0", null],
    ["2.122.1", "2.122.1", null],
    ["2.122.1", "2.122.0", null],
    ["3.1.0", "2.151.0", null],
    ["3.1.0-beta.5", "3.1.0-beta.4", null],
    ["3.1.0", "3.1.0-beta.1", null],
  ] as const)("%s -> %s requires %s", (lastVersion, version, expected) => {
    expect(releaseTypeBetween(lastVersion, version)).toBe(expected);
  });
});
