import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePings } from "../../../src/hooks/usePings";

const mockPings = Array.from({ length: 20 }, (_, i) => ({
  id: `ping-${i}`,
  intervalKey: `2026-01-01T00:${String(i * 5).padStart(2, "0")}:00.000Z`,
  createdAt: `2026-01-01T00:${String(i * 5).padStart(2, "0")}:01.000Z`,
  requestPayload: { value: i },
  responseStatus: 200,
  responseBody: {},
  responseBodyTruncated: false,
  latencyMs: 100 + i,
  success: true,
  errorMessage: null,
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPings, total: 25, limit: 20, offset: 0 }),
      })
    )
  );
});

describe("usePings", () => {
  it("fetches pings on mount", async () => {
    const { result } = renderHook(() => usePings());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.pings).toHaveLength(20);
    expect(result.current.total).toBe(25);
    expect(result.current.offset).toBe(0);
  });

  it("prepends a new ping and drops the last one", async () => {
    const { result } = renderHook(() => usePings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newPing = { ...mockPings[0], id: "new-ping" };
    act(() => result.current.prepend(newPing));

    expect(result.current.pings[0].id).toBe("new-ping");
    expect(result.current.pings).toHaveLength(20);
    expect(result.current.total).toBe(26);
  });

  it("handles fetch error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => usePings());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Unable to reach the server. Check if the backend is running.");
    expect(result.current.pings).toHaveLength(0);
  });
});
