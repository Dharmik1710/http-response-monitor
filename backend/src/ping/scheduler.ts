import cron from "node-cron";
import { config } from "../config";
import { logger } from "../config/logger";
import { runPingTick } from "./runPingTick";

let task: cron.ScheduledTask | null = null;

/**
 * Starts the periodic ping scheduler (worker role only).
 * Uses node-cron for cron-expression-based scheduling.
 */
export function startScheduler(): void {
  const intervalMs = config.pingIntervalMs;
  const intervalSec = Math.floor(intervalMs / 1000);

  // node-cron minimum granularity is 1 minute; for sub-minute use setInterval
  if (intervalSec < 60) {
    logger.info({ intervalMs }, "Scheduler: using setInterval (sub-minute)");
    const handle = setInterval(() => {
      runPingTick();
    }, intervalMs);
    task = { stop: () => clearInterval(handle) } as unknown as cron.ScheduledTask;
  } else {
    const intervalMin = Math.floor(intervalSec / 60);
    const expression = `*/${intervalMin} * * * *`;
    logger.info({ expression, intervalMs }, "Scheduler: using cron");
    task = cron.schedule(expression, () => {
      runPingTick();
    });
  }

  // Run first tick immediately so we don't wait for the first interval
  runPingTick();
}

/** Stops the scheduler and cancels any pending tick. */
export function stopScheduler(): void {
  if (task) {
    task.stop();
    task = null;
    logger.info("Scheduler stopped");
  }
}
