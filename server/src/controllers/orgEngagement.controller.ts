import { OK, UNAUTHORIZED } from "@/constants/http";
import { listOrgEngagements } from "@/services/orgEngagement.service";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";

export const listOrgEngagementsHandler = catchErrors(async (req, res) => {
    const orgId = req.orgId;
    appAssert(
        orgId,
        UNAUTHORIZED,
        "No organization associated with this account",
    );
    const engagements = await listOrgEngagements(orgId);
    return res.status(OK).json({ engagements });
});
