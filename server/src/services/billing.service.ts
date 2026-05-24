import { FRONTENDURL, STRIPE_SECRET_KEY } from "@/constants/env";
import {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_CONTENT,
} from "@/constants/http";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import appAssert from "@/utils/appAssert";
import Stripe from "stripe";

const stripe = new Stripe(STRIPE_SECRET_KEY);

export type BillingSubscriptionJson = {
    id: string;
    organizationId: string;
    plan: SubscriptionPlan | null;
    status: SubscriptionStatus;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    cardBrand: string | null;
    cardLast4: string | null;
    cardExpMonth: number | null;
    cardExpYear: number | null;
};

function toIso(d: Date | null): string | null {
    return d ? d.toISOString() : null;
}

export async function getBillingSubscriptionForOrg(
    organizationId: string,
): Promise<BillingSubscriptionJson | null> {
    const row = await prisma.subscription.findUnique({
        where: { organizationId },
    });
    if (!row) {
        return null;
    }
    return {
        id: row.id,
        organizationId: row.organizationId,
        plan: row.plan,
        status: row.status,
        trialEndsAt: toIso(row.trialEndsAt),
        currentPeriodStart: toIso(row.currentPeriodStart),
        currentPeriodEnd: toIso(row.currentPeriodEnd),
        stripeCustomerId: row.stripeCustomerId,
        stripeSubscriptionId: row.stripeSubscriptionId,
        cardBrand: row.cardBrand,
        cardLast4: row.cardLast4,
        cardExpMonth: row.cardExpMonth,
        cardExpYear: row.cardExpYear,
    };
}

const frontendBase = FRONTENDURL.replace(/\/$/, "");
const paymentsCheckoutPath = `${frontendBase}/settings/payments`;

export type CheckoutIdentity = {
    organizationId: string;
    userId: string;
};

export async function createCheckoutSessionUrl(
    priceId: string,
    identity: CheckoutIdentity,
): Promise<string> {
    const metadata = {
        organization_id: identity.organizationId,
        user_id: identity.userId,
    };

    const session = await stripe.checkout.sessions.create({
        client_reference_id: identity.organizationId,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: "subscription",
        metadata,
        subscription_data: {
            metadata,
        },
        success_url: `${paymentsCheckoutPath}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${paymentsCheckoutPath}?canceled=true`,
    });

    appAssert(
        session.url,
        INTERNAL_SERVER_ERROR,
        "Checkout session did not return a URL",
    );

    return session.url;
}

export async function createBillingPortalSessionUrl(
    organizationId: string,
): Promise<string> {
    const row = await prisma.subscription.findUnique({
        where: { organizationId },
        select: { stripeCustomerId: true },
    });
    appAssert(
        row?.stripeCustomerId,
        UNPROCESSABLE_CONTENT,
        "Kein Stripe-Kunde — bitte zuerst ein Abo abschließen.",
    );

    const session = await stripe.billingPortal.sessions.create({
        customer: row.stripeCustomerId,
        return_url: paymentsCheckoutPath,
    });

    appAssert(
        session.url,
        INTERNAL_SERVER_ERROR,
        "Kundenportal-URL konnte nicht erzeugt werden.",
    );

    return session.url;
}
