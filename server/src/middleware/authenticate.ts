import { isSentryEnabled } from "@/instrument";
import { prisma } from "@/lib/prisma";
import { updateRequestContext } from "@/observability/requestContext";
import { context, trace } from "@opentelemetry/api";
import * as Sentry from "@sentry/node";
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
            select: { organizationId: true, membershipRole: true },
            orderBy: { joinedAt: "asc" },
        });

        appAssert(member, UNAUTHORIZED, "No org found");

        req.userId = payload.userId;
        req.sessionId = payload.sessionId;
        if (payload.tokenId) {
            req.tokenId = payload.tokenId;
        }
        req.orgId = member?.organizationId;
        req.membershipRole = member?.membershipRole;

        updateRequestContext({
            userId: req.userId,
            orgId: req.orgId,
        });

        if (isSentryEnabled) {
            Sentry.setUser({ id: req.userId });
            const scope = Sentry.getCurrentScope();
            if (req.orgId) {
                scope.setTag("org_id", req.orgId);
            }
            if (req.requestId) {
                scope.setTag("request_id", req.requestId);
            }
        }

        const activeSpan = trace.getSpan(context.active());
        if (activeSpan) {
            activeSpan.setAttribute("enduser.id", req.userId);
            if (req.orgId) {
                activeSpan.setAttribute("organization.id", req.orgId);
            }
            if (req.requestId) {
                activeSpan.setAttribute("http.request_id", req.requestId);
            }
        }

        next();
    } catch (err) {
        next(err);
    }
};

export default authenticate;
