/**
 * Subscribes to Redis "pings:new" channel (web role).
 *
 * TODO: Implement Redis SUBSCRIBE.
 * - On message: parse { id }, fetch full row from DB, call sseBroadcaster.broadcast()
 * - Log subscription start
 */
export function createSubscriber(): void {
  throw new Error("Not implemented");
}

/**
 * Unsubscribes and closes the Redis subscription connection on shutdown.
 *
 * TODO: Disconnect Redis subscriber client.
 */
export function closeSubscriber(): void {
  // no-op until implemented
}
