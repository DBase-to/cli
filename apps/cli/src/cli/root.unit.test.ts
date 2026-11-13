import { describe, expect, it } from "vitest";
import { rootDescription } from "./root.ts";

describe("rootDescription", () => {
  it("leaves stable releases unlabeled", () => {
    expect(rootDescription("3.0.0")).toBe("DBase CLI.");
  });

  it.each([
    ["3.0.0-beta.12", "DBase CLI (beta channel)."],
    ["3.0.0-next.4", "DBase CLI (next channel)."],
    ["0.0.0-pr.1234", "DBase CLI (preview build)."],
    ["0.0.0-dev", "DBase CLI (development build)."],
    ["0.0.0-automated", "DBase CLI (development build)."],
  ])("labels %j as %j", (version, expected) => {
    expect(rootDescription(version)).toBe(expected);
  });
});
