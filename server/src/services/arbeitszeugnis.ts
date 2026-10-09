import { ARBEITSZEUGNIS } from "@/constants/taskAutomation.consts";
import { prisma } from "@/lib/prisma";
import { valuesForDocumentSegments } from "@/services/contractFieldMatch";
import {
    documentBody,
    readDocumentSegments,
    textFromSegments,
    type DocumentSegment,
} from "@/services/documentBody";
import { microsoftGraphToken } from "@/services/microsoft365Account";
import { formatWelcomeEntryDate } from "@/services/welcomeMail";
import { Prisma } from "@prisma/client";

const GRAPH = "https://graph.microsoft.com/v1.0";
const SUBJECT = "Ihr Arbeitszeugnis";

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
        fullName: [firstName, lastName].filter((part) => part.length > 0).join(" "),
        email: params.worker.email.trim(),
        workEmail: params.worker.workEmail?.trim() ?? "",
        position: params.worker.position?.trim() ?? "",
        phone: params.worker.phoneNumber?.trim() ?? "",
        birthday: formatWelcomeEntryDate(params.worker.birthday),
        address: [street, locality].filter((part) => part.length > 0).join(", "),
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

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function letterHtml(
    name: string,
    segments: DocumentSegment[],
    values: Record<string, string>,
) {
    const htmlBody = segments
        .map((segment) => {
            if (segment.type === "text") {
                return escapeHtml(segment.text).replaceAll("\n", "<br>");
            }
            return `<strong>${escapeHtml(values[segment.key] ?? "")}</strong>`;
        })
        .join("");
    return `<div style="font-family:Arial,sans-serif;line-height:1.6"><h1>${escapeHtml(name)}</h1><div>${htmlBody}</div></div>`;
}

function filledSegments(
    segments: DocumentSegment[],
    values: Record<string, string>,
): DocumentSegment[] {
    return segments.map((segment) =>
        segment.type === "text"
            ? segment
            : { type: "text", text: values[segment.key] ?? "" },
    );
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

async function sendLetter(params: {
    token: string;
    senderAddress: string;
    to: string;
    name: string;
    segments: DocumentSegment[];
    values: Record<string, string>;
}) {
    const response = await fetch(
        `${GRAPH}/users/${encodeURIComponent(params.senderAddress)}/sendMail`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${params.token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: {
                    subject: SUBJECT,
                    body: {
                        contentType: "HTML",
                        content: letterHtml(params.name, params.segments, params.values),
                    },
                    toRecipients: [
                        { emailAddress: { address: params.to } },
                    ],
                },
                saveToSentItems: true,
            }),
        },
    );
    if (!response.ok) {
        console.error("Microsoft Graph reference letter failed", response.status);
        return false;
    }
    return true;
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

function suppliedValues(
    segments: DocumentSegment[],
    raw: Record<string, string>,
) {
    const values: Record<string, string> = {};
    const missing: string[] = [];
    const seen = new Set<string>();
    for (const segment of segments) {
        if (segment.type !== "input" || seen.has(segment.key)) continue;
        seen.add(segment.key);
        const value = (raw[segment.key] ?? "").trim().slice(0, 8000);
        if (!value) {
            missing.push(segment.label);
            continue;
        }
        values[segment.key] = value;
    }
    return { values, missing };
}

async function loadLetter(params: {
    organizationId: string;
    engagementId: string;
}) {
    const engagement = await prisma.workerEngagement.findFirst({
        where: { id: params.engagementId, organizationId: params.organizationId },
        select: {
            id: true,
            workerId: true,
            endDate: true,
            arbeitszeugnis: { select: { sentAt: true, body: true, master: { select: { name: true } } } },
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
    return { status: "found" as const, engagement, master: setting?.documentMaster ?? null };
}

export type ArbeitszeugnisPreview = {
    masterId: string;
    name: string;
    workerId: string;
    engagementId: string;
    segments: DocumentSegment[];
    values: Record<string, string>;
    unmatched: LetterValue[];
    unresolved: { key: string; label: string }[];
    alreadySent: boolean;
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
                values: {},
                unmatched: [],
                unresolved: [],
                alreadySent: true,
            },
        };
    }
    if (!master || master.kind !== "arbeitszeugnis") {
        return {
            status: "failed",
            message: "Für diese Automatisierung ist kein Arbeitszeugnis hinterlegt.",
        };
    }

    const segments = readDocumentSegments(master.body);
    const fields = letterFields({
        worker: engagement.worker,
        endDate: engagement.endDate,
        onboardingStart: engagement.worker.engagements[0]?.startDate ?? null,
    });
    const filled = valuesForDocumentSegments(segments, fields);
    return {
        status: "ready",
        preview: {
            masterId: master.id,
            name: master.name,
            workerId: engagement.workerId,
            engagementId: engagement.id,
            segments,
            values: filled.values,
            unmatched: unplacedLetterValues(fields, filled.values),
            unresolved: filled.unresolved,
            alreadySent: false,
        },
    };
}

export async function sendArbeitszeugnis(params: {
    organizationId: string;
    engagementId: string;
    values?: Record<string, string>;
}): Promise<ArbeitszeugnisResult> {
    const loaded = await loadLetter(params);
    if (loaded.status === "missing") {
        return { status: "failed", message: "Aufgabe nicht gefunden." };
    }
    const { engagement, master } = loaded;
    if (engagement.arbeitszeugnis?.sentAt) {
        return { status: "already_sent" };
    }
    if (!master || master.kind !== "arbeitszeugnis") {
        return {
            status: "failed",
            message: "Für diese Automatisierung ist kein Arbeitszeugnis hinterlegt.",
        };
    }

    const to = engagement.worker.email.trim();
    if (!to) {
        return {
            status: "failed",
            message: "Für diesen Mitarbeiter ist keine E-Mail hinterlegt.",
        };
    }

    const segments = readDocumentSegments(master.body);
    const filled = params.values
        ? suppliedValues(segments, params.values)
        : valuesForDocumentSegments(
              segments,
              letterFields({
                  worker: engagement.worker,
                  endDate: engagement.endDate,
                  onboardingStart:
                      engagement.worker.engagements[0]?.startDate ?? null,
              }),
          );
    if (filled.missing.length > 0) {
        return {
            status: "failed",
            message: `Diese Platzhalter konnten nicht gefüllt werden: ${filled.missing.join(", ")}.`,
        };
    }

    const from = await senderAddress(params.organizationId);
    if (!from) {
        return {
            status: "failed",
            message: "Es ist kein Absender für den Versand hinterlegt.",
        };
    }

    const token = await microsoftGraphToken();
    if (!token) {
        return {
            status: "failed",
            message: "Microsoft 365 ist nicht konfiguriert.",
        };
    }

    const sent = await sendLetter({
        token,
        senderAddress: from,
        to,
        name: master.name,
        segments,
        values: filled.values,
    });
    if (!sent) {
        return {
            status: "failed",
            message: "Microsoft Graph hat das Arbeitszeugnis abgelehnt.",
        };
    }

    const snapshot = documentBody(filledSegments(segments, filled.values));
    await prisma.arbeitszeugnis.upsert({
        where: { engagementId: engagement.id },
        create: {
            engagementId: engagement.id,
            masterId: master.id,
            body: snapshot,
            sentAt: new Date(),
        },
        update: {
            masterId: master.id,
            body: snapshot,
            sentAt: new Date(),
        },
    });

    return { status: "sent" };
}

export function certificateText(body: Prisma.JsonValue) {
    return textFromSegments(readDocumentSegments(body));
}
