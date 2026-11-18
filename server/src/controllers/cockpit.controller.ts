import { BAD_REQUEST, OK } from "@/constants/http";
import { getCockpitData } from "@/services/cockpit.service";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";

export const getCockpit = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const data = await getCockpitData(req.orgId);
    return res.status(OK).json({ success: true, data });
});
