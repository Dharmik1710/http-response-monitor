import type { PingsResponse } from "../types";

const BASE = "/api";

export async function fetchPings(offset = 0): Promise<PingsResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/responses?offset=${offset}`);
  } catch {
    throw new Error("Unable to reach the server. Check if the backend is running.");
  }
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}: failed to load ping history.`);
  }
  return res.json();
}

export async function fetchHealth(): Promise<{ ok: boolean; db: string }> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/health`);
  } catch {
    throw new Error("Unable to reach the server. Check if the backend is running.");
  }
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}: health check failed.`);
  }
  return res.json();
}
