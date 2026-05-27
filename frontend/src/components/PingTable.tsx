import { useState } from "react";
import type { PingRecord } from "../types";

type Props = {
  pings: PingRecord[];
  loading: boolean;
};

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function PingRow({ ping }: { ping: PingRecord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className={`ping-row ${ping.success ? "" : "row-error"}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td>
          <span className={`pill ${ping.success ? "pill-success" : "pill-error"}`}>
            {ping.success ? "OK" : "FAIL"}
          </span>
        </td>
        <td>{ping.responseStatus ?? "—"}</td>
        <td>{ping.latencyMs != null ? `${ping.latencyMs}ms` : "—"}</td>
        <td>{formatTimestamp(ping.createdAt)}</td>
        <td className="expand-icon">{expanded ? "▾" : "▸"}</td>
      </tr>
      {expanded && (
        <tr className={`detail-row ${ping.success ? "" : "detail-row-error"}`}>
          <td colSpan={5}>
            {!ping.success && ping.errorMessage && (
              <div className="detail-error">
                <strong>Error:</strong> {ping.errorMessage}
              </div>
            )}
            <div className="detail-grid">
              <div className="detail-section">
                <h4>Request Body</h4>
                <pre>{JSON.stringify(ping.requestPayload, null, 2)}</pre>
              </div>
              <div className="detail-section">
                <h4>Response Body</h4>
                <pre>
                  {ping.responseBody
                    ? JSON.stringify(ping.responseBody, null, 2)
                    : "No response"}
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function PingTable({ pings, loading }: Props) {
  if (loading && pings.length === 0) {
    return <div className="table-empty">Loading...</div>;
  }

  if (pings.length === 0) {
    return <div className="table-empty">No ping data yet. Waiting for first ping...</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="ping-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>HTTP Code</th>
            <th>Latency</th>
            <th>Timestamp</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pings.map((ping) => (
            <PingRow key={ping.id} ping={ping} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
