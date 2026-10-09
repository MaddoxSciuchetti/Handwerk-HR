import { prisma } from "@/lib/prisma";
import { microsoftGraphToken } from "@/services/microsoft365Account";
import {
    applyWelcomeMailTemplate,
    formatWelcomeEntryDate,
    listMicrosoftGroups,
    sendGraphMailToGroup,
    teamMailSettingsComplete,
    type WelcomeMailPage,
    type WelcomeMailSettingsRecord,
} from "@/services/welcomeMail";

const settingsSelect = {
    senderAddress: true,
    groupId: true,
    groupName: true,
    subject: true,
    body: true,
} as const;

export type DepartureMailResult =
    | { status: "sent" }
    | { status: "already_sent" }
    | { status: "failed"; message: string };

export function applyDepartureMailTemplate(
    template: string,
    values: {
        firstName: string;
        lastName: string;
        workEmail: string;
        position: string;
        exitDate: string;
    },
) {
    return applyWelcomeMailTemplate(template, {
        firstName: values.firstName,
        lastName: values.lastName,
        workEmail: values.workEmail,
        position: values.position,
        entryDate: "",
    }).replaceAll("{{Entlassung}}", values.exitDate);
}

export async function readDepartureMailSettings(organizationId: string) {
    return prisma.departureMailSettings.findUnique({
        where: { organizationId },
        select: settingsSelect,
    });
}

export async function departureMailPage(
    organizationId: string,
): Promise<WelcomeMailPage> {
    const [settings, listed] = await Promise.all([
        readDepartureMailSettings(organizationId),
        listMicrosoftGroups(),
    ]);
    return {
        settings,
        groups: listed.groups,
        groupsError: listed.error,
    };
}

export async function saveDepartureMailSettings(
    organizationId: string,
    input: WelcomeMailSettingsRecord,
) {
    return prisma.departureMailSettings.upsert({
        where: { organizationId },
        create: { organizationId, ...input },
        update: input,
        select: settingsSelect,
    });
}

export async function sendTeamDepartureMail(params: {
    organizationId: string;
    workerId: string;
}): Promise<DepartureMailResult> {
    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            position: true,
            exitDate: true,
            departureMailSentAt: true,
        },
    });
    if (!worker) {
        return { status: "failed", message: "Mitarbeiter nicht gefunden." };
    }
    if (worker.departureMailSentAt) return { status: "already_sent" };

    const settings = await readDepartureMailSettings(params.organizationId);
    if (!teamMailSettingsComplete(settings)) {
        console.error("Entlassungsmail ist nicht konfiguriert.");
        return {
            status: "failed",
            message: "Die Entlassungsmail ist nicht konfiguriert.",
        };
    }

    const token = await microsoftGraphToken();
    if (!token) {
        return {
            status: "failed",
            message: "Microsoft 365 ist nicht konfiguriert.",
        };
    }

    const values = {
        firstName: worker.firstName.trim(),
        lastName: worker.lastName.trim(),
        workEmail: worker.workEmail?.trim() ?? "",
        position: worker.position?.trim() ?? "",
        exitDate: formatWelcomeEntryDate(worker.exitDate),
    };
    const sent = await sendGraphMailToGroup({
        token,
        senderAddress: settings.senderAddress,
        groupId: settings.groupId,
        subject: applyDepartureMailTemplate(settings.subject, values)
            .replace(/\s+/g, " ")
            .trim(),
        text: applyDepartureMailTemplate(settings.body, values),
        emptyLog: "Die Entlassungsmail hat keine Empfänger.",
        rejectedLog: "Microsoft Graph dismissal mail failed",
        failureMessage: {
            members: "Microsoft Graph hat die Teammitglieder nicht geliefert.",
            rejected: "Microsoft Graph hat die Entlassungsmail abgelehnt.",
        },
    });
    if (sent.status === "skipped") {
        return {
            status: "failed",
            message: "Die Entlassungsmail hat keine Empfänger.",
        };
    }
    if (sent.status === "failed") return sent;

    await prisma.worker.update({
        where: { id: worker.id },
        data: { departureMailSentAt: new Date() },
    });
    return { status: "sent" };
}
