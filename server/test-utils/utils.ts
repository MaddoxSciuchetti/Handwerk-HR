import Stripe from "stripe";

/** Stripe starter price id; must match the starter key in STRIPE_PRICE_ID_TO_PLAN inside `/server/src/constants/stripePricePlans.ts`. */
export const KNOWN_PRICE_ID_STARTER = "price_1TSLW4IFABFY32sSl8hcCUBE";

//  minimal subscription retrieve fixture. normal retrieve object has many more fields. overrides allows you to override the default values.
export function stripeRetrieveSubscriptionFixture(
    overrides: Partial<Stripe.Subscription> = {},
): Stripe.Subscription {
    return {
        id: "sub_fixture",
        status: "active",
        customer: "cus_fixture",
        current_period_start: 1_700_000_000,
        current_period_end: 1_700_086_400,
        trial_end: null,
        metadata: {},
        items: {
            data: [
                {
                    price: { id: KNOWN_PRICE_ID_STARTER } as Stripe.Price,
                } as Stripe.SubscriptionItem,
            ],
        },
        ...overrides,
    } as Stripe.Subscription;
}

//  minimal checkout session fixture. normal session object has many more fields.overrides allows you to override the default values.
export function handlerCheckoutSessionFixture(
    overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
    return {
        id: "cs_fixture",
        object: "checkout.session",
        metadata: {
            organization_id: "org_1",
            user_id: "user_1",
        },
        subscription: "sub_fixture",
        ...overrides,
    } as Stripe.Checkout.Session;
}
