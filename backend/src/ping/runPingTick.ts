import { config } from "../config";
import { logger } from "../config/logger";
import { generatePayload } from "./payloadGenerator";
import { pingHttpbin } from "./httpbinClient";
import { insertPing } from "../db/pingRepository";
import { publishPing } from "../realtime/publisher";

let tickInProgress = false;

/**
 * Orchestrates a single ping tick. Guarded by mutex to prevent overlap.
 */
export async function runPingTick(): Promise<void> {
  if (tickInProgress) {
    logger.warn("ping_tick_skipped: previous tick still running");
    return;
  }

  tickInProgress = true;
  try {
    const payload = generatePayload();
    const result = await pingHttpbin(config.httpbinUrl, payload);
    const intervalKey = computeIntervalKey(config.pingIntervalMs);

    const record = await insertPing({
      intervalKey,
      requestPayload: payload,
      responseStatus: result.status,
      responseBody: result.body,
      responseBodyTruncated: false,
      latencyMs: result.latencyMs,
      success: result.success,
      errorMessage: result.errorMessage,
    });

    if (!record) {
      logger.warn({ intervalKey }, "ping_tick_duplicate: interval_key already exists");
      return;
    }

    await publishPing(record.id);
    logger.info({ id: record.id, success: record.success, latencyMs: record.latencyMs }, "ping_tick_completed");
  } catch (err) {
    logger.error({ err }, "ping_tick_failed");
  } finally {
    tickInProgress = false;
  }
}

/** Floors current time to the nearest interval bucket. */
export function computeIntervalKey(intervalMs: number): Date {
  const now = Date.now();
  return new Date(Math.floor(now / intervalMs) * intervalMs);
}
