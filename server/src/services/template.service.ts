import { BAD_REQUEST } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import { sequenceMatchesProvider } from "@/services/integrations/catalog";
import AppError from "@/utils/AppError";
import type {
    IntegrationProvider,
    IntegrationSequence,
    IssueStatus,
} from "@prisma/client";


export type InsertTemplateParams = {
    name: string;
    description: string;
    organizationId: string;
    createdByUserId: string;
};

export type InsertTemplateTaskParams = {
    templateId: string;
    taskName: string;
    taskDescription?: string;
    description?: string;
    defaultStatus?: IssueStatus;
    defaultAssigneeUserId?: string;
    orderIndex?: number;
    integrationProvider?: IntegrationProvider | null;
    sequence?: IntegrationSequence | null;
    mailTemplateId?: string | null;
};

export type ModifyTemplateTaskParams = {
    taskName?: string;
    taskDescription?: string;
    defaultStatus?: IssueStatus;
    defaultAssigneeUserId?: string;
    orderIndex?: number;
    integrationProvider?: IntegrationProvider | null;
    sequence?: IntegrationSequence | null;
    mailTemplateId?: string | null;
};

const taskSelect = {
    id: true,
    title: true,
    description: true,
    defaultStatus: true,
    defaultAssigneeUserId: true,
    orderIndex: true,
    integrationProvider: true,
    sequence: true,
    mailTemplateId: true,
    createdAt: true,
    updatedAt: true,
} as const;

async function assertSequence(params: {
    organizationId: string;
    integrationProvider: IntegrationProvider | null;
    sequence: IntegrationSequence | null;
    mailTemplateId: string | null;
}) {
    if (!sequenceMatchesProvider(params.integrationProvider, params.sequence)) {
        throw new AppError(
            BAD_REQUEST,
            "Die Sequenz gehört nicht zu dieser Integration.",
        );
    }
    if (params.sequence === "microsoft_send_email") {
        if (!params.mailTemplateId) {
            throw new AppError(BAD_REQUEST, "Bitte wähle eine E-Mail-Vorlage.");
        }
        const template = await prisma.mailTemplate.findFirst({
            where: { id: params.mailTemplateId, organizationId: params.organizationId },
            select: { id: true },
        });
        if (!template) {
            throw new AppError(BAD_REQUEST, "Die E-Mail-Vorlage wurde nicht gefunden.");
        }
    }
    if (!params.integrationProvider) return;
    const integration = await prisma.organizationIntegration.findUnique({
        where: {
            organizationId_provider: {
                organizationId: params.organizationId,
                provider: params.integrationProvider,
            },
        },
        select: { enabled: true },
    });
    if (!integration?.enabled) {
        throw new AppError(
            BAD_REQUEST,
            "Diese Integration ist nicht aktiv.",
        );
    }
}


export const insertTemplate = async (data: InsertTemplateParams) => {
    return await prisma.issueTemplate.create({
        data: {
            name: data.name,
            description: data.description,
            organizationId: data.organizationId,
            createdByUserId: data.createdByUserId,
        },
        select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            createdAt: true,
            createdBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });
};

export const queryTemplates = async (orgId: string) => {
    return await prisma.issueTemplate.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            createdBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                },
            },
            _count: {
                select: { items: true },
            },
        },
    });
};

export const queryTemplateById = async (id: string, orgId: string) => {
    return await prisma.issueTemplate.findFirst({
        where: {
            id,
            organizationId: orgId,
        },
        select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            createdBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                },
            },
            items: {
                orderBy: { orderIndex: "asc" },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    defaultStatus: true,
                    defaultAssigneeUserId: true,
                    orderIndex: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });
};

export const removeTemplate = async (id: string, orgId: string) => {
    return await prisma.issueTemplate.delete({
        where: {
            id,
            organizationId: orgId, // scoped to org for safety
        },
    });
};

type ModifyTemplateParams = {
    name: string;
    description: string;
};

export const modifyTemplate = async (
    id: string,
    data: ModifyTemplateParams,
) => {
    return await prisma.issueTemplate.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
        },
    });
};


export const insertTemplateTask = async (
    data: InsertTemplateTaskParams & { organizationId: string },
) => {
    const template = await prisma.issueTemplate.findFirst({
        where: {
            id: data.templateId,
            organizationId: data.organizationId,
        },
        select: { id: true },
    });
    if (!template) throw new Error("Template not found");

    const integrationProvider = data.integrationProvider ?? null;
    const sequence = data.sequence ?? null;
    const mailTemplateId =
        sequence === "microsoft_send_email" ? (data.mailTemplateId ?? null) : null;
    await assertSequence({
        organizationId: data.organizationId,
        integrationProvider,
        sequence,
        mailTemplateId,
    });

    return await prisma.templateItem.create({
        data: {
            issueTemplateId: data.templateId,
            title: data.taskName,
            description: data.taskDescription,
            defaultStatus: data.defaultStatus,
            defaultAssigneeUserId: data.defaultAssigneeUserId,
            orderIndex: data.orderIndex ?? 0,
            integrationProvider,
            sequence,
            mailTemplateId,
        },
        select: taskSelect,
    });
};

export const queryTemplateTasks = async (templateId: string, orgId: string) => {
    const template = await prisma.issueTemplate.findFirst({
        where: {
            id: templateId,
            organizationId: orgId,
        },
        select: { id: true },
    });

    if (!template) return null;

    const tasks = await prisma.templateItem.findMany({
        where: { issueTemplateId: templateId },
        orderBy: { orderIndex: "asc" },
        select: taskSelect,
    });
    return { tasks };
};

export const modifyTemplateTask = async (
    id: string,
    organizationId: string,
    data: ModifyTemplateTaskParams,
) => {
    const integrationProvider = data.integrationProvider ?? null;
    const sequence = data.sequence ?? null;
    const mailTemplateId =
        sequence === "microsoft_send_email" ? (data.mailTemplateId ?? null) : null;
    await assertSequence({
        organizationId,
        integrationProvider,
        sequence,
        mailTemplateId,
    });
    return await prisma.templateItem.update({
        where: { id },
        data: {
            title: data.taskName,
            description: data.taskDescription,
            defaultStatus: data.defaultStatus,
            defaultAssigneeUserId: data.defaultAssigneeUserId,
            orderIndex: data.orderIndex,
            integrationProvider,
            sequence,
            mailTemplateId,
        },
        select: taskSelect,
    });
};

export const removeTemplateTask = async (id: string) => {
    return await prisma.templateItem.delete({
        where: { id },
    });
};
