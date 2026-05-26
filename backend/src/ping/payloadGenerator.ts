/**
 * Generates a random JSON payload to send with each httpbin request.
 *
 * TODO: Implement random field generation.
 * - Include requestId (uuid), timestamp, category, nested metrics
 * - Keep payload size ~2–10 KB
 * - Accept optional seed/RNG for deterministic tests
 *
 * @returns A plain object serialisable to JSON
 */
export function generatePayload(): Record<string, unknown> {
  throw new Error("Not implemented");
}
