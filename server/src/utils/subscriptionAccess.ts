import type { Subscription } from "@prisma/client";

type SubscriptionAccessFields = Pick<
    Subscription,
    "status" | "stripeSubscriptionId" | "trialEndsAt"
>;

export function hasSubscriptionAppAccess(
    row: SubscriptionAccessFields | null,
): boolean {
    if (!row) return true;
    if (row.status === "cancelled") return false;
    if (row.status === "past_due") return false;
    if (row.status === "active") return true;
    if (row.status === "trialing" && row.stripeSubscriptionId) return true;
    if (row.status === "trialing" && !row.stripeSubscriptionId) {
        if (!row.trialEndsAt) return true;
        return row.trialEndsAt > new Date();
    }
    return false;
}
