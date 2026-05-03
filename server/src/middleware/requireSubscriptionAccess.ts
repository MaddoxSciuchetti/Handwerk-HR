import AppErrorCode from "@/constants/appErrorCode";
import { FORBIDDEN } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import appAssert from "@/utils/appAssert";
import { hasSubscriptionAppAccess } from "@/utils/subscriptionAccess";
import type { RequestHandler } from "express";

/**
 * After `authenticate`. Blocks org-scoped “app” APIs when the org has no valid
 * subscription access (expired trial, cancelled, past_due). Billing and profile
 * routes stay on paths that do not use this middleware.
 */
export const requireSubscriptionAccess: RequestHandler = async (
    req,
    _res,
    next,
) => {
    try {
        const orgId = req.orgId;
        const row = await prisma.subscription.findUnique({
            where: { organizationId: orgId },
            select: {
                status: true,
                stripeSubscriptionId: true,
                trialEndsAt: true,
            },
        });
        appAssert(
            hasSubscriptionAppAccess(row),
            FORBIDDEN,
            "Kein Zugriff — bitte Abrechnung unter Einstellungen › Zahlungen abschließen oder Zahlung aktualisieren.",
            AppErrorCode.SubscriptionAccessDenied,
        );
        next();
    } catch (err) {
        next(err);
    }
};

export default requireSubscriptionAccess;
