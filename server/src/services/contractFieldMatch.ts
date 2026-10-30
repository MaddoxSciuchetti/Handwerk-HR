import {
    isCurrentDateField,
    normalizeDocumentFieldValue,
} from "../../../shared/document";
import type { DocumentSegment } from "@/services/documentBody";
import {
    answerString,
    questionnaireAnswerLabel,
    type QuestionnaireAnswers,
} from "@/services/questionnaireForm";

export type MatchField = {
    key: string;
    label: string;
    type?: string;
    contractFieldKey?: string;
};

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

/** Questionnaire labels/keys often differ from contract field wording. */
const LABEL_SYNONYM_GROUPS = [
    ["stundenlohn", "stundengehalt", "stundenverguetung", "stundenentgelt", "lohnprostunde", "verguetungprostunde", "hourlyrate", "hourlypay"],
    [
        "urlaubstage",
        "urlaubsanspruch",
        "urlaubsanspruchkalenderjahr",
        "jahresurlaub",
        "urlaub",
    ],
    [
        "gehalt",
        "monatsgehalt",
        "bruttogehalt",
        "grundgehalt",
        "lohn",
        "entgelt",
        "verguetung",
        "salary",
        "bsbsalary",
    ],
];

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

function keyTail(key: string) {
    return fold(key.split(".").at(-1) ?? key);
}

function synonymCanonical(folded: string) {
    for (const group of LABEL_SYNONYM_GROUPS) {
        if (
            group.some(
                (alias) =>
                    folded === alias ||
                    (alias.length >= 6 && folded.includes(alias)),
            )
        )
            return group[0];
    }
    return null;
}

function sameSynonymGroup(left: string, right: string) {
    const a = synonymCanonical(left);
    const b = synonymCanonical(right);
    return Boolean(a && b && a === b);
}

type HoursKind = "weekly" | "daily" | "monthly" | "generic" | "excluded";
function hoursKind(value: string): HoursKind | null {
    const text = fold(value);
    if (/stundenlohn|stundengehalt|stundenverguetung|stundenentgelt|lohnprostunde|verguetungprostunde|hourlyrate|hourlypay|ueberstunden|mehrarbeit|pausen/.test(text)) return "excluded";
    if (/stundenprotag|stundenamtag|taeglich|dailyhours|hoursperday|hoursmonday|hourstuesday|hourswednesday|hoursthursday|hoursfriday|hourssaturday|hourssunday/.test(text)) return "daily";
    if (/monatsstunden|stundenpromonat|monatlichearbeitszeit|hourspermonth|monthlyhours/.test(text)) return "monthly";
    if (/wochenstunden|wochenarbeitszeit|woechentlich|prowoche|jewoche|weeklyhours|hoursperweek/.test(text)) return "weekly";
    if (/^(anzahl(der)?stunden|stundenzahl|arbeitsstunden|stunden|arbeitszeit|workinghours|employmentextent)$/.test(text)) return "generic";
    return null;
}
function fieldHoursKind(field: { key: string; label: string }, context = "") {
    const kind = hoursKind(field.label) ?? hoursKind(keyTail(field.key));
    return kind === "generic" ? hoursKind(context) ?? kind : kind;
}
function numericHours(value: string, max = 744) {
    const number = /^(\d{1,3}(?:[.,]\d{1,2})?)(?:\s*(?:h|std\.?|stunden)(?:\s*(?:pro|je)\s*woche)?)?$/i.exec(value.trim());
    return Boolean(number && Number(number[1].replace(",", ".")) <= max);
}
function matchScore(questionnaire: MatchField, contract: { key: string; label: string }, value: string, context: string) {
    const answerLabel = fold(questionnaire.label);
    const answerKey = keyTail(questionnaire.key);
    const contractLabel = fold(contract.label);
    const contractKey = keyTail(contract.key);
    const sourceHours = fieldHoursKind(questionnaire);
    const targetHours = fieldHoursKind(contract, context);
    if (targetHours && targetHours !== "excluded") {
        // A full/part-time description or hourly wage is not a quantity of hours.
        const max = targetHours === "weekly" || sourceHours === "weekly" ? 168 :
            targetHours === "daily" || sourceHours === "daily" ? 24 : 744;
        if (!numericHours(value, max) || sourceHours === "excluded") return 0;
        if (sourceHours && sourceHours !== "generic" && targetHours !== "generic" && sourceHours !== targetHours) return 0;
        if (targetHours === "generic" && (sourceHours === "daily" || sourceHours === "monthly")) return 0;
        if (sourceHours === "generic" && (targetHours === "daily" || targetHours === "monthly")) return 0;
    }
    // Do not equate arbitrary shared key tails (custom.confirmed vs contract.confirmed).
    if ((answerLabel && (answerLabel === contractLabel || answerLabel === contractKey)) ||
        (answerKey && answerKey === contractLabel)) return 3;
    if (sourceHours && sourceHours !== "excluded" && targetHours && targetHours !== "excluded" && numericHours(value)) return 2;
    return sameSynonymGroup(answerLabel, contractLabel) ||
        sameSynonymGroup(answerLabel, contractKey) ||
        sameSynonymGroup(answerKey, contractLabel) ||
        sameSynonymGroup(answerKey, contractKey) ? 1 : 0;
}

function answerValues(
    answers: QuestionnaireAnswers,
    email: string,
): Record<string, string> {
    const birthday = germanDate(answers.birthday);
    const street = answerString(answers, "street");
    const postalCode = answerString(answers, "postalCode");
    const city = answerString(answers, "city");
    const address = [street, `${postalCode} ${city}`.trim()]
        .filter((part) => part.length > 0)
        .join(", ");

    const firstName = answerString(answers, "firstName").trim();
    const lastName = answerString(answers, "lastName").trim();

    return {
        firstName,
        lastName,
        fullName: [firstName, lastName].filter((part) => part.length > 0).join(" "),
        email: email.trim(),
        birthday,
        address,
        street,
        postalCode,
        city,
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

function formatMatchValue(field: MatchField, raw: string) {
    const value = raw.trim();
    if (!value) return "";
    const formatted = field.type === "date" ? germanDate(value) : value;
    return formatted.slice(0, 8000);
}

function skipQuestionnaireMatch(segment: DocumentSegment) {
    return segment.type === "input" && (segment.fieldType === "points" || isCurrentDateField(segment));
}

function canCopyAnswer(segment: DocumentSegment, value: string) {
    if (segment.type !== "input" || segment.fieldType !== "checkbox") return true;
    const normalized = normalizeDocumentFieldValue("checkbox", value);
    return normalized === "true" || normalized === "false";
}

export function isSalutationField(field: { key: string; label?: string }) {
    const label = fold(field.label ?? "");
    const key = fold(field.key.split(".").at(-1) ?? field.key);
    if (label.includes("anrede") || key.includes("anrede")) return true;
    return label === "herrfrau" || label === "herroderfrau" || key === "herrfrau";
}

export function salutationFromSex(value: string) {
    const folded = fold(value);
    if (folded === "maennlich" || folded === "mann" || folded === "herr") return "Herr";
    if (folded === "weiblich" || folded === "frau") return "Frau";
    return "";
}

function acceptedSalutation(value: string) {
    const trimmed = value.trim();
    if (trimmed === "Herr" || trimmed === "Frau") return trimmed;
    return "";
}

export function deterministicContractValues(
    segments: DocumentSegment[],
    answers: QuestionnaireAnswers,
    email = "",
    fields: MatchField[] = [],
) {
    const entries: { key: string; value: string }[] = [];
    const filled = new Set<string>();

    for (const field of fields) {
        if (!field.contractFieldKey) continue;
        const segment = segments.find(
            (item) => item.type === "input" && item.key === field.contractFieldKey,
        );
        if (
            !segment ||
            segment.type !== "input" ||
            skipQuestionnaireMatch(segment) ||
            filled.has(segment.key)
        )
            continue;
        const value = formatMatchValue(field, answerString(answers, field.key));
        if (!value || !canCopyAnswer(segment, value)) continue;
        filled.add(segment.key);
        entries.push({
            key: segment.key,
            value: normalizeDocumentFieldValue(segment.fieldType, value),
        });
    }

    for (const entry of contractValuesFromAnswers(
        segments,
        answers,
        email,
    )) {
        if (filled.has(entry.key)) continue;
        filled.add(entry.key);
        entries.push(entry);
    }

    // Match each placeholder independently: an answer can appear in several places.
    // Conflicting answers at the same match strength are left for review.
    for (const [index, segment] of segments.entries()) {
        if (segment.type !== "input" || skipQuestionnaireMatch(segment) || filled.has(segment.key)) continue;
        const before = segments[index - 1];
        const after = segments[index + 1];
        const context = `${before?.type === "text" ? before.text.slice(-160) : ""} ${after?.type === "text" ? after.text.slice(0, 160) : ""}`;
        const candidates = fields.flatMap((field) => {
            const value = formatMatchValue(field, answerString(answers, field.key));
            if (!value || !canCopyAnswer(segment, value)) return [];
            const score = matchScore(field, segment, value, context);
            return score ? [{ value: normalizeDocumentFieldValue(segment.fieldType, value), score }] : [];
        });
        const best = Math.max(0, ...candidates.map((candidate) => candidate.score));
        const values = new Set(candidates.filter((candidate) => candidate.score === best).map((candidate) => candidate.value));
        if (values.size !== 1) continue;
        filled.add(segment.key);
        entries.push({ key: segment.key, value: [...values][0] });
    }

    const salutation = salutationFromSex(answerString(answers, "sex"));
    if (salutation) {
        for (const segment of segments) {
            if (
                segment.type !== "input" ||
                skipQuestionnaireMatch(segment) ||
                filled.has(segment.key) ||
                !isSalutationField(segment)
            )
                continue;
            filled.add(segment.key);
            entries.push({ key: segment.key, value: salutation });
        }
    }

    return entries;
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
        if (segment.type !== "input" || skipQuestionnaireMatch(segment) || seen.has(segment.key))
            continue;
        const field = matchAlias(segment.label, segment.key);
        if (!field) continue;
        const value = values[field]?.trim() ?? "";
        if (!value || !canCopyAnswer(segment, value)) continue;
        seen.add(segment.key);
        entries.push({
            key: segment.key,
            value: normalizeDocumentFieldValue(segment.fieldType, value.slice(0, 8000)),
        });
    }

    return entries;
}

export function acceptModelMatches(
    fields: { key: string; label?: string; fieldType?: string }[],
    answers: { value: string }[],
    raw: unknown,
): { key: string; value: string }[] {
    const record =
        raw && typeof raw === "object" && !Array.isArray(raw)
            ? (raw as { matches?: unknown })
            : null;
    if (!record || !Array.isArray(record.matches)) return [];

    const allowedFields = new Map(fields.map((field) => [field.key, field]));
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
        const field = allowedFields.get(key);
        const salutation = field && isSalutationField(field) ? acceptedSalutation(trimmed) : "";
        if (!field || seen.has(key) || (!allowedValues.has(trimmed) && !salutation)) {
            continue;
        }
        seen.add(key);
        entries.push({
            key,
            value: salutation || normalizeDocumentFieldValue(field.fieldType, trimmed),
        });
    }

    return entries;
}

/** Validate AI output against both the template and an identified source answer.
 * Text must be copied; only checkbox propositions may become booleans. */
export function acceptSemanticModelMatches(
    fields: { key: string; label?: string; fieldType?: string }[],
    answers: { key: string; value: string }[],
    raw: unknown,
): { key: string; value: string }[] {
    if (
        !raw ||
        typeof raw !== "object" ||
        !("matches" in raw) ||
        !Array.isArray(raw.matches)
    )
        return [];
    const allowedFields = new Map(fields.map((field) => [field.key, field]));
    const sources = new Map(
        answers.map((answer) => [answer.key, answer.value.trim()]),
    );
    const seen = new Set<string>();
    return raw.matches.flatMap((item: unknown) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [];
        const match = item as Record<string, unknown>;
        if (
            match.confidence !== "high" ||
            typeof match.key !== "string" ||
            typeof match.answerKey !== "string" ||
            typeof match.value !== "string"
        )
            return [];
        const field = allowedFields.get(match.key);
        const source = sources.get(match.answerKey);
        const value = match.value.trim();
        if (
            !field ||
            !source ||
            seen.has(match.key) ||
            !value ||
            value.length > 8000
        )
            return [];
        if (field.fieldType === "checkbox") {
            if (value !== "true" && value !== "false") return [];
        } else if (isSalutationField(field) && acceptedSalutation(value)) {
            // Anrede may be Herr or Frau derived from Geschlecht or the first name.
        } else if (value !== source) return [];
        seen.add(match.key);
        return [{ key: match.key, value }];
    });
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
        if (skipQuestionnaireMatch(segment)) continue;
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
        values[segment.key] = normalizeDocumentFieldValue(segment.fieldType, value.slice(0, 8000));
    }

    return { values, missing, unresolved };
}

function displayAnswer(key: string, raw: string, dates: Set<string> = new Set()) {
    const value = raw.trim();
    if (!value) return "";
    if (dates.has(key) || key === "birthday" || key.endsWith(".birthday") || key.endsWith(".from") || key.endsWith(".until") || key === "signatureDate" || key === "minorSignatureDate" || key === "entryDate" || key === "trainingStart" || key === "trainingEnd" || key === "constructionSince" || key === "vwlSince") {
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
    fields: MatchField[] = [],
): UnmatchedQuestionnaireAnswer[] {
    const labels = Object.fromEntries(fields.map((field) => [field.key, field.label]));
    const dates = new Set(
        fields.filter((field) => field.type === "date").map((field) => field.key),
    );
    const byKey = new Map<string, string>();
    const fileKeys = new Set(
        fields.filter((field) => field.type === "file").map((field) => field.key),
    );
    for (const answer of answers) {
        if (fileKeys.has(answer.key)) continue;
        const value = displayAnswer(answer.key, answer.value, dates);
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
        const field = fields.find((item) => item.key === key);
        const placedCheckbox = segments.some((segment) =>
            segment.type === "input" &&
            segment.fieldType === "checkbox" &&
            (field?.contractFieldKey === segment.key ||
                (field?.label && fold(field.label) === fold(segment.label))) &&
            contractValues[segment.key] === normalizeDocumentFieldValue("checkbox", value),
        );
        if (placedCheckbox)
            consumed.add(key);
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
        const label = questionnaireAnswerLabel(key, value, labels);
        return [{ key, label: label || key, value }];
    });
}
