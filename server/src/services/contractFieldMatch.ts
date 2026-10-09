import type { DocumentSegment } from "@/services/documentBody";
import {
    QUESTIONNAIRE_FIELDS,
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
    trouserSize: ["hosengroesse", "hose", "trousers"],
    tshirtSize: ["tshirtgroesse", "tshirt", "shirtgroesse"],
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
    const [year, month, day] = answers.birthday.split("-");
    const birthday =
        year && month && day ? `${day}.${month}.${year}` : answers.birthday;
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
        trouserSize: answers.trouserSize,
        tshirtSize: answers.tshirtSize,
    };
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
    if (key !== "birthday") return value;
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${day}.${month}.${year}`;
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

    return QUESTIONNAIRE_FIELDS.flatMap((field) => {
        if (consumed.has(field.key)) return [];
        const value = byKey.get(field.key);
        if (!value) return [];
        return [{ key: field.key, label: field.label, value }];
    });
}
