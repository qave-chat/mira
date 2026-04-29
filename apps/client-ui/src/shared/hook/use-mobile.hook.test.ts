import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "./use-mobile.hook.ts";

type Listener = () => void;

function stubMatchMedia(initialWidth: number) {
  const listeners = new Set<Listener>();
  window.innerWidth = initialWidth;
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: window.innerWidth < 768,
    media: query,
    addEventListener: (_: string, cb: Listener) => listeners.add(cb),
    removeEventListener: (_: string, cb: Listener) => listeners.delete(cb),
    dispatchEvent: () => false,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
  }));
  return {
    resize(width: number) {
      window.innerWidth = width;
      for (const l of listeners) l();
    },
    listenerCount: () => listeners.size,
  };
}

describe("useIsMobile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true below the 768px breakpoint", () => {
    stubMatchMedia(500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false at or above 768px", () => {
    stubMatchMedia(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("updates when the media query fires a change", () => {
    const mql = stubMatchMedia(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => mql.resize(400));
    expect(result.current).toBe(true);
  });

  it("removes its listener on unmount", () => {
    const mql = stubMatchMedia(1024);
    const { unmount } = renderHook(() => useIsMobile());
    expect(mql.listenerCount()).toBe(1);
    unmount();
    expect(mql.listenerCount()).toBe(0);
  });
});
