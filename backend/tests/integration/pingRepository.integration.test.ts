import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.pingResponse.deleteMany();
});

function makePing(overrides: Record<string, unknown> = {}) {
  return {
    intervalKey: new Date("2026-01-01T00:05:00.000Z"),
    requestPayload: { requestId: "test", value: 42 },
    responseStatus: 200,
    responseBody: { data: "ok" },
    responseBodyTruncated: false,
    latencyMs: 100,
    success: true,
    errorMessage: null,
    ...overrides,
  };
}

describe("pingRepository integration", () => {
  it("inserts a ping and retrieves it by id", async () => {
    const created = await prisma.pingResponse.create({ data: makePing() });

    expect(created.id).toBeDefined();
    expect(created.success).toBe(true);
    expect(created.latencyMs).toBe(100);

    const found = await prisma.pingResponse.findUnique({
      where: { id: created.id },
    });
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
  });

  it("rejects duplicate interval_key", async () => {
    await prisma.pingResponse.create({ data: makePing() });

    await expect(
      prisma.pingResponse.create({ data: makePing() })
    ).rejects.toThrow();
  });

  it("allows different interval_keys", async () => {
    await prisma.pingResponse.create({ data: makePing() });
    const second = await prisma.pingResponse.create({
      data: makePing({
        intervalKey: new Date("2026-01-01T00:10:00.000Z"),
      }),
    });

    expect(second.id).toBeDefined();
    const count = await prisma.pingResponse.count();
    expect(count).toBe(2);
  });

  it("returns rows ordered by createdAt desc", async () => {
    await prisma.pingResponse.create({
      data: makePing({ intervalKey: new Date("2026-01-01T00:05:00.000Z") }),
    });
    await prisma.pingResponse.create({
      data: makePing({ intervalKey: new Date("2026-01-01T00:10:00.000Z") }),
    });
    await prisma.pingResponse.create({
      data: makePing({ intervalKey: new Date("2026-01-01T00:15:00.000Z") }),
    });

    const rows = await prisma.pingResponse.findMany({
      orderBy: { createdAt: "desc" },
    });

    expect(rows.length).toBe(3);
    for (let i = 0; i < rows.length - 1; i++) {
      expect(rows[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        rows[i + 1].createdAt.getTime()
      );
    }
  });

  it("supports pagination with take/skip", async () => {
    for (let i = 0; i < 5; i++) {
      await prisma.pingResponse.create({
        data: makePing({
          intervalKey: new Date(`2026-01-01T00:${String(i * 5).padStart(2, "0")}:00.000Z`),
        }),
      });
    }

    const page1 = await prisma.pingResponse.findMany({
      orderBy: { createdAt: "desc" },
      take: 2,
      skip: 0,
    });
    const page2 = await prisma.pingResponse.findMany({
      orderBy: { createdAt: "desc" },
      take: 2,
      skip: 2,
    });

    expect(page1.length).toBe(2);
    expect(page2.length).toBe(2);
    expect(page1[0].id).not.toBe(page2[0].id);
  });
});
