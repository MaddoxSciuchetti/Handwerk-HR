import { BAD_REQUEST } from "@/constants/http";
import { ARBEITSZEUGNIS, taskAutomationName } from "@/constants/taskAutomation.consts";
import { prisma } from "@/lib/prisma";
import AppError from "@/utils/AppError";

const DOCUMENT_AUTOMATIONS = new Set<string>([ARBEITSZEUGNIS]);

export type AutomationDocumentPage = {
    automation: string;
    name: string;
    documentMasterId: string | null;
    masters: { id: string; name: string }[];
};

export function isDocumentAutomation(automation: string) {
    return DOCUMENT_AUTOMATIONS.has(automation);
}

export async function automationDocumentPage(
    organizationId: string,
    automation: string,
): Promise<AutomationDocumentPage> {
    const [setting, masters] = await Promise.all([
        prisma.automationDocumentSetting.findUnique({
            where: {
                organizationId_automation: { organizationId, automation },
            },
            select: { documentMasterId: true },
        }),
        prisma.documentMaster.findMany({
            where: { organizationId, kind: "arbeitszeugnis" },
            orderBy: { updatedAt: "desc" },
            select: { id: true, name: true },
        }),
    ]);

    return {
        automation,
        name: taskAutomationName(automation),
        documentMasterId: setting?.documentMasterId ?? null,
        masters,
    };
}

export async function saveAutomationDocument(params: {
    organizationId: string;
    automation: string;
    documentMasterId: string;
}) {
    const master = await prisma.documentMaster.findFirst({
        where: {
            id: params.documentMasterId,
            organizationId: params.organizationId,
            kind: "arbeitszeugnis",
        },
        select: { id: true },
    });
    if (!master) {
        throw new AppError(
            BAD_REQUEST,
            "Bitte ein Arbeitszeugnis aus den Dokumenten wählen.",
        );
    }

    await prisma.automationDocumentSetting.upsert({
        where: {
            organizationId_automation: {
                organizationId: params.organizationId,
                automation: params.automation,
            },
        },
        create: {
            organizationId: params.organizationId,
            automation: params.automation,
            documentMasterId: master.id,
        },
        update: { documentMasterId: master.id },
    });

    return automationDocumentPage(params.organizationId, params.automation);
}
