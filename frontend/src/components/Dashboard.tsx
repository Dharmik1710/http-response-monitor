import { usePings } from "../hooks/usePings";
import { useSSE } from "../hooks/useSSE";
import { StatusBadge } from "./StatusBadge";
import { PingTable } from "./PingTable";
import { Pagination } from "./Pagination";

export function Dashboard() {
  const {
    pings,
    total,
    offset,
    limit,
    loading,
    error,
    nextPage,
    prevPage,
    prepend,
  } = usePings();

  const sseStatus = useSSE((ping) => {
    if (offset === 0) prepend(ping);
  });

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>HTTP Response Monitor</h1>
          <p className="subtitle">Real-time httpbin ping dashboard</p>
        </div>
        <StatusBadge status={sseStatus} />
      </header>

      {error && <div className="error-banner">{error}</div>}

      <PingTable pings={pings} loading={loading} />

      <Pagination
        offset={offset}
        limit={limit}
        total={total}
        onNext={nextPage}
        onPrev={prevPage}
      />
    </div>
  );
}
