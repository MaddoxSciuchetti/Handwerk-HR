import { prisma } from "@/lib/prisma";
import { microsoftGraphToken } from "@/services/microsoft365Account";

const GRAPH = "https://graph.microsoft.com/v1.0";
export const WELCOME_MAIL_TASK_TITLE = "Willkommensmail an das Team";

export type WelcomeMailSettingsRecord = {
    senderAddress: string;
    groupId: string;
    groupName: string;
    subject: string;
    body: string;
};

export type MicrosoftGroupOption = {
    id: string;
    displayName: string;
};

export type WelcomeMailPage = {
    settings: WelcomeMailSettingsRecord | null;
    groups: MicrosoftGroupOption[];
    groupsError: string | null;
};

export type TeamWelcomeMailResult =
    | { status: "sent" }
    | {
          status: "skipped";
          reason:
              | "already_sent"
              | "no_work_email"
              | "not_configured"
              | "no_recipients"
              | "worker_missing";
      }
    | { status: "failed"; message: string };

type GraphMember = {
    mail?: string | null;
    userPrincipalName?: string | null;
};

type GraphList<T> = {
    value?: T[];
    "@odata.nextLink"?: string;
};

const settingsSelect = {
    senderAddress: true,
    groupId: true,
    groupName: true,
    subject: true,
    body: true,
} as const;

export function applyWelcomeMailTemplate(
    template: string,
    values: {
        firstName: string;
        lastName: string;
        workEmail: string;
        position: string;
        entryDate: string;
    },
) {
    return template
        .replaceAll("{{Vorname}}", values.firstName)
        .replaceAll("{{Nachname}}", values.lastName)
        .replaceAll("{{Arbeitsmail}}", values.workEmail)
        .replaceAll("{{Position}}", values.position)
        .replaceAll("{{Eintritt}}", values.entryDate);
}

export function formatWelcomeEntryDate(value: Date | null) {
    if (!value) return "";
    return new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    }).format(value);
}

export function welcomeRecipientAddresses(members: GraphMember[]) {
    const addresses = new Set<string>();
    for (const member of members) {
        const address = (member.mail?.trim() || member.userPrincipalName?.trim() || "")
            .toLowerCase();
        if (!address.includes("@")) continue;
        addresses.add(address);
    }
    return [...addresses];
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function welcomeHtml(text: string) {
    return text
        .split("\n")
        .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<br>"))
        .join("");
}

export function teamMailSettingsComplete(
    settings: WelcomeMailSettingsRecord | null,
): settings is WelcomeMailSettingsRecord {
    if (!settings) return false;
    return [
        settings.senderAddress,
        settings.groupId,
        settings.groupName,
        settings.subject,
        settings.body,
    ].every((value) => value.trim().length > 0);
}

async function graphJson(token: string, url: string, init?: RequestInit) {
    const response = await fetch(url, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });
    const text = await response.text();
    if (!text) return { response, payload: null };
    try {
        return { response, payload: JSON.parse(text) as unknown };
    } catch {
        return { response, payload: text };
    }
}

async function listGraph<T>(token: string, path: string) {
    const items: T[] = [];
    let url: string | null = `${GRAPH}${path}`;
    for (let page = 0; page < 10 && url; page += 1) {
        const { response, payload } = await graphJson(token, url);
        if (!response.ok) {
            console.error("Microsoft Graph request failed", response.status);
            return null;
        }
        const list = payload as GraphList<T> | null;
        items.push(...(list?.value ?? []));
        url = list?.["@odata.nextLink"] ?? null;
    }
    return items;
}

export async function listMicrosoftGroups(): Promise<
    | { groups: MicrosoftGroupOption[]; error: null }
    | { groups: []; error: string }
> {
    const token = await microsoftGraphToken();
    if (!token) {
        return { groups: [], error: "Microsoft 365 ist nicht konfiguriert." };
    }
    const groups = await listGraph<{ id?: string; displayName?: string }>(
        token,
        "/groups?$select=id,displayName&$top=999",
    );
    if (!groups) {
        return {
            groups: [],
            error: "Microsoft Graph hat die Gruppen nicht geliefert.",
        };
    }
    return {
        groups: groups
            .map((group) => ({
                id: group.id?.trim() ?? "",
                displayName: group.displayName?.trim() ?? "",
            }))
            .filter((group) => group.id && group.displayName)
            .sort((left, right) =>
                left.displayName.localeCompare(right.displayName, "de"),
            ),
        error: null,
    };
}

export async function readWelcomeMailSettings(organizationId: string) {
    return prisma.welcomeMailSettings.findUnique({
        where: { organizationId },
        select: settingsSelect,
    });
}

export async function welcomeMailPage(
    organizationId: string,
): Promise<WelcomeMailPage> {
    const [settings, listed] = await Promise.all([
        readWelcomeMailSettings(organizationId),
        listMicrosoftGroups(),
    ]);
    return {
        settings,
        groups: listed.groups,
        groupsError: listed.error,
    };
}

export async function saveWelcomeMailSettings(
    organizationId: string,
    input: WelcomeMailSettingsRecord,
) {
    return prisma.welcomeMailSettings.upsert({
        where: { organizationId },
        create: { organizationId, ...input },
        update: input,
        select: settingsSelect,
    });
}

async function closeWelcomeMailTask(params: {
    engagementId: string;
    actorUserId: string;
    workerId: string;
}) {
    await prisma.$transaction(async (tx) => {
        await tx.worker.update({
            where: { id: params.workerId },
            data: { welcomeMailSentAt: new Date() },
        });
        const issues = await tx.issue.findMany({
            where: {
                workerEngagementId: params.engagementId,
                title: WELCOME_MAIL_TASK_TITLE,
                status: { not: "done" },
            },
            select: { id: true, status: true },
        });
        for (const issue of issues) {
            await tx.issue.update({
                where: { id: issue.id },
                data: { status: "done" },
            });
            await tx.issueAuditLog.create({
                data: {
                    issueId: issue.id,
                    actorUserId: params.actorUserId,
                    action: "issue.updated",
                    oldValue: { status: issue.status },
                    newValue: { status: "done" },
                },
            });
        }
    });
}

export async function sendGraphMailToGroup(params: {
    token: string;
    senderAddress: string;
    groupId: string;
    subject: string;
    text: string;
    emptyLog: string;
    rejectedLog: string;
    failureMessage: { members: string; rejected: string };
}): Promise<
    | { status: "sent" }
    | { status: "skipped"; reason: "no_recipients" }
    | { status: "failed"; message: string }
> {
    const members = await listGraph<GraphMember>(
        params.token,
        `/groups/${encodeURIComponent(params.groupId)}/transitiveMembers/microsoft.graph.user?$select=mail,userPrincipalName&$top=999`,
    );
    if (!members) {
        return { status: "failed", message: params.failureMessage.members };
    }

    const recipients = welcomeRecipientAddresses(members);
    if (recipients.length === 0) {
        console.error(params.emptyLog);
        return { status: "skipped", reason: "no_recipients" };
    }

    const { response } = await graphJson(
        params.token,
        `${GRAPH}/users/${encodeURIComponent(params.senderAddress)}/sendMail`,
        {
            method: "POST",
            body: JSON.stringify({
                message: {
                    subject: params.subject,
                    body: {
                        contentType: "HTML",
                        content: welcomeHtml(params.text),
                    },
                    toRecipients: recipients.map((address) => ({
                        emailAddress: { address },
                    })),
                },
                saveToSentItems: true,
            }),
        },
    );
    if (!response.ok) {
        console.error(params.rejectedLog, response.status);
        return { status: "failed", message: params.failureMessage.rejected };
    }
    return { status: "sent" };
}

export async function sendTeamWelcomeMail(params: {
    organizationId: string;
    workerId: string;
    engagementId: string;
    actorUserId: string;
}): Promise<TeamWelcomeMailResult> {
    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            position: true,
            entryDate: true,
            welcomeMailSentAt: true,
        },
    });
    if (!worker) return { status: "skipped", reason: "worker_missing" };
    if (worker.welcomeMailSentAt) {
        return { status: "skipped", reason: "already_sent" };
    }
    const workEmail = worker.workEmail?.trim() ?? "";
    if (!workEmail) return { status: "skipped", reason: "no_work_email" };

    const settings = await readWelcomeMailSettings(params.organizationId);
    if (!teamMailSettingsComplete(settings)) {
        console.error("Willkommensmail ist nicht konfiguriert.");
        return { status: "skipped", reason: "not_configured" };
    }

    const token = await microsoftGraphToken();
    if (!token) {
        return {
            status: "failed",
            message: "Microsoft Graph hat die Anmeldung abgelehnt.",
        };
    }

    const values = {
        firstName: worker.firstName.trim(),
        lastName: worker.lastName.trim(),
        workEmail,
        position: worker.position?.trim() ?? "",
        entryDate: formatWelcomeEntryDate(worker.entryDate),
    };
    const sent = await sendGraphMailToGroup({
        token,
        senderAddress: settings.senderAddress,
        groupId: settings.groupId,
        subject: applyWelcomeMailTemplate(settings.subject, values)
            .replace(/\s+/g, " ")
            .trim(),
        text: applyWelcomeMailTemplate(settings.body, values),
        emptyLog: "Die Willkommensmail hat keine Empfänger.",
        rejectedLog: "Microsoft Graph welcome mail failed",
        failureMessage: {
            members: "Microsoft Graph hat die Teammitglieder nicht geliefert.",
            rejected: "Microsoft Graph hat die Willkommensmail abgelehnt.",
        },
    });
    if (sent.status !== "sent") return sent;

    await closeWelcomeMailTask({
        engagementId: params.engagementId,
        actorUserId: params.actorUserId,
        workerId: worker.id,
    });
    return { status: "sent" };
}
