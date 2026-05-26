import { config } from "./config";
import { logger } from "./config/logger";
import { createApp } from "./api/app";
import { startScheduler, stopScheduler } from "./ping/scheduler";
import { createSubscriber, closeSubscriber } from "./realtime/subscriber";
import { closePublisher } from "./realtime/publisher";
import { pool } from "./db/pool";

async function main() {
  const role = config.appRole;
  logger.info({ role }, "Starting application");

  if (role === "worker") {
    startScheduler();
    logger.info("Worker: scheduler started");
  }

  if (role === "web") {
    createSubscriber();
    const app = createApp();
    app.listen(config.port, () => {
      logger.info({ port: config.port }, "Web: server listening");
    });
  }

  const shutdown = async () => {
    logger.info("Shutting down...");
    if (role === "worker") stopScheduler();
    if (role === "web") closeSubscriber();
    closePublisher();
    await pool.end();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal startup error");
  process.exit(1);
});
