import { OK, UNAUTHORIZED } from "@/constants/http";
import { createCheckoutSessionSchema } from "@/schemas/billing.schemas";
import { createCheckoutSessionUrl } from "@/services/billing.service";
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
