import { useEffect, useRef, useState } from "react";
import type { PingRecord } from "../types";

type SSEStatus = "connecting" | "connected" | "disconnected";

export function useSSE(onMessage: (ping: PingRecord) => void) {
  const [status, setStatus] = useState<SSEStatus>("connecting");
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    const source = new EventSource("/api/events");

    source.onopen = () => setStatus("connected");

    source.onmessage = (event) => {
      try {
        const ping: PingRecord = JSON.parse(event.data);
        callbackRef.current(ping);
      } catch {
        // ignore malformed events
      }
    };

    source.onerror = () => {
      setStatus("disconnected");
    };

    return () => {
      source.close();
      setStatus("disconnected");
    };
  }, []);

  return status;
}
