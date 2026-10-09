import { ARBEITSZEUGNIS } from "@/constants/taskAutomation.consts";
import { prisma } from "@/lib/prisma";
import { valuesForDocumentSegments } from "@/services/contractFieldMatch";
import {
    readDocumentSegments,
    textFromSegments,
    type DocumentSegment,
} from "@/services/documentBody";
import { microsoftGraphToken } from "@/services/microsoft365Account";
import { formatWelcomeEntryDate } from "@/services/welcomeMail";
import { Prisma } from "@prisma/client";
import {
    prepareDocument,
    sendPreparedDocument,
    invalidatePreparedDocuments,
    outgoingPdfUrl,
    currentPreparation,
    DeliveryRejected,
} from "@/services/preparedDocument";
import {
    readStyledDocument,
    filledDocument,
    type StyledDocument,
} from "../../../shared/document";
import { validateFieldValues } from "../../../shared/documentRendering";
import { BAD_REQUEST } from "@/constants/http";
import AppError from "@/utils/AppError";
import { USE_MICROSOFT_MAIL } from "@/constants/env";
import { sendMail } from "@/utils/sendMail";

const GRAPH = "https://graph.microsoft.com/v1.0";
const SUBJECT = "Ihr Arbeitszeugnis";

export function certificateText(body: Prisma.JsonValue) {
    return textFromSegments(readDocumentSegments(body));
}

export type ArbeitszeugnisResult =
    | { status: "sent" }
    | { status: "already_sent" }
    | { status: "failed"; message: string };

type LetterWorker = {
    firstName: string;
    lastName: string;
    email: string;
    workEmail: string | null;
    phoneNumber: string | null;
    birthday: Date | null;
    position: string | null;
    street: string | null;
    city: string | null;
    postalCode: string | null;
    entryDate: Date | null;
    exitDate: Date | null;
};

function letterFields(params: {
    worker: LetterWorker;
    endDate: Date | null;
    onboardingStart: Date | null;
}) {
    const firstName = params.worker.firstName.trim();
    const lastName = params.worker.lastName.trim();
    const street = params.worker.street?.trim() ?? "";
    const postalCode = params.worker.postalCode?.trim() ?? "";
    const city = params.worker.city?.trim() ?? "";
    const locality = `${postalCode} ${city}`.trim();

    return {
        firstName,
        lastName,
        fullName: [firstName, lastName]
            .filter((part) => part.length > 0)
            .join(" "),
        email: params.worker.email.trim(),
        workEmail: params.worker.workEmail?.trim() ?? "",
        position: params.worker.position?.trim() ?? "",
        phone: params.worker.phoneNumber?.trim() ?? "",
        birthday: formatWelcomeEntryDate(params.worker.birthday),
        address: [street, locality]
            .filter((part) => part.length > 0)
            .join(", "),
        street,
        postalCode,
        city,
        entryDate:
            formatWelcomeEntryDate(params.worker.entryDate) ||
            formatWelcomeEntryDate(params.onboardingStart),
        exitDate:
            formatWelcomeEntryDate(params.endDate) ||
            formatWelcomeEntryDate(params.worker.exitDate),
    };
}

async function senderAddress(organizationId: string) {
    const departure = await prisma.departureMailSettings.findUnique({
        where: { organizationId },
        select: { senderAddress: true },
    });
    const departureSender = departure?.senderAddress.trim() ?? "";
    if (departureSender) return departureSender;

    const welcome = await prisma.welcomeMailSettings.findUnique({
        where: { organizationId },
        select: { senderAddress: true },
    });
    return welcome?.senderAddress.trim() ?? "";
}

const LETTER_FIELD_LABELS = [
    ["firstName", "Vorname"],
    ["lastName", "Nachname"],
    ["fullName", "Name"],
    ["email", "E-Mail"],
    ["workEmail", "Arbeitsmail"],
    ["position", "Position"],
    ["phone", "Telefon"],
    ["birthday", "Geburtstag"],
    ["street", "Straße"],
    ["postalCode", "PLZ"],
    ["city", "Ort"],
    ["address", "Adresse"],
    ["entryDate", "Eintritt"],
    ["exitDate", "Austritt"],
] as const;

export type LetterValue = {
    key: string;
    label: string;
    value: string;
};

function unplacedLetterValues(
    fields: Record<string, string>,
    placed: Record<string, string>,
): LetterValue[] {
    const used = new Set(
        Object.values(placed)
            .map((value) => value.trim())
            .filter((value) => value.length > 0),
    );
    return LETTER_FIELD_LABELS.flatMap(([key, label]) => {
        const value = fields[key]?.trim() ?? "";
        if (!value || used.has(value)) return [];
        return [{ key, label, value }];
    });
}

async function loadLetter(params: {
    organizationId: string;
    engagementId: string;
}) {
    const engagement = await prisma.workerEngagement.findFirst({
        where: {
            id: params.engagementId,
            organizationId: params.organizationId,
        },
        select: {
            id: true,
            workerId: true,
            endDate: true,
            arbeitszeugnis: {
                select: {
                    sentAt: true,
                    body: true,
                    draftValues: true,
                    outgoingPdfId: true,
                    master: { select: { name: true } },
                },
            },
            worker: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    workEmail: true,
                    phoneNumber: true,
                    birthday: true,
                    position: true,
                    street: true,
                    city: true,
                    postalCode: true,
                    entryDate: true,
                    exitDate: true,
                    engagements: {
                        where: { type: "onboarding" },
                        orderBy: { startDate: "asc" },
                        take: 1,
                        select: { startDate: true },
                    },
                },
            },
        },
    });
    if (!engagement) return { status: "missing" as const };

    const setting = await prisma.automationDocumentSetting.findUnique({
        where: {
            organizationId_automation: {
                organizationId: params.organizationId,
                automation: ARBEITSZEUGNIS,
            },
        },
        select: {
            documentMaster: {
                select: { id: true, name: true, kind: true, body: true },
            },
        },
    });
    return {
        status: "found" as const,
        engagement,
        master: setting?.documentMaster ?? null,
    };
}

export type ArbeitszeugnisPreview = {
    masterId: string;
    name: string;
    workerId: string;
    engagementId: string;
    segments: DocumentSegment[];
    document: StyledDocument;
    values: Record<string, string>;
    unmatched: LetterValue[];
    unresolved: { key: string; label: string }[];
    alreadySent: boolean;
    outgoingFileUrl?: string | null;
    prepared?: Awaited<ReturnType<typeof currentPreparation>>;
};

export async function previewArbeitszeugnis(params: {
    organizationId: string;
    engagementId: string;
}): Promise<
    | { status: "ready"; preview: ArbeitszeugnisPreview }
    | { status: "failed"; message: string }
> {
    const loaded = await loadLetter(params);
    if (loaded.status === "missing") {
        return { status: "failed", message: "Aufgabe nicht gefunden." };
    }
    const { engagement, master } = loaded;
    if (engagement.arbeitszeugnis?.sentAt) {
        return {
            status: "ready",
            preview: {
                masterId: master?.id ?? "",
                name: engagement.arbeitszeugnis.master.name,
                workerId: engagement.workerId,
                engagementId: engagement.id,
                segments: readDocumentSegments(engagement.arbeitszeugnis.body),
                document: readStyledDocument(engagement.arbeitszeugnis.body),
                values: {},
                unmatched: [],
                unresolved: [],
                alreadySent: true,
                outgoingFileUrl: await outgoingPdfUrl(
                    { ...params, kind: "arbeitszeugnis" },
                    engagement.arbeitszeugnis.outgoingPdfId,
                ),
            },
        };
    }
    if (!master || master.kind !== "arbeitszeugnis") {
        return {
            status: "failed",
            message:
                "Für diese Automatisierung ist kein Arbeitszeugnis hinterlegt.",
        };
    }

    const segments = readDocumentSegments(master.body);
    const fields = letterFields({
        worker: engagement.worker,
        endDate: engagement.endDate,
        onboardingStart: engagement.worker.engagements[0]?.startDate ?? null,
    });
    const filled = valuesForDocumentSegments(segments, fields);
    const draft = engagement.arbeitszeugnis?.draftValues as Record<
        string,
        string
    > | null;
    const allowed = new Set(
        segments.flatMap((segment) =>
            segment.type === "input" ? [segment.key] : [],
        ),
    );
    const values = Object.fromEntries(
        Object.entries({ ...filled.values, ...(draft ?? {}) }).filter(([key]) =>
            allowed.has(key),
        ),
    );
    for (const s of segments)
        if (
            s.type === "input" &&
            s.fieldType === "checkbox" &&
            values[s.key] === undefined
        )
            values[s.key] = "false";
    return {
        status: "ready",
        preview: {
            masterId: master.id,
            name: master.name,
            workerId: engagement.workerId,
            engagementId: engagement.id,
            segments,
            document: readStyledDocument(master.body),
            values,
            unmatched: unplacedLetterValues(fields, values),
            unresolved: filled.unresolved,
            alreadySent: false,
            prepared: await currentPreparation({
                ...params,
                kind: "arbeitszeugnis",
            }),
        },
    };
}

export async function saveArbeitszeugnisDraft(params: {
    organizationId: string;
    engagementId: string;
    values: Record<string, string>;
}) {
    const loaded = await loadLetter(params);
    if (
        loaded.status !== "found" ||
        !loaded.master ||
        loaded.engagement.arbeitszeugnis?.sentAt
    )
        throw new AppError(
            BAD_REQUEST,
            "Arbeitszeugnis kann nicht bearbeitet werden.",
        );
    const document = readStyledDocument(loaded.master.body);
    const master = loaded.master;
    let values: Record<string, string>;
    try {
        values = validateFieldValues(document, params.values, false);
    } catch (error) {
        throw new AppError(BAD_REQUEST, (error as Error).message);
    }
    await prisma.$transaction(async (tx) => {
        await invalidatePreparedDocuments(
            {
                organizationId: params.organizationId,
                engagementId: params.engagementId,
                kind: "arbeitszeugnis",
            },
            tx,
        );
        const latest = await tx.arbeitszeugnis.findUnique({
            where: { engagementId: params.engagementId },
        });
        if (latest?.sentAt)
            throw new AppError(
                BAD_REQUEST,
                "Arbeitszeugnis wurde bereits versendet.",
            );
        await tx.arbeitszeugnis.upsert({
            where: { engagementId: params.engagementId },
            create: {
                engagementId: params.engagementId,
                masterId: master.id,
                body: master.body as Prisma.InputJsonValue,
                draftValues: values,
            },
            update: { masterId: master.id, draftValues: values },
        });
    });
}

export async function prepareArbeitszeugnisPdf(params: {
    organizationId: string;
    engagementId: string;
    values: Record<string, string>;
}) {
    await saveArbeitszeugnisDraft(params);
    const loaded = await loadLetter(params);
    if (loaded.status !== "found" || !loaded.master)
        throw new AppError(BAD_REQUEST, "Vorlage fehlt.");
    return prepareDocument({
        ...params,
        kind: "arbeitszeugnis",
        masterId: loaded.master.id,
        recipient: loaded.engagement.worker.email,
    });
}

export async function sendArbeitszeugnis(params: {
    organizationId: string;
    engagementId: string;
    artifactId: string;
    actorUserId: string;
}): Promise<ArbeitszeugnisResult> {
    const loaded = await loadLetter(params);
    if (loaded.status === "missing")
        return { status: "failed", message: "Aufgabe nicht gefunden." };
    const { engagement, master } = loaded;
    if (engagement.arbeitszeugnis?.sentAt) return { status: "already_sent" };
    if (!master) return { status: "failed", message: "Vorlage fehlt." };
    const selected = await prisma.preparedDocument.findFirst({
        where: {
            id: params.artifactId,
            masterId: master.id,
            organizationId: params.organizationId,
        },
    });
    if (!selected)
        throw new AppError(
            BAD_REQUEST,
            "PDF gehört nicht zur ausgewählten Vorlage.",
        );
    const from = USE_MICROSOFT_MAIL
        ? await senderAddress(params.organizationId)
        : "";
    const token = USE_MICROSOFT_MAIL ? await microsoftGraphToken() : "";
    if (USE_MICROSOFT_MAIL && (!from || !token))
        return {
            status: "failed",
            message: "Microsoft 365 und Absender müssen eingerichtet sein.",
        };
    await sendPreparedDocument({
        ...params,
        kind: "arbeitszeugnis",
        recipient: engagement.worker.email,
        deliver: async (attachment, artifactId) => {
            if (!USE_MICROSOFT_MAIL) {
                const sent = await sendMail({
                    to: engagement.worker.email,
                    subject: SUBJECT,
                    text: "Anbei Ihr Arbeitszeugnis als PDF.",
                    html: "<p>Anbei Ihr Arbeitszeugnis als PDF.</p>",
                    attachments: [attachment],
                    idempotencyKey: artifactId,
                });
                if (sent.error) {
                    if (
                        [
                            "validation_error",
                            "invalid_parameter",
                            "missing_required_field",
                            "restricted_api_key",
                            "invalid_api_key",
                        ].includes(sent.error.name)
                    )
                        throw new DeliveryRejected(sent.error.message);
                    throw new Error(sent.error.message);
                }
                return "resend:" + artifactId;
            }
            const response = await fetch(
                `${GRAPH}/users/${encodeURIComponent(from)}/sendMail`,
                {
                    method: "POST",
                    signal: AbortSignal.timeout(30_000),
                    headers: {
                        Authorization: "Bearer " + token,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: {
                            subject: SUBJECT,
                            body: {
                                contentType: "HTML",
                                content:
                                    "<p>Anbei Ihr Arbeitszeugnis als PDF.</p>",
                            },
                            toRecipients: [
                                {
                                    emailAddress: {
                                        address: engagement.worker.email,
                                    },
                                },
                            ],
                            attachments: [
                                {
                                    "@odata.type":
                                        "#microsoft.graph.fileAttachment",
                                    name: attachment.filename,
                                    contentType: attachment.contentType,
                                    contentBytes:
                                        attachment.content.toString("base64"),
                                },
                            ],
                        },
                        saveToSentItems: true,
                    }),
                },
            );
            if (!response.ok) {
                if (response.status >= 400 && response.status < 500)
                    throw new DeliveryRejected(
                        "Microsoft Graph rejected delivery",
                    );
                throw new Error("Microsoft Graph delivery failed");
            }
            return "graph:" + params.artifactId;
        },
        finalize: async (tx, document, values, artifactId) => {
            await tx.arbeitszeugnis.upsert({
                where: { engagementId: engagement.id },
                create: {
                    engagementId: engagement.id,
                    masterId: master.id,
                    body: filledDocument(
                        document,
                        values,
                    ) as unknown as Prisma.InputJsonValue,
                    draftValues: values,
                    outgoingPdfId: artifactId,
                    sentAt: new Date(),
                },
                update: {
                    masterId: master.id,
                    body: filledDocument(
                        document,
                        values,
                    ) as unknown as Prisma.InputJsonValue,
                    draftValues: values,
                    outgoingPdfId: artifactId,
                    sentAt: new Date(),
                },
            });
        },
    });
    return { status: "sent" };
}
