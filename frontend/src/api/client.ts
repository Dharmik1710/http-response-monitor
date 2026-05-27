import type { PingsResponse } from "../types";

const BASE = "/api";

export async function fetchPings(offset = 0): Promise<PingsResponse> {
  const res = await fetch(`${BASE}/responses?offset=${offset}`);
  if (!res.ok) throw new Error(`Failed to fetch pings: ${res.status}`);
  return res.json();
}

export async function fetchHealth(): Promise<{ ok: boolean; db: string }> {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}
