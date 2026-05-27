import { useState, useEffect, useCallback } from "react";
import type { PingRecord } from "../types";
import { fetchPings } from "../api/client";

export function usePings() {
  const [pings, setPings] = useState<PingRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;

  const load = useCallback(async (newOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPings(newOffset);
      setPings(res.data);
      setTotal(res.total);
      setOffset(newOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  const nextPage = () => {
    if (offset + limit < total) load(offset + limit);
  };

  const prevPage = () => {
    if (offset > 0) load(Math.max(0, offset - limit));
  };

  const prepend = (ping: PingRecord) => {
    setPings((prev) => [ping, ...prev.slice(0, limit - 1)]);
    setTotal((prev) => prev + 1);
  };

  return {
    pings,
    total,
    offset,
    limit,
    loading,
    error,
    nextPage,
    prevPage,
    prepend,
    reload: () => load(offset),
  };
}
