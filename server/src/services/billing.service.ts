import { FRONTENDURL, STRIPE_SECRET_KEY } from "@/constants/env";
import { INTERNAL_SERVER_ERROR } from "@/constants/http";
import appAssert from "@/utils/appAssert";
import Stripe from "stripe";

const stripe = new Stripe(STRIPE_SECRET_KEY);

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
