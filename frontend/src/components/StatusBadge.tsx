type Props = {
  status: "connecting" | "connected" | "disconnected";
};

const labels: Record<Props["status"], string> = {
  connecting: "Connecting...",
  connected: "Live",
  disconnected: "Disconnected",
};

const colors: Record<Props["status"], string> = {
  connecting: "#f59e0b",
  connected: "#22c55e",
  disconnected: "#ef4444",
};

export function StatusBadge({ status }: Props) {
  return (
    <span className="status-badge" style={{ color: colors[status] }}>
      <span
        className="status-dot"
        style={{ backgroundColor: colors[status] }}
      />
      {labels[status]}
    </span>
  );
}
