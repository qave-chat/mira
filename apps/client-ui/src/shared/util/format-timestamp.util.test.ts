import { describe, expect, it } from "vitest";
import { toIso, toLocal } from "./format-timestamp.util.ts";

describe("toIso", () => {
  it("formats the unix epoch", () => {
    expect(toIso(0)).toBe("1970-01-01T00:00:00.000Z");
  });

  it("formats an arbitrary millisecond timestamp", () => {
    expect(toIso(1_700_000_000_000)).toBe("2023-11-14T22:13:20.000Z");
  });

  it("formats timestamps before the epoch", () => {
    expect(toIso(-1000)).toBe("1969-12-31T23:59:59.000Z");
  });
});

describe("toLocal", () => {
  it("returns a non-empty human-readable string containing the year", () => {
    expect(toLocal(1_700_000_000_000)).toMatch(/2023/);
  });

  it("is a different format than the ISO string", () => {
    const ms = 1_700_000_000_000;
    expect(toLocal(ms)).not.toBe(toIso(ms));
  });
});
