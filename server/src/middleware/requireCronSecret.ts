import { timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { CRON_SECRET } from "@/constants/env";

export const requireCronSecret: RequestHandler = (req, res, next) => {
    const expected = CRON_SECRET();
    const received = req.get("Authorization") ?? "";
    const wanted = `Bearer ${expected}`;
    if (
        !expected ||
        Buffer.byteLength(received) !== Buffer.byteLength(wanted) ||
        !timingSafeEqual(Buffer.from(received), Buffer.from(wanted))
    ) {
        res.status(401).json({ success: false });
        return;
    }
    next();
};
