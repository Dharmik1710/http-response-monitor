import { PingResponse, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type PingRecord = PingResponse;

/** Fields required to insert a ping (JSON fields use plain objects, not Prisma JsonValue). */
export type PingInsert = {
  intervalKey: Date;
  requestPayload: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: Record<string, unknown> | null;
  responseBodyTruncated: boolean;
  latencyMs: number | null;
  success: boolean;
  errorMessage: string | null;
};

function toCreateInput(record: PingInsert): Prisma.PingResponseCreateInput {
  return {
    intervalKey: record.intervalKey,
    requestPayload: record.requestPayload as Prisma.InputJsonValue,
    responseStatus: record.responseStatus,
    responseBody:
      record.responseBody === null
        ? Prisma.DbNull
        : (record.responseBody as Prisma.InputJsonValue),
    responseBodyTruncated: record.responseBodyTruncated,
    latencyMs: record.latencyMs,
    success: record.success,
    errorMessage: record.errorMessage,
  };
}

/**
 * Inserts a ping result. Returns null if interval_key already exists (duplicate tick).
 */
export async function insertPing(record: PingInsert): Promise<PingRecord | null> {
  try {
    return await prisma.pingResponse.create({ data: toCreateInput(record) });
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
