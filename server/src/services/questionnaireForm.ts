import { QUESTIONNAIRE_DECLARATION } from "../../../shared/questionnaireDeclaration";
import z from "zod";
import {
    insuranceNumberInput,
    isValidInsuranceNumber,
} from "../../../shared/insuranceNumber";
import {
    HOURS_DISTRIBUTION_KEY,
    WEEKLY_HOURS_PROMPT,
    WEEKLY_HOURS_SECTION,
    WEEKDAYS,
    isWeekdayHourKey,
    normalizeHour,
} from "../../../shared/weeklyHours";

export const QUESTIONNAIRE_INTRO =
    "Dieser Personalfragebogen dient zur Vorerfassung von Personaldaten für das DATEV-Lohnabrechnungsprogramm. Zur Wahrung der Aufbewahrungsfrist wird der ausgefüllte Personalfragebogen von dem Arbeitgeber / der lohnabrechnenden Stelle gespeichert.";

const DECLARATION = QUESTIONNAIRE_DECLARATION.label;

const HOURS_SECTION = WEEKLY_HOURS_SECTION;
const VWL_SECTION = "VWL - nur notwendig, wenn Vertrag vorliegt";
const SOCIAL_SECTION = "Sozialversicherung";

type QuestionnaireFieldType = "text" | "date" | "single" | "check" | "file";

export type QuestionnaireField = {
    key: string;
    label: string;
    section: string;
    type: QuestionnaireFieldType;
    required?: boolean;
    options?: readonly string[];
    max?: number;
    layout?: "inline";
};

export type QuestionnaireColumn = {
    key: string;
    label: string;
    type: "text" | "date";
    officeOnly?: boolean;
};

export type QuestionnaireRepeater = {
    key: string;
    section: string;
    afterSection: string;
    columns: readonly QuestionnaireColumn[];
    allowMoreRows?: boolean;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const FILE_KEY = /^questionnaires\/[0-9a-f-]{36}\/\d{10,16}-[0-9a-f-]{36}$/;

export function questionnaireFileName(value: string) {
    return value.replace(/[\\/\u0000]/g, "").trim().slice(0, 180);
}

export function encodeFileAnswer(
    name: string,
    key: string,
    extra?: { mime?: string; size?: number },
) {
    return JSON.stringify({
        name,
        key,
        ...(extra?.mime ? { mime: extra.mime } : {}),
        ...(typeof extra?.size === "number" ? { size: extra.size } : {}),
    });
}

export function readFileAnswer(
    value: string,
): { name: string; key: string; mime?: string; size?: number } | null {
    if (!value) return null;
    let parsed: { name?: unknown; key?: unknown; mime?: unknown; size?: unknown };
    try {
        parsed = JSON.parse(value) as {
            name?: unknown;
            key?: unknown;
            mime?: unknown;
            size?: unknown;
        };
    } catch {
        return null;
    }
    if (typeof parsed.name !== "string" || typeof parsed.key !== "string") return null;
    const name = questionnaireFileName(parsed.name);
    if (!name) return null;
    if (!FILE_KEY.test(parsed.key)) return null;
    const mime = typeof parsed.mime === "string" ? parsed.mime.slice(0, 128) : undefined;
    const size = typeof parsed.size === "number" && parsed.size >= 0 ? parsed.size : undefined;
    return { name, key: parsed.key, mime, size };
}

export function fileAnswerForSubmission(value: string, submissionId: string) {
    const file = readFileAnswer(value);
    if (!file || !file.key.startsWith(`questionnaires/${submissionId}/`)) return null;
    return file;
}
const yesNo = ["ja", "nein"] as const;

function text<Key extends string>(
    key: Key,
    label: string,
    section: string,
    extra: Partial<QuestionnaireField> = {},
) {
    return { label, section, type: "text" as const, max: 255, ...extra, key };
}

function date<Key extends string>(
    key: Key,
    label: string,
    section: string,
    extra: Partial<QuestionnaireField> = {},
) {
    return { label, section, type: "date" as const, ...extra, key };
}

function single<Key extends string>(
    key: Key,
    label: string,
    section: string,
    options: readonly string[],
    extra: Partial<QuestionnaireField> = {},
) {
    return { label, section, type: "single" as const, options, ...extra, key };
}

function check<Key extends string>(
    key: Key,
    label: string,
    section: string,
    extra: Partial<QuestionnaireField> = {},
) {
    return { label, section, type: "check" as const, ...extra, key };
}

function weekday<Key extends string>(key: Key, label: string) {
    return text(key, label, HOURS_SECTION, { max: 8, layout: "inline", required: false });
}

export const QUESTIONNAIRE_FIELDS = [
    text("lastName", "Familienname", "Persönliche Angaben", { required: true, max: 120 }),
    text("birthName", "ggf. Geburtsname", "Persönliche Angaben", { max: 120 }),
    text("firstName", "Vorname", "Persönliche Angaben", { required: true, max: 120 }),
    text("street", "Straße und Hausnummer inkl. Anschriftenzusatz", "Persönliche Angaben", {
        required: true,
    }),
    text("postalCode", "PLZ", "Persönliche Angaben", { required: true, max: 24 }),
    text("city", "Ort", "Persönliche Angaben", { required: true, max: 120 }),
    date("birthday", "Geburtsdatum", "Persönliche Angaben", { required: true }),
    single(
        "sex",
        "Geschlecht (bitte ankreuzen)",
        "Persönliche Angaben",
        ["männlich", "weiblich", "unbestimmt", "divers"],
        { required: true },
    ),
    text("insuranceNumber", "Versicherungsnummer gem. Sozialversicherungsausweis", "Persönliche Angaben", {
        max: 12,
    }),
    text("birthPlace", "Geburtsort, -land", "Persönliche Angaben"),
    text("nationality", "Staatsangehörigkeit", "Persönliche Angaben"),
    text("employeeNumber", "Arbeitnehmernummer", "Persönliche Angaben", { max: 64 }),
    text("iban", "IBAN", "Persönliche Angaben", { max: 42 }),
    text("bic", "BIC", "Persönliche Angaben", { max: 16 }),

    date("entryDate", "Eintrittsdatum", "Beschäftigung"),
    text("jobTitle", "Berufsbezeichnung", "Beschäftigung"),
    single("employmentKind", "", "Beschäftigung", ["Hauptbeschäftigung", "Nebenbeschäftigung"]),
    single("otherJobs", "Üben Sie weitere Beschäftigungen aus?", "Beschäftigung", yesNo),
    single(
        "marginalJob",
        "Handelt es sich hierbei um eine geringfügige Beschäftigung?",
        "Beschäftigung",
        yesNo,
    ),
    single("schoolDegree", "Höchster Schulabschluss", "Beschäftigung", [
        "ohne Schulabschluss",
        "Haupt-/Volksschulabschluss",
        "Mittlere Reife/gleichwertiger Abschluss",
        "Abitur/Fachabitur",
    ]),
    single("vocationalDegree", "Höchste Berufsausbildung", "Beschäftigung", [
        "ohne beruflichen Ausbildungsabschluss",
        "Anerkannte Berufsausbildung",
        "Meister/Techniker/gleichwertiger Fachschulabschluss",
        "Bachelor",
        "Diplom/Magister/Master/Staatsexamen",
        "Promotion",
    ]),
    date("trainingStart", "Beginn der Ausbildung", "Beschäftigung"),
    date("trainingEnd", "Voraussichtliches Ende der Ausbildung", "Beschäftigung"),
    date("constructionSince", "Im Baugewerbe beschäftigt seit", "Beschäftigung"),
    single(HOURS_DISTRIBUTION_KEY, WEEKLY_HOURS_PROMPT, HOURS_SECTION, ["ja", "nein"], {
        required: false,
    }),
    ...WEEKDAYS.map((day) => weekday(day.key, day.label)),

    text("taxId", "Identifikationsnr.", "Steuer", { max: 32 }),
    text("taxClass", "Steuerklasse/Faktor", "Steuer", { max: 32 }),
    text("childAllowance", "Kinderfreibeträge", "Steuer", { max: 32 }),
    text("religion", "Konfession", "Steuer"),

    text(
        "healthInsurance",
        "Gesetzl. Krankenkasse (bei PKV: letzte ges. Krankenkasse)",
        SOCIAL_SECTION,
    ),

    text("vwlRecipient", "Empfang VWL durch", VWL_SECTION),
    text("vwlAmount", "Betrag", VWL_SECTION, { max: 64 }),
    date("vwlSince", "Seit wann", VWL_SECTION),
    text("vwlContractNumber", "Vertragsnr.", VWL_SECTION, { max: 64 }),
    text("vwlIban", "IBAN", VWL_SECTION, { max: 42 }),
    text("vwlBic", "BIC", VWL_SECTION, { max: 16 }),

    check("declaration", DECLARATION, "Erklärung", { required: true }),
    date("signatureDate", "Datum", "Erklärung"),
    date("minorSignatureDate", "Datum", "Bei Minderjährigen Unterschrift des gesetzlichen Vertreters"),
];

export const QUESTIONNAIRE_REPEATERS: QuestionnaireRepeater[] = [
    {
        key: "children",
        section: "Kinder, für die eine Elterneigenschaft nachgewiesen werden kann",
        afterSection: SOCIAL_SECTION,
        columns: [
            { key: "lastName", label: "Name", type: "text" },
            { key: "firstName", label: "Vorname", type: "text" },
            { key: "birthday", label: "Geburtsdatum (TT.MM.JJJJ)", type: "date" },
        ],
    },
    {
        key: "priorEmployment",
        section: "Angaben zu steuerpflichtigen Vorbeschäftigungszeiten im laufenden Kalenderjahr",
        afterSection: VWL_SECTION,
        columns: [
            { key: "from", label: "Zeitraum von", type: "date" },
            { key: "until", label: "Zeitraum bis", type: "date" },
            { key: "kind", label: "Art der Beschäftigung", type: "text" },
            {
                key: "days",
                label: "Anzahl der Beschäftigungstage",
                type: "text",
                officeOnly: true,
            },
        ],
    },
];

const childSchema = z.object({
    lastName: z.string().trim().max(120).default(""),
    firstName: z.string().trim().max(120).default(""),
    birthday: z
        .string()
        .trim()
        .default("")
        .refine((value) => value === "" || datePattern.test(value), "Datum"),
});

const priorSchema = z.object({
    from: z
        .string()
        .trim()
        .default("")
        .refine((value) => value === "" || datePattern.test(value), "Datum"),
    until: z
        .string()
        .trim()
        .default("")
        .refine((value) => value === "" || datePattern.test(value), "Datum"),
    kind: z.string().trim().max(255).default(""),
    days: z.string().trim().max(32).default(""),
});

export type QuestionnaireChild = z.infer<typeof childSchema>;
export type QuestionnairePriorEmployment = z.infer<typeof priorSchema>;

type FieldKey = (typeof QUESTIONNAIRE_FIELDS)[number]["key"];

export type QuestionnaireAnswers = {
    [Key in FieldKey]: string;
} & {
    children: QuestionnaireChild[];
    priorEmployment: QuestionnairePriorEmployment[];
};

function fieldSchema(field: QuestionnaireField) {
    if (field.type === "date") {
        return z
            .string()
            .trim()
            .refine((value) => value === "" || datePattern.test(value), "Datum")
            .refine((value) => !field.required || value.length > 0, "erforderlich");
    }
    if (field.type === "single") {
        const options = field.options ?? [];
        return z
            .string()
            .trim()
            .refine((value) => value === "" || options.includes(value), "ungültige Auswahl")
            .refine((value) => !field.required || value.length > 0, "erforderlich");
    }
    if (field.key === "insuranceNumber") {
        return z
            .string()
            .trim()
            .transform((value) => insuranceNumberInput(value))
            .refine((value) => value === "" || isValidInsuranceNumber(value), "Versicherungsnummer")
            .refine((value) => !field.required || value.length > 0, "erforderlich");
    }
    if (field.type === "file") {
        return z
            .string()
            .trim()
            .max(500)
            .refine(
                (value) => (value ? readFileAnswer(value) !== null : !field.required),
                "Datei",
            );
    }
    if (field.type === "check") {
        const options = field.options ?? [];
        if (options.length > 0) {
            return z
                .string()
                .trim()
                .refine((value) => value === "" || options.includes(value), "ungültige Auswahl")
                .refine((value) => !field.required || value.length > 0, "erforderlich");
        }
        return z
            .string()
            .trim()
            .refine((value) => value === "" || value === "ja", "ungültige Auswahl")
            .refine((value) => !field.required || value === "ja", "erforderlich");
    }
    if (isWeekdayHourKey(field.key)) {
        return z
            .string()
            .trim()
            .refine((value) => normalizeHour(value) !== null, "Stunden")
            .transform((value) => normalizeHour(value) ?? "");
    }
    return z
        .string()
        .trim()
        .max(field.max ?? 255)
        .refine((value) => !field.required || value.length > 0, "erforderlich");
}

type AnswerRepeater =
    | string
    | { key: string; columns?: readonly { key: string; type?: "text" | "date" }[] };

function repeaterKey(repeater: AnswerRepeater) {
    return typeof repeater === "string" ? repeater : repeater.key;
}

function customRowSchema(columns: readonly { key: string; type?: "text" | "date" }[]) {
    return z.object(
        Object.fromEntries(
            columns.map((column) => [
                column.key,
                column.type === "date"
                    ? z
                          .string()
                          .trim()
                          .default("")
                          .refine((value) => value === "" || datePattern.test(value), "Datum")
                    : z.string().trim().max(255).default(""),
            ]),
        ),
    );
}

export function questionnaireAnswerSchema(
    fields: readonly QuestionnaireField[] = QUESTIONNAIRE_FIELDS,
    repeaters: readonly AnswerRepeater[] = ["children", "priorEmployment"],
) {
    const keys = repeaters.map(repeaterKey);
    const tables = Object.fromEntries(
        repeaters.flatMap((repeater) => {
            const key = repeaterKey(repeater);
            if (!key.startsWith("rows.")) return [];
            const columns = typeof repeater === "string" ? [] : (repeater.columns ?? []);
            const row =
                columns.length > 0
                    ? customRowSchema(columns)
                    : z.record(z.string(), z.string().trim().max(255));
            return [[key, z.array(row).max(10).default([])]];
        }),
    );
    return z.object({
        ...Object.fromEntries(fields.map((field) => [field.key, fieldSchema(field)])),
        ...(keys.includes("children") ? { children: z.array(childSchema).max(10).default([]) } : {}),
        ...(keys.includes("priorEmployment")
            ? { priorEmployment: z.array(priorSchema).max(8).default([]) }
            : {}),
        ...tables,
    });
}

function filled(values: string[]) {
    return values.some((value) => value.trim().length > 0);
}

const WORKER_TEXT = ["firstName", "lastName", "street", "postalCode", "city"] as const;

export function workerTextFromAnswers(
    fields: { key: string }[],
    answers: QuestionnaireAnswers,
) {
    const present = new Set(fields.map((field) => field.key));
    const data: Partial<Record<(typeof WORKER_TEXT)[number], string>> = {};
    for (const key of WORKER_TEXT) {
        if (!present.has(key)) continue;
        const value = answerString(answers, key).trim();
        if (value) data[key] = value;
    }
    const birthday = present.has("birthday") ? answerString(answers, "birthday").trim() : "";
    return { data, birthday };
}

export function answerString(answers: QuestionnaireAnswers, key: string) {
    const value = (answers as Record<string, unknown>)[key];
    return typeof value === "string" ? value : "";
}

export function questionnaireAnswersFromStored(
    rows: { key: string; value: string }[],
): QuestionnaireAnswers {
    const byKey = new Map(rows.map((row) => [row.key, row.value]));
    const answers = Object.fromEntries(
        QUESTIONNAIRE_FIELDS.map((field) => [field.key, byKey.get(field.key) ?? ""]),
    ) as unknown as QuestionnaireAnswers;
    for (const [key, value] of byKey) {
        if (/^(child|prior)\.\d+\./.test(key)) continue;
        (answers as Record<string, unknown>)[key] = value;
    }

    const children: QuestionnaireChild[] = [];
    for (let index = 1; index <= 10; index += 1) {
        const child = {
            lastName: byKey.get(`child.${index}.lastName`) ?? "",
            firstName: byKey.get(`child.${index}.firstName`) ?? "",
            birthday: byKey.get(`child.${index}.birthday`) ?? "",
        };
        if (filled([child.lastName, child.firstName, child.birthday])) {
            children.push(child);
        }
    }

    const priorEmployment: QuestionnairePriorEmployment[] = [];
    for (let index = 1; index <= 8; index += 1) {
        const prior = {
            from: byKey.get(`prior.${index}.from`) ?? "",
            until: byKey.get(`prior.${index}.until`) ?? "",
            kind: byKey.get(`prior.${index}.kind`) ?? "",
            days: byKey.get(`prior.${index}.days`) ?? "",
        };
        if (filled([prior.from, prior.until, prior.kind, prior.days])) {
            priorEmployment.push(prior);
        }
    }

    answers.children = children;
    answers.priorEmployment = priorEmployment;
    return answers;
}

export function flattenQuestionnaireAnswers(
    answers: QuestionnaireAnswers,
    fields: readonly { key: string }[] = QUESTIONNAIRE_FIELDS,
    repeaters: readonly { key: string; columns: readonly { key: string }[] }[] = [],
) {
    const known = new Set(fields.map((field) => field.key));
    const rows: { key: string; value: string }[] = fields.map((field) => ({
        key: field.key,
        value: answerString(answers, field.key),
    }));
    for (const [key, value] of Object.entries(answers)) {
        if (key === "children" || key === "priorEmployment" || known.has(key)) continue;
        if (typeof value !== "string" || !value.trim()) continue;
        rows.push({ key, value });
    }
    (answers.children ?? []).forEach((child, index) => {
        if (!filled([child.lastName, child.firstName, child.birthday])) return;
        const number = index + 1;
        rows.push(
            { key: `child.${number}.lastName`, value: child.lastName },
            { key: `child.${number}.firstName`, value: child.firstName },
            { key: `child.${number}.birthday`, value: child.birthday },
        );
    });
    for (const repeater of repeaters) {
        if (!repeater.key.startsWith("rows.")) continue;
        const table = (answers as Record<string, unknown>)[repeater.key];
        if (!Array.isArray(table)) continue;
        table.forEach((row, index) => {
            if (!row || typeof row !== "object") return;
            const record = row as Record<string, unknown>;
            const values = repeater.columns.map((column) => {
                const cell = record[column.key];
                return typeof cell === "string" ? cell : "";
            });
            if (!filled(values)) return;
            const number = index + 1;
            for (const column of repeater.columns) {
                const cell = record[column.key];
                const value = typeof cell === "string" ? cell.trim() : "";
                if (!value) continue;
                rows.push({ key: `${repeater.key}.${number}.${column.key}`, value });
            }
        });
    }
    (answers.priorEmployment ?? []).forEach((prior, index) => {
        if (!filled([prior.from, prior.until, prior.kind, prior.days ?? ""])) return;
        const number = index + 1;
        rows.push(
            { key: `prior.${number}.from`, value: prior.from },
            { key: `prior.${number}.until`, value: prior.until },
            { key: `prior.${number}.kind`, value: prior.kind },
            { key: `prior.${number}.days`, value: prior.days ?? "" },
        );
    });
    return rows.filter((row) => row.value.trim().length > 0);
}

const childLabels = {
    lastName: "Name",
    firstName: "Vorname",
    birthday: "Geburtsdatum (TT.MM.JJJJ)",
} as const;

const priorLabels = {
    from: "Zeitraum von",
    until: "Zeitraum bis",
    kind: "Art der Beschäftigung",
    days: "Anzahl der Beschäftigungstage",
} as const;

export function questionnaireAnswerLabel(
    key: string,
    value = "",
    labels: Record<string, string> = {},
) {
    if (labels[key]) return labels[key];
    const field = QUESTIONNAIRE_FIELDS.find((item) => item.key === key);
    if (field) return field.label || value;
    const child = /^child\.\d+\.(lastName|firstName|birthday)$/.exec(key);
    if (child) return childLabels[child[1] as keyof typeof childLabels];
    const prior = /^prior\.\d+\.(from|until|kind|days)$/.exec(key);
    if (prior) return priorLabels[prior[1] as keyof typeof priorLabels];
    return null;
}
