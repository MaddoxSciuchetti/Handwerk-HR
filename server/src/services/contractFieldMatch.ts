import type { DocumentSegment } from "@/services/documentBody";
import {
    questionnaireAnswerLabel,
    type QuestionnaireAnswers,
} from "@/services/questionnaireForm";

export type UnmatchedQuestionnaireAnswer = {
    key: string;
    label: string;
    value: string;
};

const FIELD_ALIASES: Record<string, string[]> = {
    firstName: ["vorname", "firstname", "givenname", "vornamen"],
    lastName: ["nachname", "lastname", "familienname", "surname", "zuname"],
    fullName: ["vorundnachname", "vollername", "name"],
    email: ["email", "emailadresse", "mail"],
    workEmail: ["arbeitsmail", "workemail", "dienstmail", "firmenmail"],
    position: ["position", "stelle", "beruf", "taetigkeit"],
    phone: ["telefon", "telefonnummer", "phone", "handy"],
    birthday: ["geburtsdatum", "birthday", "geburtstag", "alter"],
    address: ["adresse", "anschrift", "wohnadresse"],
    street: ["strasse", "street"],
    postalCode: ["plz", "postleitzahl", "postalcode"],
    city: ["ort", "stadt", "wohnort", "city"],
    entryDate: ["eintritt", "eintrittsdatum", "entrydate"],
    exitDate: ["austritt", "austrittsdatum", "entlassung", "exitdate"],
};

function fold(value: string) {
    return value
        .toLowerCase()
        .replaceAll("ä", "ae")
        .replaceAll("ö", "oe")
        .replaceAll("ü", "ue")
        .replaceAll("ß", "ss")
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/[^a-z0-9]/g, "");
}

function answerValues(
    answers: QuestionnaireAnswers,
    email: string,
): Record<string, string> {
    const birthday = germanDate(answers.birthday);
    const address = [answers.street, `${answers.postalCode} ${answers.city}`.trim()]
        .filter((part) => part.length > 0)
        .join(", ");

    const firstName = answers.firstName.trim();
    const lastName = answers.lastName.trim();

    return {
        firstName,
        lastName,
        fullName: [firstName, lastName].filter((part) => part.length > 0).join(" "),
        email: email.trim(),
        birthday,
        address,
        street: answers.street,
        postalCode: answers.postalCode,
        city: answers.city,
        entryDate: germanDate(answers.entryDate),
        position: (answers.jobTitle ?? "").trim(),
    };
}

function germanDate(value: string | undefined) {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${day}.${month}.${year}`;
}

function matchAlias(label: string, key: string) {
    const foldedLabel = fold(label);
    const foldedKey = fold(key.split(".").at(-1) ?? key);
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
        if (aliases.some((alias) => alias === foldedLabel || alias === foldedKey)) {
            return field;
        }
    }
    return null;
}

export function contractValuesFromAnswers(
    segments: DocumentSegment[],
    answers: QuestionnaireAnswers,
    email = "",
): { key: string; value: string }[] {
    const values = answerValues(answers, email);
    const entries: { key: string; value: string }[] = [];
    const seen = new Set<string>();

    for (const segment of segments) {
        if (segment.type !== "input" || seen.has(segment.key)) continue;
        const field = matchAlias(segment.label, segment.key);
        if (!field) continue;
        const value = values[field]?.trim() ?? "";
        if (!value) continue;
        seen.add(segment.key);
        entries.push({ key: segment.key, value: value.slice(0, 8000) });
    }

    return entries;
}

export function acceptModelMatches(
    fields: { key: string }[],
    answers: { value: string }[],
    raw: unknown,
): { key: string; value: string }[] {
    const record =
        raw && typeof raw === "object" && !Array.isArray(raw)
            ? (raw as { matches?: unknown })
            : null;
    if (!record || !Array.isArray(record.matches)) return [];

    const allowedKeys = new Set(fields.map((field) => field.key));
    const allowedValues = new Set(
        answers
            .map((answer) => answer.value.trim())
            .filter((value) => value.length > 0),
    );
    const seen = new Set<string>();
    const entries: { key: string; value: string }[] = [];

    for (const item of record.matches) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue;
        const key = "key" in item ? item.key : null;
        const value = "value" in item ? item.value : null;
        if (typeof key !== "string" || typeof value !== "string") continue;
        const trimmed = value.trim().slice(0, 8000);
        if (!allowedKeys.has(key) || !allowedValues.has(trimmed) || seen.has(key)) {
            continue;
        }
        seen.add(key);
        entries.push({ key, value: trimmed });
    }

    return entries;
}

export function valuesForDocumentSegments(
    segments: DocumentSegment[],
    fields: Record<string, string>,
): {
    values: Record<string, string>;
    missing: string[];
    unresolved: { key: string; label: string }[];
} {
    const values: Record<string, string> = {};
    const missing: string[] = [];
    const unresolved: { key: string; label: string }[] = [];
    const seen = new Set<string>();

    for (const segment of segments) {
        if (segment.type !== "input" || seen.has(segment.key)) continue;
        seen.add(segment.key);
        const field = matchAlias(segment.label, segment.key);
        if (!field) {
            unresolved.push({ key: segment.key, label: segment.label });
            missing.push(segment.label);
            continue;
        }
        const value = fields[field]?.trim() ?? "";
        if (!value) {
            missing.push(segment.label);
            continue;
        }
        values[segment.key] = value.slice(0, 8000);
    }

    return { values, missing, unresolved };
}

function displayAnswer(key: string, raw: string) {
    const value = raw.trim();
    if (!value) return "";
    if (key === "birthday" || key.endsWith(".birthday") || key.endsWith(".from") || key.endsWith(".until") || key === "signatureDate" || key === "minorSignatureDate" || key === "entryDate" || key === "trainingStart" || key === "trainingEnd" || key === "constructionSince" || key === "vwlSince") {
        return germanDate(value);
    }
    return value;
}

function placedValues(
    segments: DocumentSegment[],
    contractValues: Record<string, string>,
) {
    const placed = new Set<string>();
    for (const segment of segments) {
        if (segment.type !== "input") continue;
        const value = (contractValues[segment.key] ?? "").trim();
        if (value) placed.add(value);
    }
    return placed;
}

export function unmatchedQuestionnaireAnswers(
    segments: DocumentSegment[],
    contractValues: Record<string, string>,
    answers: { key: string; value: string }[],
): UnmatchedQuestionnaireAnswer[] {
    const byKey = new Map<string, string>();
    for (const answer of answers) {
        const value = displayAnswer(answer.key, answer.value);
        if (value) byKey.set(answer.key, value);
    }

    const fullName = [byKey.get("firstName"), byKey.get("lastName")]
        .filter((part): part is string => Boolean(part))
        .join(" ");
    const locality = [byKey.get("postalCode"), byKey.get("city")]
        .filter((part): part is string => Boolean(part))
        .join(" ");
    const address = [byKey.get("street"), locality]
        .filter((part): part is string => Boolean(part))
        .join(", ");

    const placed = placedValues(segments, contractValues);
    const consumed = new Set<string>();
    for (const [key, value] of byKey) {
        if (placed.has(value)) consumed.add(key);
    }
    if (fullName && placed.has(fullName)) {
        consumed.add("firstName");
        consumed.add("lastName");
    }
    if (address && placed.has(address)) {
        consumed.add("street");
        consumed.add("postalCode");
        consumed.add("city");
    }

    return [...byKey].flatMap(([key, value]) => {
        if (consumed.has(key) || !value) return [];
        const label = questionnaireAnswerLabel(key, value);
        if (!label) return [];
        return [{ key, label, value }];
    });
}
