import { microsoftSimulationEnabled } from "@/constants/env";
import { prisma } from "@/lib/prisma";
import {
    listMicrosoftGroups,
    type WelcomeMailPage,
    type WelcomeMailSettingsRecord,
} from "@/services/welcomeMail";

const listSelect = {
    id: true,
    name: true,
    description: true,
} as const;

const contentSelect = {
    senderAddress: true,
    groupId: true,
    groupName: true,
    subject: true,
    body: true,
} as const;

export type MailTemplateListItem = {
    id: string;
    name: string;
    description: string;
};

export type MailTemplatePage = WelcomeMailPage & {
    template: MailTemplateListItem;
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
    const listed = await listMicrosoftGroups(organizationId);
    const { senderAddress, groupId, groupName, subject, body, ...meta } =
        template;
    const settings: WelcomeMailSettingsRecord = {
        senderAddress,
        groupId,
        groupName,
        subject,
        body,
    };
    return {
        template: meta,
        settings,
        groups: listed.groups,
        groupsError: listed.error,
        simulated: microsoftSimulationEnabled(),
    };
}

export async function saveMailTemplateContent(
    organizationId: string,
    id: string,
    input: WelcomeMailSettingsRecord,
): Promise<WelcomeMailSettingsRecord | null> {
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
