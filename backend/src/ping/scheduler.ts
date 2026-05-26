/**
 * Starts the periodic ping scheduler (worker role only).
 *
 * TODO: Implement using node-cron.
 * - Read interval from config.pingIntervalMs
 * - Call runPingTick on each tick
 * - Log scheduler start event
 */
export function startScheduler(): void {
  throw new Error("Not implemented");
}

/**
 * Stops the scheduler and cancels any pending tick.
 *
 * TODO: Destroy cron job, log scheduler stop event.
 */
export function stopScheduler(): void {
  throw new Error("Not implemented");
}
