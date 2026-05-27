import { Router, Request, Response } from "express";
import { getPings, getPingCount } from "../../db/pingRepository";
import { logger } from "../../config/logger";

export const pingRoutes = Router();

/**
 * GET /api/responses — paginated history of ping results.
 * Query params: limit (default 20, max 100), offset (default 0)
 */
pingRoutes.get("/responses", async (req: Request, res: Response) => {
  try {
    const limit = 20;
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const [data, total] = await Promise.all([
      getPings({ limit, offset }),
      getPingCount(),
    ]);

    res.json({ data, total, limit, offset });
  } catch (err) {
    logger.error({ err }, "Failed to fetch responses");
    res.status(500).json({ error: "Internal server error" });
  }
});