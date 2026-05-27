import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeIntervalKey } from "../../../src/ping/runPingTick";

vi.mock("../../../src/ping/payloadGenerator", () => ({
  generatePayload: vi.fn(() => ({ requestId: "test-id", value: 42 })),
}));

vi.mock("../../../src/ping/httpbinClient", () => ({
  pingHttpbin: vi.fn(),
}));

vi.mock("../../../src/db/pingRepository", () => ({
  insertPing: vi.fn(),
}));

vi.mock("../../../src/realtime/publisher", () => ({
  publishPing: vi.fn(),
}));

vi.mock("../../../src/config", () => ({
  config: {
    httpbinUrl: "https://httpbin.org/anything",
    pingIntervalMs: 300_000,
  },
}));

vi.mock("../../../src/config/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { runPingTick } from "../../../src/ping/runPingTick";
import { pingHttpbin } from "../../../src/ping/httpbinClient";
import { insertPing } from "../../../src/db/pingRepository";
import { publishPing } from "../../../src/realtime/publisher";

describe("computeIntervalKey", () => {
  it("floors to the nearest interval bucket", () => {
    const intervalMs = 300_000; // 5 minutes
    const timestamp = new Date("2026-01-01T00:07:30.000Z").getTime();
    vi.spyOn(Date, "now").mockReturnValue(timestamp);

    const key = computeIntervalKey(intervalMs);

    expect(key).toEqual(new Date("2026-01-01T00:05:00.000Z"));
    vi.restoreAllMocks();
  });

  it("returns exact time when on boundary", () => {
    const intervalMs = 300_000;
    const timestamp = new Date("2026-01-01T00:10:00.000Z").getTime();
    vi.spyOn(Date, "now").mockReturnValue(timestamp);

    const key = computeIntervalKey(intervalMs);

    expect(key).toEqual(new Date("2026-01-01T00:10:00.000Z"));
    vi.restoreAllMocks();
  });

  it("works with sub-minute intervals", () => {
    const intervalMs = 10_000; // 10 seconds
    const timestamp = new Date("2026-01-01T00:00:13.500Z").getTime();
    vi.spyOn(Date, "now").mockReturnValue(timestamp);

    const key = computeIntervalKey(intervalMs);

    expect(key).toEqual(new Date("2026-01-01T00:00:10.000Z"));
    vi.restoreAllMocks();
  });
});

describe("runPingTick", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts and publishes on successful ping", async () => {
    const mockRecord = { id: "abc-123", success: true, latencyMs: 100 };

    vi.mocked(pingHttpbin).mockResolvedValue({
      status: 200,
      body: { data: "test" },
      latencyMs: 100,
      success: true,
      errorMessage: null,
    });
    vi.mocked(insertPing).mockResolvedValue(mockRecord as any);
    vi.mocked(publishPing).mockResolvedValue();

    await runPingTick();

    expect(insertPing).toHaveBeenCalledOnce();
    expect(publishPing).toHaveBeenCalledWith("abc-123");
  });

  it("skips publish when insert returns null (duplicate)", async () => {
    vi.mocked(pingHttpbin).mockResolvedValue({
      status: 200,
      body: {},
      latencyMs: 50,
      success: true,
      errorMessage: null,
    });
    vi.mocked(insertPing).mockResolvedValue(null);

    await runPingTick();

    expect(publishPing).not.toHaveBeenCalled();
  });

  it("does not throw on httpbin failure", async () => {
    vi.mocked(pingHttpbin).mockResolvedValue({
      status: null,
      body: null,
      latencyMs: 0,
      success: false,
      errorMessage: "network error",
    });
    vi.mocked(insertPing).mockResolvedValue({ id: "def-456" } as any);
    vi.mocked(publishPing).mockResolvedValue();

    await expect(runPingTick()).resolves.not.toThrow();
    expect(insertPing).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, errorMessage: "network error" })
    );
  });
});
