import { BAD_REQUEST, CREATED, NOT_FOUND, OK } from "@/constants/http";
import {
    createMailTemplate,
    deleteMailTemplate,
    listMailTemplates,
    mailTemplatePage,
    saveMailTemplateContent,
    updateMailTemplateDetails,
    type MailTemplateContent,
} from "@/services/mailTemplate";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";
import { z } from "zod";

const detailsInput = z.object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000),
});

const contentInput = z.object({
    subject: z.string().trim().min(1).max(400),
    body: z.string().trim().min(1).max(20_000),
}) satisfies z.ZodType<MailTemplateContent>;

const getParam = (param: string | string[]): string =>
    Array.isArray(param) ? param[0] : param;

export const getMailTemplates = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    return res.status(OK).json({
        success: true,
        data: await listMailTemplates(req.orgId),
    });
});

export const postMailTemplate = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const input = detailsInput.parse(req.body);
    return res.status(CREATED).json({
        success: true,
        data: await createMailTemplate(req.orgId, input),
    });
});

export const getMailTemplate = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const page = await mailTemplatePage(req.orgId, getParam(req.params.id));
    appAssert(page, NOT_FOUND, "E-Mail nicht gefunden.");
    return res.status(OK).json({ success: true, data: page });
});

export const putMailTemplateDetails = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const input = detailsInput.parse(req.body);
    const updated = await updateMailTemplateDetails(
        req.orgId,
        getParam(req.params.id),
        input,
    );
    appAssert(updated, NOT_FOUND, "E-Mail nicht gefunden.");
    return res.status(OK).json({ success: true, data: updated });
});

export const putMailTemplateContent = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const input = contentInput.parse(req.body);
    const updated = await saveMailTemplateContent(
        req.orgId,
        getParam(req.params.id),
        input,
    );
    appAssert(updated, NOT_FOUND, "E-Mail nicht gefunden.");
    return res.status(OK).json({ success: true, data: updated });
});

export const removeMailTemplate = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const removed = await deleteMailTemplate(
        req.orgId,
        getParam(req.params.id),
    );
    appAssert(removed, NOT_FOUND, "E-Mail nicht gefunden.");
    return res.status(OK).json({ success: true });
});
