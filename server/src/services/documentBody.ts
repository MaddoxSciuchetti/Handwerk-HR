import { BAD_REQUEST } from "@/constants/http";
import AppError from "@/utils/AppError";
import { Prisma } from "@prisma/client";

const TEXT_MAX = 200_000;
const LABEL_MAX = 120;
const KEY_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/;

export type DocumentSegment =
    | { type: "text"; text: string }
    | { type: "input"; key: string; label: string };

export function textFromSegments(segments: DocumentSegment[]): string {
    return segments
        .filter((segment) => segment.type === "text")
        .map((segment) => segment.text)
        .join("");
}

export function segmentsFromText(text: string): DocumentSegment[] {
    return [{ type: "text", text }];
}

export function readDocumentSegments(body: Prisma.JsonValue): DocumentSegment[] {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        return segmentsFromText("");
    }

    if ("segments" in body && Array.isArray(body.segments)) {
        return body.segments.flatMap((segment) => {
            const parsed = parseStoredSegment(segment);
            return parsed ? [parsed] : [];
        });
    }

    if ("text" in body && typeof body.text === "string") {
        return segmentsFromText(body.text);
    }

    return segmentsFromText("");
}

export function documentBody(
    segments: DocumentSegment[],
): Prisma.InputJsonValue {
    return { version: 2, segments };
}

export function parseDocumentSegments(value: unknown): DocumentSegment[] {
    if (!Array.isArray(value)) {
        throw new AppError(BAD_REQUEST, "Der Dokumenttext fehlt.");
    }

    const segments = value.map(parseIncomingSegment);
    const length = textFromSegments(segments).length;
    if (length > TEXT_MAX) {
        throw new AppError(BAD_REQUEST, "Das Dokument ist zu lang.");
    }

    return segments;
}

function parseStoredSegment(value: unknown): DocumentSegment | null {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    if ("type" in value && value.type === "text" && "text" in value && typeof value.text === "string") {
        return { type: "text", text: value.text };
    }
    if (
        "type" in value &&
        value.type === "input" &&
        "key" in value &&
        typeof value.key === "string" &&
        "label" in value &&
        typeof value.label === "string"
    ) {
        return { type: "input", key: value.key, label: value.label };
    }
    return null;
}

function parseIncomingSegment(value: unknown): DocumentSegment {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        throw new AppError(BAD_REQUEST, "Ein Textabschnitt ist ungültig.");
    }

    if ("type" in value && value.type === "text") {
        if (!("text" in value) || typeof value.text !== "string") {
            throw new AppError(BAD_REQUEST, "Ein Textabschnitt ist ungültig.");
        }
        return { type: "text", text: value.text };
    }

    if ("type" in value && value.type === "input") {
        const key = "key" in value && typeof value.key === "string" ? value.key.trim() : "";
        const label =
            "label" in value && typeof value.label === "string"
                ? value.label.trim()
                : "";
        if (!KEY_PATTERN.test(key) || key.length > LABEL_MAX) {
            throw new AppError(BAD_REQUEST, "Der Schlüssel eines Eingabefelds ist ungültig.");
        }
        if (label.length === 0 || label.length > LABEL_MAX) {
            throw new AppError(BAD_REQUEST, "Die Bezeichnung eines Eingabefelds fehlt.");
        }
        return { type: "input", key, label };
    }

    throw new AppError(BAD_REQUEST, "Ein Textabschnitt ist ungültig.");
}
