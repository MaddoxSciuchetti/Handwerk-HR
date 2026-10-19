import { prisma } from "@/lib/prisma";

const listSelect = {
    id: true,
    name: true,
    description: true,
} as const;

const contentSelect = {
    subject: true,
    body: true,
} as const;

export type MailTemplateContent = {
    subject: string;
    body: string;
};

export type MailTemplateListItem = {
    id: string;
    name: string;
    description: string;
};

export type MailTemplatePage = {
    template: MailTemplateListItem;
    settings: MailTemplateContent;
};

export async function listMailTemplates(
    organizationId: string,
): Promise<MailTemplateListItem[]> {
    return prisma.mailTemplate.findMany({
        where: { organizationId },
        select: listSelect,
        orderBy: { createdAt: "asc" },
    });
}

export async function createMailTemplate(
    organizationId: string,
    input: { name: string; description: string },
): Promise<MailTemplateListItem> {
    return prisma.mailTemplate.create({
        data: { organizationId, ...input },
        select: listSelect,
    });
}

export async function updateMailTemplateDetails(
    organizationId: string,
    id: string,
    input: { name: string; description: string },
): Promise<MailTemplateListItem | null> {
    const existing = await prisma.mailTemplate.findFirst({
        where: { id, organizationId },
        select: { id: true },
    });
    if (!existing) return null;
    return prisma.mailTemplate.update({
        where: { id },
        data: input,
        select: listSelect,
    });
}

export async function mailTemplatePage(
    organizationId: string,
    id: string,
): Promise<MailTemplatePage | null> {
    const template = await prisma.mailTemplate.findFirst({
        where: { id, organizationId },
        select: { ...listSelect, ...contentSelect },
    });
    if (!template) return null;
    const { subject, body, ...meta } = template;
    return {
        template: meta,
        settings: { subject, body },
    };
}

export async function saveMailTemplateContent(
    organizationId: string,
    id: string,
    input: MailTemplateContent,
): Promise<MailTemplateContent | null> {
    const existing = await prisma.mailTemplate.findFirst({
        where: { id, organizationId },
        select: { id: true },
    });
    if (!existing) return null;
    return prisma.mailTemplate.update({
        where: { id },
        data: input,
        select: contentSelect,
    });
}

export async function deleteMailTemplate(
    organizationId: string,
    id: string,
): Promise<boolean> {
    const existing = await prisma.mailTemplate.findFirst({
        where: { id, organizationId },
        select: { id: true },
    });
    if (!existing) return false;
    await prisma.mailTemplate.delete({ where: { id } });
    return true;
}
