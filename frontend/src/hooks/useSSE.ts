import { useEffect, useRef, useState } from "react";
import type { PingRecord } from "../types";
import { apiUrl } from "../config";

type SSEStatus = "connecting" | "connected" | "disconnected";

export function useSSE(onMessage: (ping: PingRecord) => void) {
  const [status, setStatus] = useState<SSEStatus>("connecting");
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    let closed = false;
    const source = new EventSource(apiUrl("/api/events"));

    source.onopen = () => {
      if (!closed) setStatus("connected");
    };

    source.onmessage = (event) => {
      if (!closed) setStatus("connected");
      try {
        const ping: PingRecord = JSON.parse(event.data);
        callbackRef.current(ping);
      } catch {
        // ignore malformed events
      }
    };

    source.onerror = () => {
      if (closed) return;
      if (source.readyState === EventSource.CLOSED) {
        setStatus("disconnected");
      } else {
        setStatus("connecting");
      }
    };

    return () => {
      closed = true;
      source.close();
    };
  }, []);

  return status;
}
