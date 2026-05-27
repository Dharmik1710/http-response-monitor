import { logger } from "../config/logger";

export type PingResult = {
  status: number | null;
  body: Record<string, unknown> | null;
  latencyMs: number;
  success: boolean;
  errorMessage: string | null;
};

const TIMEOUT_MS = 10_000;

/**
 * POSTs the given payload to httpbin and returns the result. Never throws.
 */
export async function pingHttpbin(
  url: string,
  payload: Record<string, unknown>
): Promise<PingResult> {
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Math.round(performance.now() - start);
    const body = response.ok ? (await response.json()) as Record<string, unknown> : null;

    return {
      status: response.status,
      body,
      latencyMs,
      success: response.ok,
      errorMessage: response.ok ? null : `HTTP ${response.status}`,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "httpbin request failed");

    return {
      status: null,
      body: null,
      latencyMs,
      success: false,
      errorMessage: message,
    };
  }
}
