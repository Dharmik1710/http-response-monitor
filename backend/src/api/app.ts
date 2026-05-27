import express from "express";
import cors from "cors";
import { config } from "../config";
import { pingRoutes } from "./routes/pingRoutes";
import { sseRoutes } from "./routes/sseRoutes";
import { healthRoutes } from "./routes/healthRoutes";

/**
 * Creates and configures the Express application (web role).
 * @returns Configured Express app with all routes mounted
 */
export function createApp() {
  const app = express();

  if (config.frontendUrl) {
    const origins = config.frontendUrl.split(",").map((s) => s.trim());
    app.use(cors({ origin: origins }));
  } else {
    app.use(cors());
  }
  app.use(express.json());

  app.use("/api", healthRoutes);
  app.use("/api", pingRoutes);
  app.use("/api", sseRoutes);

  return app;
}
