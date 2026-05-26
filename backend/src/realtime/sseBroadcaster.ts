import { Response } from "express";
import { logger } from "../config/logger";

/** Connected SSE clients on this web instance. */
const clients = new Set<Response>();

/**
 * Registers an SSE client and removes it on disconnect.
 * @param res - Express response kept open for SSE streaming
 */
export function addClient(res: Response): void {
  clients.add(res);
  logger.debug({ clientCount: clients.size }, "SSE client connected");
  res.on("close", () => {
    clients.delete(res);
    logger.debug({ clientCount: clients.size }, "SSE client disconnected");
  });
}

/**
 * Pushes a server-sent event to all connected clients on this instance.
 * @param data - Payload to serialise as JSON in the SSE `data:` field
 */
export function broadcast(data: unknown): void {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
  logger.debug({ clientCount: clients.size }, "SSE broadcast sent");
}
