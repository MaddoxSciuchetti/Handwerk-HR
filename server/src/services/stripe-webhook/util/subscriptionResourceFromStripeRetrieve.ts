import type { StripeSubscriptionResource } from "@/types/stripe.types";
import type Stripe from "stripe";

type RetrievedSub = Stripe.Response<Stripe.Subscription>;

function requiredStripeNumber(sub: RetrievedSub, field: string): number {
    const value = Reflect.get(sub, field);
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`Stripe subscription invalid or missing: ${field}`);
    }
    return value;
}

function mapCustomer(
    customer: RetrievedSub["customer"],
): StripeSubscriptionResource["customer"] {
    if (customer == null) {
        return null;
    }
    if (typeof customer === "string") {
        return customer;
    }
    if (typeof customer === "object" && "id" in customer) {
        const id = customer.id;
        return {
            id:
                typeof id === "string"
                    ? id
                    : id === null
                      ? null
                      : undefined,
        };
    }
    return null;
}

function mapMetadata(
    meta: RetrievedSub["metadata"],
): Record<string, string> | null {
    if (meta == null || typeof meta !== "object") {
        return null;
    }
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(meta)) {
        if (typeof v === "string") {
            out[k] = v;
        }
    }
    return Object.keys(out).length > 0 ? out : null;
}

function mapTrialEnd(v: RetrievedSub["trial_end"]): number | null {
    if (v === null || v === undefined) {
        return null;
    }
    if (typeof v !== "number" || !Number.isFinite(v)) {
        throw new Error("Stripe subscription has invalid trial_end");
    }
    return v;
}

function mapLinePrice(
    price: Stripe.SubscriptionItem["price"] | undefined,
    index: number,
): StripeSubscriptionResource["items"]["data"][number]["price"] {
    if (price == null) {
        return null;
    }
    if (typeof price === "string") {
        return price;
    }
    if (typeof price !== "object") {
        throw new Error(`items.data[${index}].price has unexpected shape`);
    }
    const id = "id" in price && typeof price.id === "string" ? price.id : undefined;
    const lk = Reflect.get(price, "lookup_key");
    const lookup_key =
        typeof lk === "string" ? lk : lk === null ? null : null;
    return { id, lookup_key };
}

function mapItems(items: RetrievedSub["items"]): StripeSubscriptionResource["items"] {
    if (items == null || typeof items !== "object") {
        throw new Error("Stripe subscription missing items");
    }
    const data = items.data;
    if (!Array.isArray(data)) {
        throw new Error("Stripe subscription items.data invalid");
    }
    return {
        data: data.map((row, i) => {
            if (row == null || typeof row !== "object") {
                throw new Error(`items.data[${i}] invalid`);
            }
            return { price: mapLinePrice(row.price, i) };
        }),
    };
}

function mapDefaultPm(
    pm: RetrievedSub["default_payment_method"],
): StripeSubscriptionResource["default_payment_method"] {
    if (pm == null) {
        return null;
    }
    if (typeof pm === "string") {
        return pm;
    }
    if (typeof pm !== "object") {
        return null;
    }
    const id = typeof pm.id === "string" ? pm.id : undefined;
    const pmType = typeof pm.type === "string" ? pm.type : undefined;
    const cardRaw = "card" in pm ? pm.card : undefined;
    if (
        pmType === "card" &&
        id &&
        cardRaw != null &&
        typeof cardRaw === "object" &&
        typeof (cardRaw as { brand?: unknown }).brand === "string" &&
        typeof (cardRaw as { last4?: unknown }).last4 === "string" &&
        typeof (cardRaw as { exp_month?: unknown }).exp_month === "number" &&
        typeof (cardRaw as { exp_year?: unknown }).exp_year === "number"
    ) {
        const c = cardRaw as {
            brand: string;
            last4: string;
            exp_month: number;
            exp_year: number;
        };
        return {
            id,
            type: "card",
            card: {
                brand: c.brand,
                last4: c.last4,
                exp_month: c.exp_month,
                exp_year: c.exp_year,
            },
        };
    }
    return { id, type: pmType };
}

/**
 * Build {@link StripeSubscriptionResource} from Stripe `subscriptions.retrieve` (+ expansions).
 * Validates required fields instead of asserting SDK types onto app types.
 */
export function subscriptionResourceFromStripeRetrieve(
    retrieved: RetrievedSub,
): StripeSubscriptionResource {
    if (retrieved == null || typeof retrieved !== "object") {
        throw new Error("Stripe subscription payload missing");
    }
    const id = retrieved.id;
    if (typeof id !== "string" || !id) {
        throw new Error("Stripe subscription missing id");
    }
    const status = retrieved.status;
    if (typeof status !== "string" || !status) {
        throw new Error("Stripe subscription missing status");
    }

    return {
        id,
        status,
        customer: mapCustomer(retrieved.customer),
        current_period_start: requiredStripeNumber(retrieved, "current_period_start"),
        current_period_end: requiredStripeNumber(retrieved, "current_period_end"),
        trial_end: mapTrialEnd(retrieved.trial_end),
        metadata: mapMetadata(retrieved.metadata),
        default_payment_method: mapDefaultPm(retrieved.default_payment_method),
        items: mapItems(retrieved.items),
    };
}
