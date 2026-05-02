import { FRONTENDURL, STRIPE_SECRET_KEY } from "@/constants/env";
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from "@/constants/http";
import appAssert from "@/utils/appAssert";
import Stripe from "stripe";

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function createCheckoutSessionUrl(
    lookupKey: string,
): Promise<string> {
    const prices = await stripe.prices.list({
        lookup_keys: [lookupKey],
        active: true,
        limit: 1,
    });

    const price = prices.data[0];
    appAssert(
        price,
        NOT_FOUND,
        `No active Stripe price for lookup_key: ${lookupKey}`,
    );

    const mode = price.recurring ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode,
        success_url: `${FRONTENDURL}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTENDURL}?canceled=true`,
    });

    appAssert(
        session.url,
        INTERNAL_SERVER_ERROR,
        "Checkout session did not return a URL",
    );

    return session.url;
}
