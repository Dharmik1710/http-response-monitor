import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { pingHttpbin } from "../../../src/ping/httpbinClient";

vi.mock("../../../src/config/logger", () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const TEST_URL = "https://httpbin.org/anything";
const TEST_PAYLOAD = { key: "value" };

describe("pingHttpbin", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns success result on 200 response", async () => {
        const mockBody = { data: '{"key":"value"}' };
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockBody),
        } as Response);

        const result = await pingHttpbin(TEST_URL, TEST_PAYLOAD);

        expect(result.success).toBe(true);
        expect(result.status).toBe(200);
        expect(result.body).toEqual(mockBody);
        expect(result.errorMessage).toBeNull();
        expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("returns failure result on non-ok response", async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.resolve({}),
        } as Response);

        const result = await pingHttpbin(TEST_URL, TEST_PAYLOAD);

        expect(result.success).toBe(false);
        expect(result.status).toBe(500);
        expect(result.body).toBeNull();
        expect(result.errorMessage).toBe("HTTP 500");
    });

    it("returns failure result on network error", async () => {
        vi.mocked(fetch).mockRejectedValue(new Error("fetch failed"));

        const result = await pingHttpbin(TEST_URL, TEST_PAYLOAD);

        expect(result.success).toBe(false);
        expect(result.status).toBeNull();
        expect(result.body).toBeNull();
        expect(result.errorMessage).toBe("fetch failed");
        expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("sends POST with correct headers and body", async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({}),
        } as Response);

        await pingHttpbin(TEST_URL, TEST_PAYLOAD);

        expect(fetch).toHaveBeenCalledWith(
            TEST_URL,
            expect.objectContaining({
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(TEST_PAYLOAD),
            })
        );
    });

    it("measures latency on success", async () => {
        vi.mocked(fetch).mockImplementation(
            () =>
                new Promise((resolve) =>
                    setTimeout(
                        () =>
                            resolve({
                                ok: true,
                                status: 200,
                                json: () => Promise.resolve({}),
                            } as Response),
                        50
                    )
                )
        );

        const result = await pingHttpbin(TEST_URL, TEST_PAYLOAD);
        expect(result.latencyMs).toBeGreaterThanOrEqual(40);
    });
});
