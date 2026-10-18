import { OK, UNAUTHORIZED } from "@/constants/http";
import { createCheckoutSessionSchema } from "@/schemas/billing.schemas";
import {
    createBillingPortalSessionUrl,
    createCheckoutSessionUrl,
    getBillingSubscriptionForOrg,
    listBillingInvoicesForOrg,
    type BillingSubscriptionJson,
} from "@/services/billing.service";
import { assertOrgAdmin } from "@/utils/assertOrgOwner";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";

function subscriptionForViewer(
    subscription: BillingSubscriptionJson | null,
    isAdmin: boolean,
) {
    if (!subscription) return null;
    const hasStripeSubscription = Boolean(subscription.stripeSubscriptionId);
    if (isAdmin) return { ...subscription, hasStripeSubscription };
    return {
        ...subscription,
        hasStripeSubscription,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        cardBrand: null,
        cardLast4: null,
        cardExpMonth: null,
        cardExpYear: null,
    };
}

export const createCheckoutSession = catchErrors(async (req, res) => {
    const organizationId = req.orgId;
    const userId = req.userId;
    appAssert(organizationId && userId, UNAUTHORIZED, "Missing auth context");
    assertOrgAdmin(req.membershipRole);

    const { price } = createCheckoutSessionSchema.parse(req.body);
    const url = await createCheckoutSessionUrl(price, {
        organizationId,
        userId,
    });
    return res.status(OK).json({ url });
});

export const createBillingPortalSession = catchErrors(async (req, res) => {
    const organizationId = req.orgId;
    appAssert(organizationId, UNAUTHORIZED, "Missing auth context");
    assertOrgAdmin(req.membershipRole);

    const url = await createBillingPortalSessionUrl(organizationId);
    return res.status(OK).json({ url });
});

export const listBillingInvoices = catchErrors(async (req, res) => {
    const organizationId = req.orgId;
    appAssert(organizationId, UNAUTHORIZED, "Missing auth context");
    assertOrgAdmin(req.membershipRole);

    const invoices = await listBillingInvoicesForOrg(organizationId);
    return res.status(OK).json({ invoices });
});

export const getBillingSubscription = catchErrors(async (req, res) => {
    const organizationId = req.orgId;
    appAssert(organizationId, UNAUTHORIZED, "Missing auth context");

    const subscription = await getBillingSubscriptionForOrg(organizationId);
    return res
        .status(OK)
        .json(subscriptionForViewer(subscription, req.membershipRole === "admin"));
});
