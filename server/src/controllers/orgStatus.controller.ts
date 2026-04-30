import { CREATED, NO_CONTENT, OK, UNAUTHORIZED } from "@/constants/http";
import {
    createOrgStatusSchema,
    orgStatusEntityTypeSchema,
    updateOrgStatusSchema,
} from "@/schemas/orgStatus.schemas";
import {
    createOrganizationStatus,
    deleteOrganizationStatus,
    listOrganizationStatuses,
    updateOrganizationStatus,
} from "@/services/organizationStatus.service";
import appAssert from "@/utils/appAssert";
import { assertOrgOwner } from "@/utils/assertOrgOwner";
import catchErrors from "@/utils/catchErrors";

export const listOrgStatusesHandler = catchErrors(async (req, res) => {
    const orgId = req.orgId;
    appAssert(
        orgId,
        UNAUTHORIZED,
        "No organization associated with this account",
    );
    const raw = req.query.entityType;
    const single = Array.isArray(raw) ? raw[0] : raw;
    const entityType = orgStatusEntityTypeSchema.parse(single);
    const statuses = await listOrganizationStatuses(orgId, entityType);
    return res.status(OK).json({ statuses });
});

export const createOrgStatusHandler = catchErrors(async (req, res) => {
    const orgId = await assertOrgOwner(req.userId, req.orgId);
    const body = createOrgStatusSchema.parse(req.body);
    const row = await createOrganizationStatus(orgId, body.entityType, {
        name: body.name,
    });
    return res.status(CREATED).json({
        ...row,
        color: null,
        usageCount: 0,
    });
});

export const updateOrgStatusHandler = catchErrors(async (req, res) => {
    const orgId = await assertOrgOwner(req.userId, req.orgId);
    const statusId = String(req.params.id);
    const body = updateOrgStatusSchema.parse(req.body);
    const row = await updateOrganizationStatus(orgId, statusId, body);
    return res.status(OK).json({
        ...row,
        color: null,
        usageCount: 0,
    });
});

export const deleteOrgStatusHandler = catchErrors(async (req, res) => {
    const orgId = await assertOrgOwner(req.userId, req.orgId);
    const statusId = String(req.params.id);
    await deleteOrganizationStatus(orgId, statusId);
    return res.status(NO_CONTENT).send();
});
