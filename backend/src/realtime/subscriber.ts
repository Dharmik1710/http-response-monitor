import Redis from "ioredis";
import { config } from "../config";
import { logger } from "../config/logger";
import { getPingById } from "../db/pingRepository";
import { broadcast } from "./sseBroadcaster";

const CHANNEL = "pings:new";
let redis: Redis | null = null;

/**
 * Subscribes to Redis "pings:new" channel (web role).
 * On message: fetches full row from DB and broadcasts via SSE.
 */
export function createSubscriber(): void {
  redis = new Redis(config.redisUrl);
  redis.on("error", (err) => logger.error({ err }, "Redis subscriber error"));

  redis.subscribe(CHANNEL, (err) => {
    if (err) {
      logger.error({ err }, "Failed to subscribe to Redis channel");
      return;
    }
    logger.info({ channel: CHANNEL }, "Subscribed to Redis channel");
  });

  redis.on("message", async (_channel: string, message: string) => {
    try {
      const { id } = JSON.parse(message);
      const record = await getPingById(id);
      if (record) {
        broadcast(record);
      }
    } catch (err) {
      logger.error({ err }, "Error processing ping event");
    }
  });
}

/** Unsubscribes and closes the Redis subscription connection on shutdown. */
export function closeSubscriber(): void {
  if (redis) {
    redis.unsubscribe(CHANNEL);
    redis.disconnect();
    redis = null;
  }
}
