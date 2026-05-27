import { PingResponse } from "@prisma/client";
import { prisma } from "./prisma";

export type PingRecord = PingResponse;

/**
 * Inserts a ping result. Returns null if interval_key already exists (duplicate tick).
 */
export async function insertPing(
  record: Omit<PingRecord, "id" | "createdAt">
): Promise<PingRecord | null> {
  try {
    return await prisma.pingResponse.create({ data: record });
  } catch (err: unknown) {
    if (isPrismaUniqueViolation(err)) return null;
    throw err;
  }
}

/**
 * Fetches historical ping responses, newest first.
 */
export async function getPings(options: {
  limit?: number;
  offset?: number;
}): Promise<PingRecord[]> {
  return prisma.pingResponse.findMany({
    orderBy: { createdAt: "desc" },
    take: options.limit ?? 20,
    skip: options.offset ?? 0,
  });
}

/**
 * Returns total row count for pagination.
 */
export async function getPingCount(): Promise<number> {
  return prisma.pingResponse.count();
}

/**
 * Fetches a single ping by id.
 */
export async function getPingById(id: string): Promise<PingRecord | null> {
  return prisma.pingResponse.findUnique({ where: { id } });
}

function isPrismaUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}
