import z from "zod";

export const QUESTIONNAIRE_INTRO =
    "Dieser Personalfragebogen dient zur Vorerfassung von Personaldaten für das DATEV-Lohnabrechnungsprogramm. Zur Wahrung der Aufbewahrungsfrist wird der ausgefüllte Personalfragebogen von dem Arbeitgeber / der lohnabrechnenden Stelle gespeichert.";

const DECLARATION =
    "Erklärung der beschäftigten Person: Ich versichere, dass die vorstehenden Angaben der Wahrheit entsprechen. Ich verpflichte mich, meinem Arbeitgeber alle Änderungen, insbesondere in Bezug auf weitere Beschäftigungen (in Bezug auf Art, Dauer und Entgelt) unverzüglich mitzuteilen.";

const HOURS_SECTION = "Ggf.Verteilung d. wöchentl. Arbeitszeit (Std.)";
const VWL_SECTION = "VWL - nur notwendig, wenn Vertrag vorliegt";
const SOCIAL_SECTION = "Sozialversicherung";

type QuestionnaireFieldType = "text" | "date" | "single" | "check";

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
};

export type QuestionnaireRepeater = {
    key: "children" | "priorEmployment";
    section: string;
    afterSection: string;
    columns: readonly QuestionnaireColumn[];
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
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
    return text(key, label, HOURS_SECTION, { max: 8, layout: "inline" });
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
    text("insuranceNumber", "Versicherungsnummer gem. Sozialversicherungsausweis", "Persönliche Angaben"),
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
    weekday("hoursMonday", "Mo"),
    weekday("hoursTuesday", "Di"),
    weekday("hoursWednesday", "Mi"),
    weekday("hoursThursday", "Do"),
    weekday("hoursFriday", "Fr"),
    weekday("hoursSaturday", "Sa"),
    weekday("hoursSunday", "So"),

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
    return z
        .string()
        .trim()
        .max(field.max ?? 255)
        .refine((value) => !field.required || value.length > 0, "erforderlich");
}

export function questionnaireAnswerSchema(
    fields: readonly QuestionnaireField[] = QUESTIONNAIRE_FIELDS,
    repeaterKeys: readonly string[] = ["children", "priorEmployment"],
) {
    return z.object({
        ...Object.fromEntries(fields.map((field) => [field.key, fieldSchema(field)])),
        ...(repeaterKeys.includes("children")
            ? { children: z.array(childSchema).max(10).default([]) }
            : {}),
        ...(repeaterKeys.includes("priorEmployment")
            ? { priorEmployment: z.array(priorSchema).max(8).default([]) }
            : {}),
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
        };
        if (filled([prior.from, prior.until, prior.kind])) {
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
    (answers.priorEmployment ?? []).forEach((prior, index) => {
        if (!filled([prior.from, prior.until, prior.kind])) return;
        const number = index + 1;
        rows.push(
            { key: `prior.${number}.from`, value: prior.from },
            { key: `prior.${number}.until`, value: prior.until },
            { key: `prior.${number}.kind`, value: prior.kind },
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
    const prior = /^prior\.\d+\.(from|until|kind)$/.exec(key);
    if (prior) return priorLabels[prior[1] as keyof typeof priorLabels];
    return null;
}
