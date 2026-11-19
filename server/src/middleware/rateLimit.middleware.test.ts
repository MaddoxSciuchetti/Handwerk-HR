import express from "express";
import request from "supertest";
import {
    createRateLimiter,
    shouldSkipGlobalRateLimit,
} from "./rateLimit.middleware";

describe("shouldSkipGlobalRateLimit", () => {
    it("skips uptime, webhooks, and cron paths", () => {
        expect(
            shouldSkipGlobalRateLimit({
                method: "GET",
                path: "/",
            } as never),
        ).toBe(true);
        expect(
            shouldSkipGlobalRateLimit({
                method: "POST",
                path: "/webhooks/stripe",
            } as never),
        ).toBe(true);
        expect(
            shouldSkipGlobalRateLimit({
                method: "POST",
                path: "/internal/cron/anniversary-reminders",
            } as never),
        ).toBe(true);
        expect(
            shouldSkipGlobalRateLimit({
                method: "POST",
                path: "/auth/v2/login",
            } as never),
        ).toBe(false);
    });
});

describe("createRateLimiter", () => {
    const previous = process.env.RATE_LIMIT_IN_TEST;

    beforeAll(() => {
        process.env.RATE_LIMIT_IN_TEST = "1";
    });

    afterAll(() => {
        if (previous === undefined) {
            delete process.env.RATE_LIMIT_IN_TEST;
        } else {
            process.env.RATE_LIMIT_IN_TEST = previous;
        }
    });

    it("returns 429 after max requests in the window", async () => {
        const app = express();
        app.use(
            createRateLimiter({
                windowMs: 60_000,
                max: 2,
            }),
        );
        app.get("/probe", (_req, res) => {
            res.status(200).json({ ok: true });
        });

        await request(app).get("/probe").expect(200);
        await request(app).get("/probe").expect(200);
        const limited = await request(app).get("/probe").expect(429);
        expect(limited.body).toEqual({
            message: "Too many requests, please try again later",
        });
    });
});
