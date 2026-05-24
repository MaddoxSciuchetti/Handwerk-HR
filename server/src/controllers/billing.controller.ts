import { OK, UNAUTHORIZED } from "@/constants/http";
import { createCheckoutSessionSchema } from "@/schemas/billing.schemas";
import {
    createBillingPortalSessionUrl,
    createCheckoutSessionUrl,
    getBillingSubscriptionForOrg,
} from "@/services/billing.service";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";

export const createCheckoutSession = catchErrors(async (req, res) => {
    const organizationId = req.orgId;
    const userId = req.userId;
    appAssert(organizationId && userId, UNAUTHORIZED, "Missing auth context");

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

    const url = await createBillingPortalSessionUrl(organizationId);
    return res.status(OK).json({ url });
});

export const getBillingSubscription = catchErrors(async (req, res) => {
    const organizationId = req.orgId;
    appAssert(organizationId, UNAUTHORIZED, "Missing auth context");

    const subscription = await getBillingSubscriptionForOrg(organizationId);
    return res.status(OK).json(subscription);
});
