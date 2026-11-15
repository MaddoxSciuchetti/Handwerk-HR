import { requestIdMiddleware } from "@/middleware/requestId.middleware";
import { getRequestContext } from "@/observability/requestContext";
import type { NextFunction, Request, Response } from "express";

function mockRes() {
    const headers = new Map<string, string>();
    return {
        headers,
        setHeader(name: string, value: string) {
            headers.set(name.toLowerCase(), value);
        },
    } as unknown as Response & { headers: Map<string, string> };
}

describe("requestIdMiddleware", () => {
    it("reuses incoming X-Request-Id and echoes it", () => {
        const req = {
            headers: { "x-request-id": "req-from-client" },
        } as unknown as Request;
        const res = mockRes();
        const next = jest.fn() as unknown as NextFunction;

        requestIdMiddleware(req, res, next);

        expect(req.requestId).toBe("req-from-client");
        expect(res.headers.get("x-request-id")).toBe("req-from-client");
        expect(getRequestContext()?.requestId).toBe("req-from-client");
        expect(next).toHaveBeenCalledTimes(1);
    });

    it("generates a request id when header is missing", () => {
        const req = { headers: {} } as unknown as Request;
        const res = mockRes();
        const next = jest.fn() as unknown as NextFunction;

        requestIdMiddleware(req, res, next);

        expect(typeof req.requestId).toBe("string");
        expect(req.requestId?.length).toBeGreaterThan(10);
        expect(res.headers.get("x-request-id")).toBe(req.requestId);
        expect(getRequestContext()?.requestId).toBe(req.requestId);
        expect(next).toHaveBeenCalledTimes(1);
    });
});
