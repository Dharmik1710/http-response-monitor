import Redis from "ioredis";
import { config } from "../config";
import { logger } from "../config/logger";

const CHANNEL = "pings:new";
let redis: Redis | null = null;

function getClient(): Redis {
  if (!redis) {
    redis = new Redis(config.redisUrl);
    redis.on("error", (err) => logger.error({ err }, "Redis publisher error"));
  }
  return redis;
}

/**
 * Publishes a new-ping event to Redis (worker role).
 * @param pingId - UUID of the newly inserted ping row
 */
export async function publishPing(pingId: string): Promise<void> {
  await getClient().publish(CHANNEL, JSON.stringify({ id: pingId }));
  logger.debug({ pingId }, "Published ping event");
}

/** Closes the Redis publish connection on shutdown. */
export function closePublisher(): void {
  if (redis) {
    redis.disconnect();
    redis = null;
  }
}
