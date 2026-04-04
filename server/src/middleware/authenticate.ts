import { prisma } from "@/lib/prisma";
import { RequestHandler } from "express";
import AppErrorCode from "../constants/appErrorCode";
import { UNAUTHORIZED } from "../constants/http";
import appAssert from "../utils/appAssert";
import { verifyToken } from "../utils/jwt";

const authenticate: RequestHandler = async (req, res, next) => {
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

    const membership = await prisma.organizationMember.findFirst({
        where: { userId: payload.userId },
        select: { organizationId: true },
    });

    req.userId = payload.userId;
    req.tokenId = payload.tokenId;
    req.orgId = membership?.organizationId ?? "";
    next();
};

export default authenticate;
