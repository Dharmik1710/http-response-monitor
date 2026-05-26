import pino from "pino";
import { config } from "./index";

/**
 * Application-wide structured logger.
 * - Production: JSON output (machine-parseable)
 * - Development: colorised pretty-print via pino-pretty
 */
export const logger = pino({
  level: config.nodeEnv === "production" ? "info" : "debug",
  transport:
    config.nodeEnv !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
