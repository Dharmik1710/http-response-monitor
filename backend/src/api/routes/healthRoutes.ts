import { Router, Request, Response } from "express";
import { pool } from "../../db/pool";
import { logger } from "../../config/logger";

export const healthRoutes = Router();

/**
 * GET /api/health — liveness check.
 *
 * Returns DB connectivity status. Used by platform health checks
 * and the dashboard connection indicator.
 */
healthRoutes.get("/health", async (_req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "up" });
  } catch (err) {
    logger.error({ err }, "Health check failed");
    res.status(503).json({ ok: false, db: "down" });
  }
});
