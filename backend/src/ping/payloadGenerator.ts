import { v4 as uuidv4 } from "uuid";

const CATEGORIES = ["info", "warning", "error", "debug"];

/**
 * Generates a random JSON payload to send with each httpbin request.
 * @returns A plain object serialisable to JSON
 */
export function generatePayload(): Record<string, unknown> {
    return {
        requestId: uuidv4(),
        timestamp: new Date().toISOString(),
        value: Math.round(Math.random() * 1000),
        message: `Ping from monitor at ${new Date().toISOString()}`,
        category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
        metrics: {
            latency: Math.round(Math.random() * 500),
            uptime: Math.round(Math.random() * 99999),
        },
    };
}
