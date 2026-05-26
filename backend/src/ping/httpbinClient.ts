/** Successful ping result from httpbin. */
export type PingSuccess = {
  ok: true;
  /** HTTP status code returned by httpbin */
  status: number;
  /** Parsed JSON response body */
  body: Record<string, unknown>;
  /** Round-trip latency in milliseconds */
  latencyMs: number;
};

/** Failed ping result — network, timeout, or unexpected response. */
export type PingFailure = {
  ok: false;
  errorKind: "timeout" | "network" | "http" | "parse";
  /** HTTP status if a response was received */
  status?: number;
  message: string;
  /** Latency up to the point of failure, if measurable */
  latencyMs?: number;
};

/** Discriminated union returned by {@link pingHttpbin}. Never throws. */
export type PingResult = PingSuccess | PingFailure;

/**
 * POSTs the given payload to httpbin and returns a typed result.
 *
 * TODO: Implement HTTP call.
 * - Timeout: 10 s hard cap
 * - Retry: 1 retry on network/timeout only (not 4xx/5xx)
 * - Measure latency with performance.now()
 * - Return discriminated union, never throw
 *
 * @param url - The httpbin endpoint URL
 * @param payload - JSON body to POST
 * @returns Typed success or failure result
 */
export async function pingHttpbin(
  _url: string,
  _payload: Record<string, unknown>
): Promise<PingResult> {
  throw new Error("Not implemented");
}
