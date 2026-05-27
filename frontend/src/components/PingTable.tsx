import { useState } from "react";
import type { PingRecord } from "../types";

type Props = {
  pings: PingRecord[];
  loading: boolean;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
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
        <td>{formatDate(ping.createdAt)}</td>
        <td>{formatTime(ping.createdAt)}</td>
        <td className="expand-icon">{expanded ? "▾" : "▸"}</td>
      </tr>
      {expanded && (
        <tr className={`detail-row ${ping.success ? "" : "detail-row-error"}`}>
          <td colSpan={6}>
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
            <th>Date</th>
            <th>Time</th>
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
