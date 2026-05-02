import { FRONTENDURL, STRIPE_SECRET_KEY } from "@/constants/env";
import { INTERNAL_SERVER_ERROR } from "@/constants/http";
import appAssert from "@/utils/appAssert";
import Stripe from "stripe";

const stripe = new Stripe(STRIPE_SECRET_KEY);

const frontendBase = FRONTENDURL.replace(/\/$/, "");
const paymentsCheckoutPath = `${frontendBase}/settings/payments`;

export async function createCheckoutSessionUrl(
    priceId: string,
): Promise<string> {
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: "subscription",
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
