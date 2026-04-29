import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useHealthStatus } from "./use-health-status.hook";

type HealthResult =
  | { _tag: "Initial"; waiting: boolean }
  | { _tag: "Success"; waiting: boolean; value: unknown; timestamp: number }
  | { _tag: "Failure"; waiting: boolean; cause: unknown; previousSuccess: unknown };

const mocks = vi.hoisted<{
  atom: object;
  refresh: ReturnType<typeof vi.fn>;
  result: HealthResult;
}>(() => ({
  atom: {},
  refresh: vi.fn(),
  result: { _tag: "Initial", waiting: false },
}));

vi.mock("@mira/client-api/http-atom", () => ({
  HttpClient: {
    query: vi.fn(() => mocks.atom),
  },
}));

vi.mock("@effect/atom-react", () => ({
  useAtomRefresh: vi.fn((atom) => {
    expect(atom).toBe(mocks.atom);
    return mocks.refresh;
  }),
  useAtomValue: vi.fn((atom) => {
    expect(atom).toBe(mocks.atom);
    return mocks.result;
  }),
}));

describe("useHealthStatus", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mocks.result = { _tag: "Initial", waiting: false };
  });

  it("returns loading for the initial state", () => {
    const { result } = renderHook(() => useHealthStatus());

    expect(result.current).toBe("loading");
  });

  it("returns ok for a successful health check", () => {
    mocks.result = { _tag: "Success", waiting: false, value: {}, timestamp: 0 };

    const { result } = renderHook(() => useHealthStatus());

    expect(result.current).toBe("ok");
  });

  it("returns down for a failed health check", () => {
    mocks.result = { _tag: "Failure", waiting: false, cause: {}, previousSuccess: {} };

    const { result } = renderHook(() => useHealthStatus());

    expect(result.current).toBe("down");
  });

  it("polls the health query while mounted", () => {
    vi.useFakeTimers();

    const { unmount } = renderHook(() => useHealthStatus());

    vi.advanceTimersByTime(5000);
    expect(mocks.refresh).toHaveBeenCalledTimes(1);

    unmount();
    vi.advanceTimersByTime(5000);
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});
