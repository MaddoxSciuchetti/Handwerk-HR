import type { EngagementMailRecipientKind } from "@prisma/client";
import { BAD_REQUEST } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import AppError from "@/utils/AppError";
import {
    integrationsLive,
    loadMicrosoft365Config,
    NOT_LIVE_MESSAGE,
} from "@/services/integrations/runtime";
import { microsoftGraphToken } from "@/services/microsoft365Account";
import {
    applyWelcomeMailTemplate,
    formatWelcomeEntryDate,
    listMailEnabledChannels,
    listMicrosoftGroups,
    microsoftGroupRecipientAddresses,
    sendGraphMail,
    type MicrosoftChannelOption,
    type MicrosoftGroupOption,
} from "@/services/welcomeMail";

export const MAIL_SEQUENCE = "microsoft_send_email";

const LEGACY_MAIL_SEQUENCES = [
    "microsoft_send_onboarding_email",
    "microsoft_send_offboarding_email",
    MAIL_SEQUENCE,
] as const;

export function isMailSequence(sequence: string | null | undefined) {
    return LEGACY_MAIL_SEQUENCES.some((value) => value === sequence);
}

export type MailRecipientInput = {
    kind: EngagementMailRecipientKind;
    label: string;
    address?: string | null;
    workerId?: string | null;
    groupId?: string | null;
};

export type StoredMailRecipient = {
    kind: EngagementMailRecipientKind;
    label: string;
    address: string | null;
    workerId: string | null;
    groupId: string | null;
};

export type MailSenderOption = {
    email: string;
    name: string;
};

export function applyEngagementMailTemplate(
    template: string,
    values: {
        firstName: string;
        lastName: string;
        workEmail: string;
        position: string;
        entryDate: string;
        exitDate: string;
    },
) {
    return applyWelcomeMailTemplate(template, values).replaceAll(
        "{{Entlassung}}",
        values.exitDate,
    );
}

const recipientSelect = {
    kind: true,
    label: true,
    address: true,
    workerId: true,
    groupId: true,
} as const;

export async function listMailSenders(
    organizationId: string,
): Promise<MailSenderOption[]> {
    const members = await prisma.organizationMember.findMany({
        where: {
            organizationId,
            status: "active",
            user: { status: "active", isVerified: true },
        },
        select: {
            user: {
                select: { email: true, firstName: true, lastName: true },
            },
        },
        orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
    });
    return members.flatMap((member) => {
        const email = member.user.email.trim();
        if (!email.includes("@")) return [];
        const name = `${member.user.firstName} ${member.user.lastName}`.trim();
        return [{ email, name: name || email }];
    });
}

async function engagementInOrg(organizationId: string, engagementId: string) {
    return prisma.workerEngagement.findFirst({
        where: { id: engagementId, organizationId },
        select: { id: true },
    });
}

export async function readEngagementMailRecipients(
    organizationId: string,
    engagementId: string,
): Promise<StoredMailRecipient[] | null> {
    const engagement = await engagementInOrg(organizationId, engagementId);
    if (!engagement) return null;
    return prisma.engagementMailRecipient.findMany({
        where: { engagementId },
        select: recipientSelect,
        orderBy: { createdAt: "asc" },
    });
}

export async function engagementMailOptions(organizationId: string) {
    const [workers, groups, channels] = await Promise.all([
        prisma.worker.findMany({
            where: { organizationId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                workEmail: true,
            },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        }),
        listMicrosoftGroups(organizationId),
        listMailEnabledChannels(organizationId),
    ]);
    return {
        workers,
        groups: groups.groups,
        groupsError: groups.error,
        channels: channels.channels,
        channelsError: channels.error,
    };
}

export async function saveEngagementMailRecipients(params: {
    organizationId: string;
    engagementId: string;
    recipients: MailRecipientInput[];
}): Promise<StoredMailRecipient[] | null> {
    const engagement = await engagementInOrg(
        params.organizationId,
        params.engagementId,
    );
    if (!engagement) return null;
    if (params.recipients.length > 50) {
        throw new AppError(BAD_REQUEST, "Höchstens 50 Empfänger.");
    }
    const rows = await normalizeRecipients(
        params.organizationId,
        params.recipients,
    );
    await prisma.$transaction(async (tx) => {
        await tx.engagementMailRecipient.deleteMany({
            where: { engagementId: params.engagementId },
        });
        if (rows.length === 0) return;
        await tx.engagementMailRecipient.createMany({
            data: rows.map((row) => ({
                engagementId: params.engagementId,
                ...row,
            })),
        });
    });
    return prisma.engagementMailRecipient.findMany({
        where: { engagementId: params.engagementId },
        select: recipientSelect,
        orderBy: { createdAt: "asc" },
    });
}

async function normalizeRecipients(
    organizationId: string,
    recipients: MailRecipientInput[],
): Promise<StoredMailRecipient[]> {
    const workerIds = recipients.flatMap((recipient) =>
        recipient.workerId ? [recipient.workerId] : [],
    );
    const workers = workerIds.length
        ? await prisma.worker.findMany({
              where: { organizationId, id: { in: workerIds } },
              select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  workEmail: true,
              },
          })
        : [];
    const byId = new Map(workers.map((worker) => [worker.id, worker]));
    const seen = new Set<string>();
    const rows: StoredMailRecipient[] = [];
    for (const recipient of recipients) {
        if (recipient.kind === "worker_private" || recipient.kind === "worker_work") {
            const worker = recipient.workerId
                ? byId.get(recipient.workerId)
                : undefined;
            if (!worker) throw new AppError(BAD_REQUEST, "Empfänger nicht gefunden.");
            const address =
                recipient.kind === "worker_private"
                    ? worker.email.trim()
                    : (worker.workEmail?.trim() ?? "");
            if (!address.includes("@")) {
                throw new AppError(
                    BAD_REQUEST,
                    "Für diesen Empfänger ist keine E-Mail hinterlegt.",
                );
            }
            const key = `${recipient.kind}:${worker.id}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const name = `${worker.firstName} ${worker.lastName}`.trim();
            rows.push({
                kind: recipient.kind,
                label:
                    recipient.kind === "worker_private"
                        ? `${name} · E-Mail`
                        : `${name} · Arbeits-E-Mail`,
                address,
                workerId: worker.id,
                groupId: null,
            });
            continue;
        }
        const groupId = recipient.groupId?.trim() ?? "";
        const label = recipient.label.trim();
        if (!groupId || !label) {
            throw new AppError(BAD_REQUEST, "Empfänger nicht gefunden.");
        }
        if (recipient.kind === "teams_channel") {
            const address = recipient.address?.trim() ?? "";
            if (!address.includes("@")) {
                throw new AppError(BAD_REQUEST, "Dieser Kanal hat keine E-Mail-Adresse.");
            }
            const key = `teams_channel:${groupId}`;
            if (seen.has(key)) continue;
            seen.add(key);
            rows.push({
                kind: "teams_channel",
                label,
                address,
                workerId: null,
                groupId,
            });
            continue;
        }
        if (recipient.kind !== "microsoft_group") {
            throw new AppError(BAD_REQUEST, "Empfänger nicht gefunden.");
        }
        const key = `microsoft_group:${groupId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({
            kind: "microsoft_group",
            label,
            address: null,
            workerId: null,
            groupId,
        });
    }
    return rows;
}

type MailWorker = {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string | null;
    position: string | null;
    entryDate: Date | null;
    exitDate: Date | null;
    departureMailSentAt: Date | null;
};

async function resolveRecipientAddresses(params: {
    token: string;
    organizationId: string;
    recipients: StoredMailRecipient[];
}): Promise<{ addresses: string[] } | { message: string }> {
    const addresses = new Set<string>();
    for (const recipient of params.recipients) {
        if (recipient.kind === "microsoft_group") {
            const groupId = recipient.groupId?.trim() ?? "";
            if (!groupId) {
                return { message: "Eine Microsoft-Gruppe ist nicht mehr gültig." };
            }
            const members = await microsoftGroupRecipientAddresses(
                params.token,
                groupId,
            );
            if (!members) {
                return {
                    message: "Microsoft Graph hat die Teammitglieder nicht geliefert.",
                };
            }
            for (const address of members) {
                addresses.add(address);
            }
            continue;
        }
        if (recipient.kind === "worker_private" || recipient.kind === "worker_work") {
            const worker = recipient.workerId
                ? await prisma.worker.findFirst({
                      where: {
                          id: recipient.workerId,
                          organizationId: params.organizationId,
                      },
                      select: { email: true, workEmail: true },
                  })
                : null;
            const address =
                recipient.kind === "worker_private"
                    ? (worker?.email.trim() ?? "")
                    : (worker?.workEmail?.trim() ?? "");
            if (!address.includes("@")) {
                return {
                    message: `${recipient.label} hat keine E-Mail mehr.`,
                };
            }
            addresses.add(address.toLowerCase());
            continue;
        }
        const address = recipient.address?.trim().toLowerCase() ?? "";
        if (!address.includes("@")) {
            return { message: `${recipient.label} hat keine E-Mail-Adresse.` };
        }
        addresses.add(address);
    }
    if (addresses.size === 0) {
        return { message: "Die E-Mail hat keine Empfänger." };
    }
    return { addresses: [...addresses] };
}

export async function mailSendPreview(params: {
    organizationId: string;
    issueId: string;
}): Promise<
    | {
          status: "ready";
          templateName: string;
          subject: string;
          body: string;
          recipients: StoredMailRecipient[];
          senders: MailSenderOption[];
      }
    | { status: "failed"; message: string }
> {
    const loaded = await loadIssueMail(params.organizationId, params.issueId);
    if ("message" in loaded) {
        return { status: "failed", message: loaded.message ?? "Aufgabe nicht gefunden." };
    }
    const [recipients, senders] = await Promise.all([
        prisma.engagementMailRecipient.findMany({
            where: { engagementId: loaded.engagementId },
            select: recipientSelect,
            orderBy: { createdAt: "asc" },
        }),
        listMailSenders(params.organizationId),
    ]);
    const values = mailValues(loaded.worker);
    return {
        status: "ready" as const,
        templateName: loaded.template.name,
        subject: filledSubject(loaded.template.subject, values),
        body: applyEngagementMailTemplate(loaded.template.body, values),
        recipients,
        senders,
    };
}

export async function sendIssueMail(params: {
    organizationId: string;
    issueId: string;
    senderAddress?: string | null;
    origin?: "departure";
    once?: "departure";
}): Promise<
    | { status: "sent" }
    | { status: "already_sent" }
    | { status: "failed"; message: string }
> {
    const loaded = await loadIssueMail(params.organizationId, params.issueId, {
        origin: params.origin,
    });
    if ("message" in loaded) {
        return {
            status: "failed",
            message: loaded.message ?? "Aufgabe nicht gefunden.",
        };
    }
    if (params.once === "departure" && loaded.worker.departureMailSentAt) {
        return { status: "already_sent" };
    }
    const sent = await deliverMail({
        organizationId: params.organizationId,
        engagementId: loaded.engagementId,
        worker: loaded.worker,
        template: loaded.template,
        senderAddress: params.senderAddress,
    });
    if (sent.status !== "sent") return sent;
    if (params.once === "departure") {
        await prisma.worker.update({
            where: { id: loaded.worker.id },
            data: { departureMailSentAt: new Date() },
        });
    }
    return { status: "sent" };
}

async function loadIssueMail(
    organizationId: string,
    issueId: string,
    options?: { origin?: "departure" },
) {
    const issue = await prisma.issue.findFirst({
        where: {
            id: issueId,
            workerEngagement: { organizationId },
        },
        select: {
            id: true,
            sequence: true,
            mailTemplateId: true,
            workerEngagement: {
                select: {
                    id: true,
                    workerId: true,
                },
            },
        },
    });
    if (!issue?.workerEngagement) return { message: "Aufgabe nicht gefunden." };
    const worker = await prisma.worker.findFirst({
        where: {
            id: issue.workerEngagement.workerId,
            organizationId,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            position: true,
            entryDate: true,
            exitDate: true,
            departureMailSentAt: true,
        },
    });
    if (!worker) return { message: "Mitarbeiter nicht gefunden." };
    if (!options?.origin && !isMailSequence(issue.sequence)) {
        return { message: "Für diese Aufgabe ist keine E-Mail-Sequenz hinterlegt." };
    }
    const template = options?.origin
        ? await prisma.mailTemplate.findFirst({
              where: { organizationId, origin: options.origin },
              select: { id: true, name: true, subject: true, body: true },
          })
        : issue.mailTemplateId
          ? await prisma.mailTemplate.findFirst({
                where: { id: issue.mailTemplateId, organizationId },
                select: { id: true, name: true, subject: true, body: true },
            })
          : null;
    if (!template || !template.subject.trim() || !template.body.trim()) {
        if (options?.origin === "departure" && worker.departureMailSentAt) {
            return {
                engagementId: issue.workerEngagement.id,
                worker,
                template: { id: "", name: "", subject: "-", body: "-" },
            };
        }
        return { message: "Für diese Aufgabe ist keine E-Mail-Vorlage hinterlegt." };
    }
    return {
        engagementId: issue.workerEngagement.id,
        worker,
        template,
    };
}

async function deliverMail(params: {
    organizationId: string;
    engagementId: string;
    worker: MailWorker;
    template: { subject: string; body: string };
    senderAddress?: string | null;
}): Promise<{ status: "sent" } | { status: "failed"; message: string }> {
    const senderAddress = params.senderAddress?.trim() ?? "";
    if (!senderAddress) {
        return { status: "failed", message: "Bitte einen Absender wählen." };
    }
    const sender = await prisma.organizationMember.findFirst({
        where: {
            organizationId: params.organizationId,
            status: "active",
            user: {
                status: "active",
                isVerified: true,
                email: { equals: senderAddress, mode: "insensitive" },
            },
        },
        select: { user: { select: { email: true } } },
    });
    if (!sender) {
        return {
            status: "failed",
            message: "Dieser Absender ist kein angemeldetes Organisationsmitglied.",
        };
    }
    const recipients = await prisma.engagementMailRecipient.findMany({
        where: { engagementId: params.engagementId },
        select: recipientSelect,
    });
    if (recipients.length === 0) {
        return {
            status: "failed",
            message: "Für dieses Engagement sind keine Empfänger gewählt.",
        };
    }
    if (!integrationsLive()) {
        return { status: "failed", message: NOT_LIVE_MESSAGE };
    }
    const config = await loadMicrosoft365Config(params.organizationId);
    if (!config) {
        return {
            status: "failed",
            message: "Microsoft 365 ist für diese Organisation nicht eingerichtet.",
        };
    }
    const token = await microsoftGraphToken(config);
    if (!token) {
        return {
            status: "failed",
            message: "Microsoft Graph hat die Anmeldung abgelehnt.",
        };
    }
    const resolved = await resolveRecipientAddresses({
        token,
        organizationId: params.organizationId,
        recipients,
    });
    if ("message" in resolved) return { status: "failed", message: resolved.message };
    const values = mailValues(params.worker);
    const sent = await sendGraphMail({
        token,
        senderAddress: sender.user.email.trim(),
        recipients: resolved.addresses,
        subject: filledSubject(params.template.subject, values),
        text: applyEngagementMailTemplate(params.template.body, values),
        rejectedLog: "Microsoft Graph engagement mail failed",
        failureMessage: "Microsoft Graph hat die E-Mail abgelehnt.",
    });
    if (sent.status === "skipped") {
        return { status: "failed", message: "Die E-Mail hat keine Empfänger." };
    }
    if (sent.status === "failed") return sent;
    return { status: "sent" };
}

function mailValues(worker: MailWorker) {
    return {
        firstName: worker.firstName.trim(),
        lastName: worker.lastName.trim(),
        workEmail: worker.workEmail?.trim() ?? "",
        position: worker.position?.trim() ?? "",
        entryDate: formatWelcomeEntryDate(worker.entryDate),
        exitDate: formatWelcomeEntryDate(worker.exitDate),
    };
}

function filledSubject(
    subject: string,
    values: ReturnType<typeof mailValues>,
) {
    return applyEngagementMailTemplate(subject, values).replace(/\s+/g, " ").trim();
}

export type { MicrosoftChannelOption, MicrosoftGroupOption };
