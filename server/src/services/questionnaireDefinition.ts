import { BAD_REQUEST } from "@/constants/http";
import AppError from "@/utils/AppError";
import {
    QUESTIONNAIRE_FIELDS,
    QUESTIONNAIRE_INTRO,
    QUESTIONNAIRE_REPEATERS,
    type QuestionnaireField,
    type QuestionnaireRepeater,
} from "@/services/questionnaireForm";

export type QuestionnaireFieldItem = {
    kind: "field";
    key: string;
    label: string;
    section: string;
    type: QuestionnaireField["type"];
    required?: boolean;
    options?: string[];
    max?: number;
    layout?: "inline";
    employerFilled?: boolean;
    defaultValue?: string;
    builtin?: boolean;
    contractFieldKey?: string;
};

export type QuestionnaireRepeaterItem = {
    kind: "repeater";
    key: QuestionnaireRepeater["key"];
    section: string;
    columns: QuestionnaireRepeater["columns"];
};

export type QuestionnaireItem = QuestionnaireFieldItem | QuestionnaireRepeaterItem;

export type QuestionnaireDefinition = {
    intro: string;
    items: QuestionnaireItem[];
};

const HOUR_KEYS = [
    "hoursMonday",
    "hoursTuesday",
    "hoursWednesday",
    "hoursThursday",
    "hoursFriday",
    "hoursSaturday",
    "hoursSunday",
] as const;

const CUSTOM_KEY = /^custom\.[a-z0-9-]{8,80}$/;
const CONTRACT_KEY = /^[a-zA-Z0-9._-]{1,120}$/;
const CUSTOM_SECTION = "Weitere Angaben";

const employmentExtent: QuestionnaireFieldItem = {
    kind: "field",
    key: "employmentExtent",
    label: "Umfang der Beschäftigung",
    section: "Beschäftigung",
    type: "single",
    options: ["Vollzeit", "Teilzeit"],
    employerFilled: true,
    builtin: true,
};

function fieldItem(
    field: QuestionnaireField,
    extra: Partial<QuestionnaireFieldItem> = {},
): QuestionnaireFieldItem {
    return {
        kind: "field",
        key: field.key,
        label: field.label,
        section: field.section,
        type: field.type,
        required: field.required,
        options: field.options ? [...field.options] : undefined,
        max: field.max,
        layout: field.layout,
        builtin: true,
        employerFilled: field.key.startsWith("hours"),
        ...extra,
    };
}

function repeaterItem(repeater: QuestionnaireRepeater): QuestionnaireRepeaterItem {
    return {
        kind: "repeater",
        key: repeater.key,
        section: repeater.section,
        columns: repeater.columns.map((column) => ({ ...column })),
    };
}

export function builtinCatalog(): QuestionnaireItem[] {
    const items = QUESTIONNAIRE_FIELDS.map((field) => fieldItem(field));
    const jobTitle = items.findIndex((item) => item.kind === "field" && item.key === "jobTitle");
    items.splice(jobTitle + 1, 0, { ...employmentExtent, options: [...employmentExtent.options!] });
    return [...items, ...QUESTIONNAIRE_REPEATERS.map(repeaterItem)];
}

const catalogByKey = new Map(builtinCatalog().map((item) => [item.key, item]));

export function seedQuestionnaireDefinition(): QuestionnaireDefinition {
    const items: QuestionnaireItem[] = [];
    for (const field of QUESTIONNAIRE_FIELDS) {
        items.push(fieldItem(field));
        if (field.key === "jobTitle") {
            items.push({ ...employmentExtent, options: [...employmentExtent.options!] });
        }
    }
    for (const repeater of QUESTIONNAIRE_REPEATERS) {
        let insertAt = items.length;
        for (let index = items.length - 1; index >= 0; index -= 1) {
            const item = items[index];
            if (item.kind === "field" && item.section === repeater.afterSection) {
                insertAt = index + 1;
                break;
            }
        }
        items.splice(insertAt, 0, repeaterItem(repeater));
    }
    return { intro: QUESTIONNAIRE_INTRO, items };
}

export function definitionFields(definition: QuestionnaireDefinition) {
    return definition.items.filter((item): item is QuestionnaireFieldItem => item.kind === "field");
}

export function definitionRepeaters(definition: QuestionnaireDefinition): QuestionnaireRepeater[] {
    const repeaters: QuestionnaireRepeater[] = [];
    definition.items.forEach((item, index) => {
        if (item.kind !== "repeater") return;
        const previous = definition.items
            .slice(0, index)
            .findLast((entry) => entry.kind === "field");
        repeaters.push({
            key: item.key,
            section: item.section,
            afterSection: previous && previous.kind === "field" ? previous.section : "",
            columns: item.columns,
        });
    });
    return repeaters;
}

export function isOfficeEditable(field: QuestionnaireFieldItem) {
    return Boolean(field.employerFilled) || Boolean(field.defaultValue?.trim());
}

export function presentQuestions(definition: QuestionnaireDefinition) {
    return definitionFields(definition).map((field) => ({
        key: field.key,
        label: field.label,
        section: field.section,
        type: field.type,
        required: field.required,
        options: field.options,
        max: field.max,
        layout: field.layout,
        employerFilled: field.employerFilled,
        defaultValue: field.defaultValue,
    }));
}

function cleanDefault(field: QuestionnaireFieldItem, value: string) {
    const trimmed = value.trim().slice(0, field.max ?? 255);
    if (!trimmed) return undefined;
    if (field.type === "check") return trimmed === "ja" ? "ja" : undefined;
    if (field.type === "single" && !(field.options ?? []).includes(trimmed)) return undefined;
    if (field.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;
    return trimmed;
}

function reject(message: string): never {
    throw new AppError(BAD_REQUEST, message);
}

export function parseQuestionnaireDefinition(input: unknown): QuestionnaireDefinition {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        reject("Der Fragebogen ist ungültig.");
    }
    const body = input as { items?: unknown };
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 80) {
        reject("Der Fragebogen braucht mindestens eine Frage.");
    }
    const seen = new Set<string>();
    const items = body.items.map((raw) => parseItem(raw, seen));
    return { intro: QUESTIONNAIRE_INTRO, items };
}

function parseItem(raw: unknown, seen: Set<string>): QuestionnaireItem {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) reject("Eine Frage ist ungültig.");
    const item = raw as { kind?: unknown; key?: unknown };
    if (item.kind === "repeater") return parseRepeater(item, seen);
    if (item.kind === "field") return parseField(item, seen);
    reject("Eine Frage ist ungültig.");
}

function parseRepeater(raw: object, seen: Set<string>): QuestionnaireRepeaterItem {
    const key = "key" in raw ? raw.key : "";
    const source = catalogByKey.get(String(key));
    if (!source || source.kind !== "repeater") reject("Dieser Block ist nicht verfügbar.");
    if (seen.has(source.key)) reject("Jede Frage darf nur einmal vorkommen.");
    seen.add(source.key);
    return repeaterItem({
        key: source.key,
        section: source.section,
        afterSection: "",
        columns: [...source.columns],
    });
}

function parseField(raw: object, seen: Set<string>): QuestionnaireFieldItem {
    const key = "key" in raw && typeof raw.key === "string" ? raw.key.trim() : "";
    if (!key || seen.has(key)) reject("Jede Frage braucht einen eigenen Schlüssel.");
    seen.add(key);
    const catalog = catalogByKey.get(key);
    const builtin = catalog?.kind === "field";
    if (!builtin && !CUSTOM_KEY.test(key)) reject("Neue Fragen haben einen ungültigen Schlüssel.");
    const base = builtin
        ? { ...catalog }
        : customBase(raw, key);
    const label = "label" in raw && typeof raw.label === "string" ? raw.label.trim() : base.label;
    if (!label || label.length > 400) reject("Jede Frage braucht eine Beschriftung.");
    const contractFieldKey = readContractKey(raw);
    const draft: QuestionnaireFieldItem = {
        ...base,
        label: builtin ? base.label : label,
        required: "required" in raw ? Boolean(raw.required) : base.required,
        employerFilled: "employerFilled" in raw ? Boolean(raw.employerFilled) : base.employerFilled,
        contractFieldKey,
        defaultValue: undefined,
    };
    const posted = "defaultValue" in raw && typeof raw.defaultValue === "string" ? raw.defaultValue : "";
    draft.defaultValue = cleanDefault(draft, posted);
    if (builtin) {
        draft.section = catalog.section;
        draft.type = catalog.type;
        draft.options = catalog.options ? [...catalog.options] : undefined;
        draft.max = catalog.max;
        draft.layout = catalog.layout;
        draft.builtin = true;
    }
    return draft;
}

function customBase(raw: object, key: string): QuestionnaireFieldItem {
    const type = "type" in raw ? raw.type : "";
    if (type !== "text" && type !== "date" && type !== "single" && type !== "check") {
        reject("Dieser Fragetyp ist nicht verfügbar.");
    }
    const options =
        type === "single" && "options" in raw && Array.isArray(raw.options)
            ? raw.options.filter((option): option is string => typeof option === "string").map((option) => option.trim()).filter(Boolean)
            : [];
    if (type === "single" && (options.length < 2 || options.length > 8 || options.some((option) => option.length > 80))) {
        reject("Eine Auswahl braucht zwei bis acht Antworten.");
    }
    return {
        kind: "field",
        key,
        label: "",
        section: CUSTOM_SECTION,
        type,
        options: type === "single" ? options : undefined,
        max: type === "text" ? 255 : undefined,
        builtin: false,
    };
}

function readContractKey(raw: object) {
    if (!("contractFieldKey" in raw) || typeof raw.contractFieldKey !== "string") return undefined;
    const key = raw.contractFieldKey.trim();
    if (!key) return undefined;
    if (!CONTRACT_KEY.test(key)) reject("Das Vertragsfeld ist ungültig.");
    return key;
}

export function applyOverrides(
    definition: QuestionnaireDefinition,
    overrides: Record<string, string>,
): QuestionnaireDefinition {
    return {
        intro: definition.intro,
        items: definition.items.map((item) => {
            if (item.kind !== "field" || !isOfficeEditable(item)) return item;
            const next = cleanDefault(item, overrides[item.key] ?? item.defaultValue ?? "");
            return { ...item, defaultValue: next };
        }),
    };
}

export function readOverrides(value: unknown): Record<string, string> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
        Object.entries(value).flatMap(([key, entry]) =>
            typeof entry === "string" ? [[key, entry]] : [],
        ),
    );
}

export function hourKeys() {
    return HOUR_KEYS;
}
