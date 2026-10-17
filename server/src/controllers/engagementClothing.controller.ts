import { BAD_REQUEST, CREATED, OK } from "@/constants/http";
import {
    createEngagementClothingSchema,
    returnEngagementClothingSchema,
} from "@/schemas/engagementClothing.schemas";
import {
    createEngagementClothing,
    deleteEngagementClothing,
    listEngagementClothing,
    returnEngagementClothing,
} from "@/services/engagementClothing.service";
import AppError from "@/utils/AppError";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";
import { Request, Response } from "express";
import { z } from "zod";

function param(req: Request, key: string): string {
    const value = req.params[key];
    return Array.isArray(value) ? value[0] : String(value);
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
    const result = schema.safeParse(body ?? {});
    if (!result.success) {
        throw new AppError(
            BAD_REQUEST,
            result.error.issues[0]?.message ?? "Eingabe ungültig.",
        );
    }
    return result.data;
}

function scope(req: Request) {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    return {
        organizationId: req.orgId,
        workerId: param(req, "workerId"),
        engagementId: param(req, "engagementId"),
    };
}

export const listEngagementClothingHandler = catchErrors(
    async (req: Request, res: Response) => {
        const data = await listEngagementClothing(scope(req));
        return res.status(OK).json({ success: true, data });
    },
);

export const postEngagementClothing = catchErrors(
    async (req: Request, res: Response) => {
        const input = parseBody(createEngagementClothingSchema, req.body);
        const data = await createEngagementClothing(scope(req), input);
        return res.status(CREATED).json({ success: true, data });
    },
);

export const returnEngagementClothingHandler = catchErrors(
    async (req: Request, res: Response) => {
        const input = parseBody(returnEngagementClothingSchema, req.body);
        const data = await returnEngagementClothing(
            scope(req),
            param(req, "clothingId"),
            input.quantity,
        );
        return res.status(OK).json({ success: true, data });
    },
);

export const removeEngagementClothing = catchErrors(
    async (req: Request, res: Response) => {
        await deleteEngagementClothing(scope(req), param(req, "clothingId"));
        return res.status(OK).json({ success: true });
    },
);
