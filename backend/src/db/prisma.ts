import { PrismaClient } from "@prisma/client";

/** Shared Prisma client instance. Used by both worker and web roles. */
export const prisma = new PrismaClient();
