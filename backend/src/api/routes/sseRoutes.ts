import { Router, Request, Response } from "express";
import { addClient } from "../../realtime/sseBroadcaster";

export const sseRoutes = Router();

/**
 * GET /api/events — SSE endpoint for real-time ping updates.
 *
 * Keeps the connection open; new ping rows are pushed as `data:` frames
 * by the sseBroadcaster when the Redis subscriber receives a message.
 */
sseRoutes.get("/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  addClient(res);

  req.on("close", () => {
    res.end();
  });
});
