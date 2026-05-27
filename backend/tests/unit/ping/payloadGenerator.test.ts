import { describe, it, expect } from "vitest";
import { generatePayload } from "../../../src/ping/payloadGenerator";

describe("generatePayload", () => {
  it("returns an object with all required fields", () => {
    const payload = generatePayload();

    expect(payload).toHaveProperty("requestId");
    expect(payload).toHaveProperty("timestamp");
    expect(payload).toHaveProperty("value");
    expect(payload).toHaveProperty("message");
    expect(payload).toHaveProperty("category");
    expect(payload).toHaveProperty("metrics");
  });

  it("returns a valid UUID for requestId", () => {
    const payload = generatePayload();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(payload.requestId).toMatch(uuidRegex);
  });

  it("returns a valid ISO timestamp", () => {
    const payload = generatePayload();
    const parsed = Date.parse(payload.timestamp as string);
    expect(parsed).not.toBeNaN();
  });

  it("returns a numeric value between 0 and 1000", () => {
    const payload = generatePayload();
    expect(typeof payload.value).toBe("number");
    expect(payload.value as number).toBeGreaterThanOrEqual(0);
    expect(payload.value as number).toBeLessThanOrEqual(1000);
  });

  it("returns a valid category", () => {
    const payload = generatePayload();
    expect(["info", "warning", "error", "debug"]).toContain(payload.category);
  });

  it("returns metrics as an object with latency and uptime", () => {
    const payload = generatePayload();
    const metrics = payload.metrics as Record<string, unknown>;
    expect(typeof metrics.latency).toBe("number");
    expect(typeof metrics.uptime).toBe("number");
  });

  it("generates unique requestIds across calls", () => {
    const ids = new Set(
      Array.from({ length: 10 }, () => generatePayload().requestId)
    );
    expect(ids.size).toBe(10);
  });
});
