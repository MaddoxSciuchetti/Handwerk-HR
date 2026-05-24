import { prisma } from "@/lib/prisma";
import { RequestHandler } from "express";
import AppErrorCode from "../constants/appErrorCode";
import { UNAUTHORIZED } from "../constants/http";
import appAssert from "../utils/appAssert";
import { verifyToken } from "../utils/jwt";

const authenticate: RequestHandler = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken as string | undefined;
        appAssert(
            accessToken,
            UNAUTHORIZED,
            "Not authorized",
            AppErrorCode.InvalidAccessToken,
        );

        const { error, payload } = verifyToken(accessToken);
        appAssert(
            payload,
            UNAUTHORIZED,
            error === "jwt expired" ? "Token expired" : "Invalid token",
            AppErrorCode.InvalidAccessToken,
        );

        const member = await prisma.organizationMember.findFirst({
            where: { userId: payload.userId, status: "active" },
            select: { organizationId: true },
            orderBy: { joinedAt: "asc" },
        });

        appAssert(member, UNAUTHORIZED, "No org found");

        req.userId = payload.userId;
        req.sessionId = payload.sessionId;
        if (payload.tokenId) {
            req.tokenId = payload.tokenId;
        }
        req.orgId = member?.organizationId;

        next();
    } catch (err) {
        next(err);
    }
};

export default authenticate;
