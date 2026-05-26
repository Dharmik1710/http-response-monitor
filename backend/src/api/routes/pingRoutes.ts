import { Router, Request, Response } from "express";

export const pingRoutes = Router();

/**
 * GET /api/responses — paginated history of ping results.
 *
 * TODO: Implement handler.
 * - Query params: limit (default 20), offset (default 0)
 * - Call getPings from pingRepository
 * - Return { data: PingRecord[], total: number }
 * - Handle errors with 500 + logger.error
 */
pingRoutes.get("/responses", async (_req: Request, res: Response) => {
  res.status(501).json({ error: "Not implemented" });
});
