import { CREATED, OK, UNAUTHORIZED } from "@/constants/http";
import {
    acceptInviteSchema,
    createInviteSchema,
} from "@/schemas/invite.schemas";
import {
    acceptInvite,
    createInvite,
    getInviteByToken,
} from "@/services/invite.service";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";
import { setAuthCookies } from "@/utils/cookies";

export const createInviteHandler = catchErrors(async (req, res) => {
    const invitedByUserId = req.userId;
    appAssert(invitedByUserId, UNAUTHORIZED, "Not authenticated");

    const orgId = req.orgId;
    appAssert(
        orgId,
        UNAUTHORIZED,
        "No organization associated with this account",
    );

    const data = createInviteSchema.parse(req.body);
    const result = await createInvite(orgId, invitedByUserId, data);

    return res
        .status(CREATED)
        .json({ message: "Invite sent", inviteId: result.invite.id });
});

export const getInviteHandler = catchErrors(async (req, res) => {
    const token = String(req.params.token);
    const result = await getInviteByToken(token);
    return res.status(OK).json(result);
});

export const acceptInviteHandler = catchErrors(async (req, res) => {
    const token = String(req.params.token);
    const data = acceptInviteSchema.parse({
        ...req.body,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
    });
    const { user, organizationId, accessToken, refreshToken } =
        await acceptInvite(token, data);
    return setAuthCookies({ res, accessToken, refreshToken })
        .status(CREATED)
        .json({ user, organizationId });
});
