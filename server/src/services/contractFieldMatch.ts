import type { DocumentSegment } from "@/services/documentBody";
import type { QuestionnaireAnswers } from "@/services/questionnaireForm";

const FIELD_ALIASES: Record<string, string[]> = {
    firstName: ["vorname", "firstname", "givenname", "vornamen"],
    lastName: ["nachname", "lastname", "familienname", "surname", "zuname"],
    fullName: ["vorundnachname", "vollername"],
    email: ["email", "emailadresse", "mail"],
    birthday: ["geburtsdatum", "birthday", "geburtstag", "alter"],
    address: ["adresse", "anschrift", "wohnadresse"],
    street: ["strasse", "street"],
    postalCode: ["plz", "postleitzahl", "postalcode"],
    city: ["ort", "stadt", "wohnort", "city"],
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
