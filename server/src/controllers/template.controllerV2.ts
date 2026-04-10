import { BAD_REQUEST, CREATED, NOT_FOUND, OK } from "@/constants/http";
import {
    insertTemplate,
    insertTemplateTask,
    modifyTemplateTask,
    queryTemplateById,
    queryTemplates,
    queryTemplateTasks,
    removeTemplate,
    removeTemplateTask,
} from "@/services/template.serviceV2";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";

// ── IssueTemplate ────────────────────────────────────────────

const getParam = (param: string | string[]): string =>
    Array.isArray(param) ? param[0] : param;

export const createTemplate = catchErrors(async (req, res) => {
    const userId = req.userId;
    const orgId = req.orgId;
    const { name, description, type } = req.body;
    appAssert(type, BAD_REQUEST, "Template type is required");

    const template = await insertTemplate({
        name,
        description,
        type,
        organizationId: orgId,
        createdByUserId: userId,
    });

    return res.status(CREATED).json(template);
});

export const getTemplates = catchErrors(async (req, res) => {
    const orgId = req.orgId;

    const templates = await queryTemplates(orgId);

    return res.status(OK).json(templates);
});

export const getTemplateById = catchErrors(async (req, res) => {
    const id = getParam(req.params.id);
    const orgId = req.orgId;

    const template = await queryTemplateById(id, orgId);
    appAssert(template, NOT_FOUND, "Template not found");

    return res.status(OK).json(template);
});

export const deleteTemplate = catchErrors(async (req, res) => {
    const id = getParam(req.params.id);
    const orgId = req.orgId;

    await removeTemplate(id, orgId);

    return res.status(OK).json({ message: "Template deleted successfully" });
});

// ── TemplateItem ─────────────────────────────────────────────

export const createTemplateTask = catchErrors(async (req, res) => {
    const templateId = getParam(req.params.templateId);
    const orgId = req.orgId;
    const { title, description, defaultPriority, defaultStatus, orderIndex } =
        req.body;

    const task = await insertTemplateTask({
        templateId,
        organizationId: orgId,
        title,
        description,
        defaultPriority,
        defaultStatus,
        orderIndex,
    });

    return res.status(CREATED).json(task);
});

export const getTemplateTasks = catchErrors(async (req, res) => {
    const templateId = getParam(req.params.templateId);
    const orgId = req.orgId;

    const tasks = await queryTemplateTasks(templateId, orgId);

    return res.status(OK).json(tasks);
});

export const updateTemplateTask = catchErrors(async (req, res) => {
    const id = getParam(req.params.id);
    const { title, description, defaultPriority, defaultStatus, orderIndex } =
        req.body;

    const updated = await modifyTemplateTask(id, {
        title,
        description,
        defaultPriority,
        defaultStatus,
        orderIndex,
    });

    return res.status(OK).json(updated);
});

export const deleteTemplateTask = catchErrors(async (req, res) => {
    const id = getParam(req.params.id);

    await removeTemplateTask(id);

    return res.status(OK).json({ message: "Task deleted successfully" });
});
