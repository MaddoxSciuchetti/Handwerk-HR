import { integrationsMocked, mockGroups, mockMailboxes } from "./integrations/localMock";
import { MICROSOFT_APP_AUTH_ERROR } from "./microsoft365/authError";
import { prisma } from "@/lib/prisma";
import { microsoftSimulationEnabled } from "@/constants/env";
import { microsoftGraphFetch } from "@/services/integrations/microsoftSimulation";
import {
    integrationsLive,
    loadMicrosoft365Config,
    NOT_LIVE_MESSAGE,
} from "@/services/integrations/runtime";
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
    simulated?: boolean;
};

export type TeamWelcomeMailResult =
    | { status: "sent" }
    | {
          status: "skipped";
          reason:
              | "already_sent"
              | "no_work_email"
              | "not_configured"
              | "not_live"
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
    const response = await microsoftGraphFetch(url, {
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
    const visited = new Set<string>();
    while (url) {
        if (visited.has(url)) return null;
        visited.add(url);
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

export async function listMicrosoftGroups(
    organizationId: string,
): Promise<
    | { groups: MicrosoftGroupOption[]; error: null }
    | { groups: []; error: string }
> {
    if (integrationsMocked()) return { groups: mockGroups, error: null };
    if (!integrationsLive() && !microsoftSimulationEnabled()) {
        return { groups: [], error: NOT_LIVE_MESSAGE };
    }
    const config = await loadMicrosoft365Config(organizationId);
    if (!config) return { groups: [], error: null };
    let authError = MICROSOFT_APP_AUTH_ERROR;
    const token = await microsoftGraphToken(config, (message) => {
        authError = message;
    });
    if (!token) {
        return {
            groups: [],
            error: authError,
        };
    }
    const groups = await listGraph<{
        id?: string;
        displayName?: string;
        mailEnabled?: boolean;
        mail?: string | null;
        isAssignableToRole?: boolean | null;
    }>(
        token,
        "/groups?$select=id,displayName,mailEnabled,mail,isAssignableToRole&$top=999",
    );
    if (!groups) {
        return {
            groups: [],
            error: "Microsoft-Gruppen konnten nicht geladen werden. Bitte die Administration bitten, die Graph-Anwendungsberechtigung Group.Read.All und die Administratorzustimmung in Microsoft Entra zu prüfen.",
        };
    }
    return {
        groups: groups
            .filter((group) => {
                // Directory security groups are not email audiences. Keep normal
                // mail-enabled groups, including distribution and Microsoft 365 groups.
                if (
                    group.mailEnabled !== true ||
                    !group.mail?.trim().includes("@") ||
                    group.isAssignableToRole === true
                ) return false;
                const name = group.displayName?.trim() ?? "";
                // Answers creates an internal backing group that is not a mailing audience.
                return (
                    !/^group for answers in viva engage(?:\s|$)/i.test(name) &&
                    name.toLowerCase() !== "aad dc administrators"
                );
            })
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
        listMicrosoftGroups(organizationId),
    ]);
    return {
        settings,
        groups: listed.groups,
        groupsError: listed.error,
        simulated: microsoftSimulationEnabled(),
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

export async function microsoftGroupRecipientAddresses(
    token: string,
    groupId: string,
) {
    const members = await listGraph<GraphMember>(
        token,
        `/groups/${encodeURIComponent(groupId)}/transitiveMembers/microsoft.graph.user?$select=mail,userPrincipalName&$top=999`,
    );
    if (!members) return null;
    return welcomeRecipientAddresses(members);
}

export async function sendGraphMail(params: {
    token: string;
    senderAddress: string;
    recipients: string[];
    subject: string;
    text: string;
    html?: string;
    rejectedLog: string;
    failureMessage: string;
}): Promise<
    | { status: "sent" }
    | { status: "skipped"; reason: "no_recipients" }
    | { status: "failed"; message: string }
> {
    if (params.recipients.length === 0) {
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
                        content: params.html ?? welcomeHtml(params.text),
                    },
                    toRecipients: params.recipients.map((address) => ({
                        emailAddress: { address },
                    })),
                },
                saveToSentItems: true,
            }),
        },
    );
    if (!response.ok) {
        console.error(params.rejectedLog, response.status);
        return { status: "failed", message: params.failureMessage };
    }
    return { status: "sent" };
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
    const recipients = await microsoftGroupRecipientAddresses(
        params.token,
        params.groupId,
    );
    if (!recipients) {
        return { status: "failed", message: params.failureMessage.members };
    }
    if (recipients.length === 0) {
        console.error(params.emptyLog);
        return { status: "skipped", reason: "no_recipients" };
    }
    return sendGraphMail({
        token: params.token,
        senderAddress: params.senderAddress,
        recipients,
        subject: params.subject,
        text: params.text,
        rejectedLog: params.rejectedLog,
        failureMessage: params.failureMessage.rejected,
    });
}

export type MicrosoftChannelOption = {
    id: string;
    displayName: string;
    email: string;
    teamName: string;
};

export type MicrosoftMailAddress = {
    email: string;
    label: string;
    kind: "mailbox" | "channel";
};

export type LicensedMicrosoftUser = {
    id: string;
    displayName: string;
    email: string;
};

export async function readLicensedMicrosoftUsers(token: string): Promise<LicensedMicrosoftUser[] | null> {
    const users = await listGraph<{
        id?: string;
        displayName?: string;
        mail?: string;
        userPrincipalName?: string;
        assignedLicenses?: Array<{ skuId?: string }>;
    }>(token, "/users?$select=id,displayName,mail,userPrincipalName,assignedLicenses&$top=999");
    if (!users) return null;
    const seen = new Set<string>();
    return users.flatMap((user) => {
        if (!user.id || !user.assignedLicenses?.length) return [];
        const email = (user.mail?.trim() || user.userPrincipalName?.trim() || "").toLowerCase();
        if (!email.includes("@") || seen.has(email)) return [];
        seen.add(email);
        return [{ id: user.id, displayName: user.displayName?.trim() || email, email }];
    }).sort((left, right) => left.displayName.localeCompare(right.displayName, "de"));
}

export async function listLicensedMicrosoftUsers(organizationId: string) {
    if (!integrationsLive()) return { users: [], error: NOT_LIVE_MESSAGE };
    const config = await loadMicrosoft365Config(organizationId);
    if (!config) return { users: [], error: null };
    const token = await microsoftGraphToken(config);
    if (!token) return { users: [], error: "Microsoft Graph hat die Anmeldung abgelehnt." };
    const users = await readLicensedMicrosoftUsers(token);
    return { users: users ?? [], error: users ? null : "Microsoft Graph hat die lizenzierten Benutzer nicht geliefert." };
}

export async function listMicrosoftMailAddresses(
    organizationId: string,
): Promise<{ addresses: MicrosoftMailAddress[]; error: string | null }> {
    if (integrationsMocked()) return { addresses: mockMailboxes, error: null };
    if (!integrationsLive() && !microsoftSimulationEnabled()) {
        return { addresses: [], error: NOT_LIVE_MESSAGE };
    }
    const config = await loadMicrosoft365Config(organizationId);
    if (!config) return { addresses: [], error: null };
    let authError = MICROSOFT_APP_AUTH_ERROR;
    const token = await microsoftGraphToken(config, (message) => {
        authError = message;
    });
    if (!token) {
        return {
            addresses: [],
            error: authError,
        };
    }
    const [users, channels] = await Promise.all([
        listGraph<{
            displayName?: string;
            mail?: string;
            userPrincipalName?: string;
        }>(token, "/users?$select=displayName,mail,userPrincipalName&$top=999"),
        listMailEnabledChannels(organizationId),
    ]);
    const addresses: MicrosoftMailAddress[] = [];
    const seen = new Set<string>();
    for (const user of users ?? []) {
        const email = (user.mail?.trim() || user.userPrincipalName?.trim() || "")
            .toLowerCase();
        if (!email.includes("@") || seen.has(email)) continue;
        seen.add(email);
        const name = user.displayName?.trim() || email;
        addresses.push({ email, label: `${name} · ${email}`, kind: "mailbox" });
    }
    for (const channel of channels.channels) {
        const email = channel.email.trim().toLowerCase();
        if (!email.includes("@") || seen.has(email)) continue;
        seen.add(email);
        addresses.push({
            email,
            label: `${channel.teamName} · ${channel.displayName} · ${email}`,
            kind: "channel",
        });
    }
    addresses.sort((left, right) => left.label.localeCompare(right.label, "de"));
    const error = !users
        ? "Microsoft-Postfächer konnten nicht geladen werden. Bitte die Administration bitten, die Graph-Anwendungsberechtigung User.Read.All und die Administratorzustimmung in Microsoft Entra zu prüfen."
        : channels.error;
    return { addresses, error };
}

export async function listMailEnabledChannels(
    organizationId: string,
): Promise<
    | { channels: MicrosoftChannelOption[]; error: null }
    | { channels: MicrosoftChannelOption[]; error: string }
> {
    if (integrationsMocked()) return { channels: [], error: null };
    if (!integrationsLive() && !microsoftSimulationEnabled()) {
        return { channels: [], error: NOT_LIVE_MESSAGE };
    }
    const config = await loadMicrosoft365Config(organizationId);
    if (!config) return { channels: [], error: null };
    let authError = MICROSOFT_APP_AUTH_ERROR;
    const token = await microsoftGraphToken(config, (message) => {
        authError = message;
    });
    if (!token) {
        return {
            channels: [],
            error: authError,
        };
    }
    const groups = await listGraph<{
        id?: string;
        displayName?: string;
        resourceProvisioningOptions?: string[];
    }>(
        token,
        "/groups?$select=id,displayName,resourceProvisioningOptions&$top=999",
    );
    if (!groups) {
        return {
            channels: [],
            error: "Teams-Kanäle konnten nicht geladen werden. Bitte die Administration bitten, die Graph-Anwendungsberechtigungen Group.Read.All und Channel.ReadBasic.All sowie die Administratorzustimmung in Microsoft Entra zu prüfen.",
        };
    }
    const teams = groups.filter(
        (group) =>
            group.id &&
            group.displayName &&
            group.resourceProvisioningOptions?.includes("Team"),
    );
    const channels: MicrosoftChannelOption[] = [];
    for (const team of teams.slice(0, 25)) {
        const teamId = team.id?.trim() ?? "";
        const { response, payload } = await graphJson(
            token,
            `${GRAPH}/teams/${encodeURIComponent(teamId)}/channels?$select=id,displayName,email`,
        );
        if (response.status === 403) {
            return {
                channels,
                error: "Teams-Kanäle konnten nicht geladen werden. Bitte die Administration bitten, die Graph-Anwendungsberechtigungen Group.Read.All und Channel.ReadBasic.All sowie die Administratorzustimmung in Microsoft Entra zu prüfen.",
            };
        }
        if (!response.ok) continue;
        const list = payload as GraphList<{
            id?: string;
            displayName?: string;
            email?: string;
        }> | null;
        for (const channel of list?.value ?? []) {
            const email = channel.email?.trim() ?? "";
            const id = channel.id?.trim() ?? "";
            const displayName = channel.displayName?.trim() ?? "";
            if (!id || !displayName || !email.includes("@")) continue;
            channels.push({
                id,
                displayName,
                email,
                teamName: team.displayName?.trim() ?? "",
            });
        }
    }
    channels.sort((left, right) =>
        `${left.teamName} ${left.displayName}`.localeCompare(
            `${right.teamName} ${right.displayName}`,
            "de",
        ),
    );
    return { channels, error: null };
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
            microsoftEmail: true,
            position: true,
            entryDate: true,
            welcomeMailSentAt: true,
        },
    });
    if (!worker) return { status: "skipped", reason: "worker_missing" };
    if (worker.welcomeMailSentAt) {
        return { status: "skipped", reason: "already_sent" };
    }
    const workEmail = worker.microsoftEmail?.trim() || worker.workEmail?.trim() || "";
    if (!workEmail) return { status: "skipped", reason: "no_work_email" };

    const settings = await readWelcomeMailSettings(params.organizationId);
    if (!teamMailSettingsComplete(settings)) {
        return { status: "skipped", reason: "not_configured" };
    }
    if (!integrationsLive() && !microsoftSimulationEnabled()) {
        return { status: "skipped", reason: "not_live" };
    }
    const config = await loadMicrosoft365Config(params.organizationId);
    if (!config) return { status: "skipped", reason: "not_configured" };

    let authError = MICROSOFT_APP_AUTH_ERROR;
    const token = await microsoftGraphToken(config, (message) => {
        authError = message;
    });
    if (!token) {
        return {
            status: "failed",
            message: authError,
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
