import { prisma } from "@/lib/prisma";
import type { IssuePriority } from "@prisma/client";


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
    defaultPriority?: IssuePriority;
    orderIndex?: number;
};

export type ModifyTemplateTaskParams = {
    taskName?: string;
    taskDescription?: string;
    defaultPriority?: IssuePriority;
    orderIndex?: number;
};


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
                    defaultPriority: true,
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

    return await prisma.templateItem.create({
        data: {
            issueTemplateId: data.templateId,
            title: data.taskName,
            description: data.taskDescription,
            defaultPriority: data.defaultPriority,
            orderIndex: data.orderIndex ?? 0,
        },
        select: {
            id: true,
            title: true,
            description: true,
            defaultPriority: true,
            orderIndex: true,
            createdAt: true,
            updatedAt: true,
        },
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
        select: {
            id: true,
            title: true,
            description: true,
            defaultPriority: true,
            orderIndex: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return { tasks };
};

export const modifyTemplateTask = async (
    id: string,
    data: ModifyTemplateTaskParams,
) => {
    return await prisma.templateItem.update({
        where: { id },
        data: {
            title: data.taskName,
            description: data.taskDescription,
            defaultPriority: data.defaultPriority,
            orderIndex: data.orderIndex,
        },
        select: {
            id: true,
            title: true,
            description: true,
            defaultPriority: true,
            orderIndex: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

export const removeTemplateTask = async (id: string) => {
    return await prisma.templateItem.delete({
        where: { id },
    });
};
