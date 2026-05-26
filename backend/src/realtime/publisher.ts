/**
 * Publishes a new-ping event to Redis (worker role).
 *
 * TODO: Implement Redis PUBLISH.
 * - Channel: "pings:new"
 * - Payload: JSON { id } (small; subscriber fetches full row if needed)
 *
 * @param pingId - UUID of the newly inserted ping row
 */
export async function publishPing(_pingId: string): Promise<void> {
  throw new Error("Not implemented");
}

/**
 * Closes the Redis publish connection on shutdown.
 *
 * TODO: Disconnect Redis client.
 */
export function closePublisher(): void {
  // no-op until implemented
}
