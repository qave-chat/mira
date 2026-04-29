import { describe, expect, it } from "vitest";
import { cn } from "./cn.util.ts";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("filters falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("applies conditional object syntax", () => {
    expect(cn("a", { b: true, c: false })).toBe("a b");
  });

  it("flattens arrays", () => {
    expect(cn(["a", ["b", "c"]])).toBe("a b c");
  });

  it("merges conflicting tailwind classes, keeping the last", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("returns an empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});
