import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { pingRoutes } from "../../../../src/api/routes/pingRoutes";
import { getPings, getPingCount } from "../../../../src/db/pingRepository";

vi.mock("../../../../src/db/pingRepository", () => ({
    getPings: vi.fn(),
    getPingCount: vi.fn(),
}));

vi.mock("../../../../src/config/logger", () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function buildApp() {
    const app = express();
    app.use("/api", pingRoutes);
    return app;
}

const mockPing = {
    id: "abc-123",
    intervalKey: new Date("2026-01-01T00:05:00.000Z"),
    createdAt: new Date("2026-01-01T00:05:01.000Z"),
    requestPayload: { key: "value" },
    responseStatus: 200,
    responseBody: { data: "test" },
    responseBodyTruncated: false,
    latencyMs: 120,
    success: true,
    errorMessage: null,
};

describe("GET /api/responses", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns paginated data with defaults", async () => {
        vi.mocked(getPings).mockResolvedValue([mockPing as any]);
        vi.mocked(getPingCount).mockResolvedValue(1);

        const res = await request(buildApp()).get("/api/responses");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                data: expect.any(Array),
                total: 1,
                limit: 20,
                offset: 0,
            })
        );
        expect(getPings).toHaveBeenCalledWith({ limit: 20, offset: 0 });
    });

    it("respects offset query param", async () => {
        vi.mocked(getPings).mockResolvedValue([]);
        vi.mocked(getPingCount).mockResolvedValue(50);

        const res = await request(buildApp()).get("/api/responses?offset=20");

        expect(res.status).toBe(200);
        expect(res.body.offset).toBe(20);
        expect(getPings).toHaveBeenCalledWith({ limit: 20, offset: 20 });
    });

    it("clamps negative offset to 0", async () => {
        vi.mocked(getPings).mockResolvedValue([]);
        vi.mocked(getPingCount).mockResolvedValue(0);

        await request(buildApp()).get("/api/responses?offset=-5");

        expect(getPings).toHaveBeenCalledWith({ limit: 20, offset: 0 });
    });

    it("returns 500 on repository error", async () => {
        vi.mocked(getPings).mockRejectedValue(new Error("DB down"));

        const res = await request(buildApp()).get("/api/responses");

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: "Internal server error" });
    });
});
