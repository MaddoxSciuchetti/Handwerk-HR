import { planFromStripePriceId } from "@/constants/stripePricePlans";
import { StripeSubscriptionResource } from "@/types/stipe.types";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export function asStripeSubscription(raw: unknown): StripeSubscriptionResource {
    return raw as StripeSubscriptionResource;
}

export function mapPriceLookupToPlan(
    lookupKey: string | null | undefined,
): SubscriptionPlan | null {
    const key = lookupKey?.toLowerCase();
    if (key === "starter") return "starter";
    if (key === "pro") return "pro";
    if (key === "enterprise") return "enterprise";
    return null;
}

export function mapStripeSubscriptionStatus(
    status: string,
): SubscriptionStatus {
    switch (status) {
        case "trialing":
            return "trialing";
        case "active":
            return "active";
        case "past_due":
            return "past_due";
        case "canceled":
        case "unpaid":
            return "cancelled";
        default:
            return "trialing";
    }
}

export function normalizeLineItemPrice(
    price:
        | string
        | { id?: string; lookup_key?: string | null }
        | null
        | undefined,
): { id?: string; lookup_key?: string | null } | null {
    if (price == null) {
        return null;
    }
    if (typeof price === "string") {
        return { id: price };
    }
    return price;
}

export function resolvePlanFromLineItemPrice(
    price: { id?: string; lookup_key?: string | null } | null | undefined,
): SubscriptionPlan | null {
    if (!price) {
        return null;
    }
    const fromId = planFromStripePriceId(price.id);
    if (fromId) {
        return fromId;
    }
    return mapPriceLookupToPlan(price.lookup_key);
}

export function extractCardFieldsFromStripeSubscription(
    stripeSub: StripeSubscriptionResource,
): Partial<{
    providerPaymentMethodId: string;
    cardBrand: string;
    cardLast4: string;
    cardExpMonth: number;
    cardExpYear: number;
}> {
    const pm = stripeSub.default_payment_method;
    if (!pm || typeof pm === "string") {
        return {};
    }
    if (pm.type === "card" && pm.card?.last4 && pm.id) {
        return {
            providerPaymentMethodId: pm.id,
            cardBrand: pm.card.brand,
            cardLast4: pm.card.last4,
            cardExpMonth: pm.card.exp_month,
            cardExpYear: pm.card.exp_year,
        };
    }
    return {};
}

export function buildSubscriptionDbFieldsFromStripeSubscription(
    stripeSub: StripeSubscriptionResource,
) {
    const customerRaw = stripeSub.customer;
    const customerId =
        typeof customerRaw === "string"
            ? customerRaw
            : customerRaw && typeof customerRaw === "object"
              ? customerRaw.id
              : null;
    if (!customerId || typeof customerId !== "string") {
        throw new Error("Stripe subscription missing customer id");
    }

    return {
        status: mapStripeSubscriptionStatus(stripeSub.status),
        provider: "stripe",
        stripeSubscriptionId: stripeSub.id,
        stripeCustomerId: customerId,
        currentPeriodStart:
            stripeSub.current_period_start != null
                ? new Date(stripeSub.current_period_start * 1000)
                : null,
        currentPeriodEnd:
            stripeSub.current_period_end != null
                ? new Date(stripeSub.current_period_end * 1000)
                : null,
        trialEndsAt:
            stripeSub.trial_end != null
                ? new Date(stripeSub.trial_end * 1000)
                : null,
        ...extractCardFieldsFromStripeSubscription(stripeSub),
    };
}
