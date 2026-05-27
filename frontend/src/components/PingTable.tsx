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
            <th>Category</th>
            <th>Date</th>
            <th>Time</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {pings.map((ping) => (
            <tr key={ping.id} className={ping.success ? "" : "row-error"}>
              <td>
                <span className={`pill ${ping.success ? "pill-success" : "pill-error"}`}>
                  {ping.success ? "OK" : "FAIL"}
                </span>
              </td>
              <td>{ping.responseStatus ?? "—"}</td>
              <td>{ping.latencyMs != null ? `${ping.latencyMs}ms` : "—"}</td>
              <td>{(ping.requestPayload?.category as string) ?? "—"}</td>
              <td>{formatDate(ping.createdAt)}</td>
              <td>{formatTime(ping.createdAt)}</td>
              <td className="error-cell">{ping.errorMessage ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
