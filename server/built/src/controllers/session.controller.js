import { z } from "zod";
import { NOT_FOUND, OK } from "../constants/http";
import catchErrors from "../utils/catchErrors";
import appAssert from "../utils/appAssert";
import { prisma } from "@/lib/prisma";
export const getSessionHandler = catchErrors(async (req, res) => {
    const sessions = await prisma.session.findMany({
        where: {
            userId: req.userId,
            expiresAt: {
                gt: new Date(),
            },
        },
        select: {
            id: true,
            userAgent: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    const session = sessions.map((session) => ({
        ...session,
        ...(session.id === req.sessionId && {
            isCurrent: true,
        }),
    }));
    console.log("this is the session", session);
    return res.status(OK).json(session);
});
export const deleteSessionHandler = catchErrors(async (req, res) => {
    const sessionId = z.string().parse(req.params.id);
    const deleted = await prisma.session.delete({
        where: {
            id: sessionId,
            userId: req.userId,
        },
    });
    appAssert(deleted, NOT_FOUND, "Session not found");
    return res.status(OK).json({
        message: "Session removed",
    });
});
