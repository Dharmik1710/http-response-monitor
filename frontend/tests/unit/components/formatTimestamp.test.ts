import { describe, it, expect } from "vitest";
import { formatTimestamp } from "../../../src/components/PingTable";

describe("formatTimestamp", () => {
  it("returns a formatted string with year, month, day, and time", () => {
    const result = formatTimestamp("2026-01-15T14:30:45.000Z");
    expect(result).toContain("2026");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
  });

  it("handles different months", () => {
    const result = formatTimestamp("2026-06-15T12:00:00.000Z");
    expect(result).toContain("Jun");
  });

  it("returns a non-empty string for valid ISO input", () => {
    const result = formatTimestamp("2026-12-31T23:59:59.999Z");
    expect(result.length).toBeGreaterThan(0);
  });
});
