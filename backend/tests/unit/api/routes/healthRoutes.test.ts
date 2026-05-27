import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { healthRoutes } from "../../../../src/api/routes/healthRoutes";
import { prisma } from "../../../../src/db/prisma";

vi.mock("../../../../src/db/prisma", () => ({
    prisma: {
        $queryRaw: vi.fn(),
    },
}));

vi.mock("../../../../src/config/logger", () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function buildApp() {
    const app = express();
    app.use("/api", healthRoutes);
    return app;
}

describe("GET /api/health", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns ok when DB is healthy", async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);

        const res = await request(buildApp()).get("/api/health");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true, db: "up" });
    });

    it("returns 503 when DB is down", async () => {
        vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("Connection refused"));

        const res = await request(buildApp()).get("/api/health");

        expect(res.status).toBe(503);
        expect(res.body).toEqual({ ok: false, db: "down" });
    });
});
