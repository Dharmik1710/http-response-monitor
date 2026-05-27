import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PingTable } from "../../../src/components/PingTable";
import type { PingRecord } from "../../../src/types";

const mockPing: PingRecord = {
  id: "abc-123",
  intervalKey: "2026-01-01T00:05:00.000Z",
  createdAt: "2026-01-01T00:05:01.000Z",
  requestPayload: { requestId: "test", category: "info", value: 42 },
  responseStatus: 200,
  responseBody: { data: "echoed" },
  responseBodyTruncated: false,
  latencyMs: 120,
  success: true,
  errorMessage: null,
};

const failedPing: PingRecord = {
  ...mockPing,
  id: "def-456",
  success: false,
  responseStatus: null,
  responseBody: null,
  latencyMs: 0,
  errorMessage: "fetch failed",
};

describe("PingTable", () => {
  it("shows loading state when loading with no data", () => {
    render(<PingTable pings={[]} loading={true} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty state when no pings and not loading", () => {
    render(<PingTable pings={[]} loading={false} />);
    expect(screen.getByText(/No ping data yet/)).toBeInTheDocument();
  });

  it("renders a table with ping data", () => {
    render(<PingTable pings={[mockPing]} loading={false} />);
    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("120ms")).toBeInTheDocument();
  });

  it("renders FAIL pill for failed pings", () => {
    render(<PingTable pings={[failedPing]} loading={false} />);
    expect(screen.getByText("FAIL")).toBeInTheDocument();
  });

  it("expands row on click to show request/response JSON", () => {
    render(<PingTable pings={[mockPing]} loading={false} />);

    expect(screen.queryByText("Request Body")).not.toBeInTheDocument();

    const row = screen.getByText("OK").closest("tr")!;
    fireEvent.click(row);

    expect(screen.getByText("Request Body")).toBeInTheDocument();
    expect(screen.getByText("Response Body")).toBeInTheDocument();
  });

  it("shows error message in expanded failed row", () => {
    render(<PingTable pings={[failedPing]} loading={false} />);

    const row = screen.getByText("FAIL").closest("tr")!;
    fireEvent.click(row);

    expect(screen.getByText(/fetch failed/)).toBeInTheDocument();
    expect(screen.getByText("No response")).toBeInTheDocument();
  });

  it("collapses row on second click", () => {
    render(<PingTable pings={[mockPing]} loading={false} />);

    const row = screen.getByText("OK").closest("tr")!;
    fireEvent.click(row);
    expect(screen.getByText("Request Body")).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.queryByText("Request Body")).not.toBeInTheDocument();
  });
});
