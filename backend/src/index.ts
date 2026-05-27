import { config } from "./config";
import { logger } from "./config/logger";
import { createApp } from "./api/app";
import { startScheduler, stopScheduler } from "./ping/scheduler";
import { createSubscriber, closeSubscriber } from "./realtime/subscriber";
import { closePublisher } from "./realtime/publisher";
import { prisma } from "./db/prisma";

async function main() {
    const role = config.appRole;
    logger.info({ role }, "Starting application");

    if (role === "worker" || role === "monolith") {
        startScheduler();
        logger.info("Scheduler started");
    }

    if (role === "web" || role === "monolith") {
        createSubscriber();
        const app = createApp();
        app.listen(config.port, "0.0.0.0", () => {
            logger.info({ port: config.port }, "Web server listening");
        });
    }

    const shutdown = async () => {
        logger.info("Shutting down...");
        if (role === "worker" || role === "monolith") stopScheduler();
        if (role === "web" || role === "monolith") closeSubscriber();
        closePublisher();
        await prisma.$disconnect();
        process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
}

main().catch((err) => {
    logger.fatal({ err }, "Fatal startup error");
    process.exit(1);
});
