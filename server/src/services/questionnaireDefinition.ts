import { BAD_REQUEST } from "@/constants/http";
import AppError from "@/utils/AppError";
import { isValidInsuranceNumber, insuranceNumberInput } from "../../../shared/insuranceNumber";
import {
    QUESTIONNAIRE_FIELDS,
    QUESTIONNAIRE_INTRO,
    QUESTIONNAIRE_REPEATERS,
    type QuestionnaireColumn,
    type QuestionnaireField,
    type QuestionnaireRepeater,
} from "@/services/questionnaireForm";
import {
    HOURS_DISTRIBUTION_KEY,
    WEEKDAY_HOUR_KEYS,
    isWeekdayHourKey,
    isWeeklyHoursKey,
    normalizeHour,
} from "../../../shared/weeklyHours";

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
    bsbOnly?: boolean;
    defaultValue?: string;
    builtin?: boolean;
    contractFieldKey?: string;
    officeOnly?: boolean;
};

export type QuestionnaireRepeaterItem = {
    kind: "repeater";
    key: string;
    section: string;
    columns: QuestionnaireColumn[];
    allowMoreRows?: boolean;
};

export type QuestionnaireItem = QuestionnaireFieldItem | QuestionnaireRepeaterItem;

export type QuestionnaireDefinition = {
    name?: string;
    intro: string;
    items: QuestionnaireItem[];
};

const CUSTOM_KEY = /^custom\.[a-z0-9-]{8,80}$/;
const CUSTOM_ROWS = /^rows\.[a-z0-9-]{8,80}$/;
const COLUMN_KEY = /^[a-z][a-z0-9]{0,30}$/;
const CONTRACT_KEY = /^[a-zA-Z0-9._-]{1,120}$/;
const CUSTOM_SECTION = "Weitere Angaben";

const employmentExtent: QuestionnaireFieldItem = {
    kind: "field",
    key: "employmentExtent",
    label: "Umfang der Beschäftigung",
    section: "Beschäftigung",
    type: "single",
    options: ["Vollzeit", "Teilzeit"],
    required: true,
    employerFilled: false,
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
        options: field.options ? [...field.options] : undefined,
        max: field.max,
        layout: field.layout,
        builtin: true,
        required: isWeeklyHoursKey(field.key) ? field.required === true : true,
        employerFilled: false,
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
    return { name: "Personalfragebogen", intro: QUESTIONNAIRE_INTRO, items };
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
            allowMoreRows: item.allowMoreRows,
        });
    });
    return repeaters;
}

export function isWorkerLocked(field: { defaultValue?: string; bsbOnly?: boolean }) {
    return field.bsbOnly === true || Boolean(field.defaultValue?.trim());
}

export function fieldIsLocked(field: {
    key: string;
    defaultValue?: string;
    officeOnly?: boolean;
    bsbOnly?: boolean;
}) {
    if (field.bsbOnly === true || field.officeOnly === true) return true;
    if (isWeekdayHourKey(field.key)) return false;
    return isWorkerLocked(field);
}

export function questionRequired(field: {
    key?: string;
    type: string;
    required?: boolean;
    builtin?: boolean;
}) {
    if (field.key && isWeekdayHourKey(field.key)) return false;
    if (field.key === HOURS_DISTRIBUTION_KEY) return field.required === true;
    if (field.type === "file" || field.builtin === false) return field.required !== false;
    return true;
}

export function presentQuestions(definition: QuestionnaireDefinition) {
    return definitionFields(definition).map((field) => ({
        key: field.key,
        label: field.label,
        section: field.section,
        type: field.type,
        required: questionRequired(field) && !field.bsbOnly,
        options: field.options,
        max: field.max,
        layout: field.layout,
        employerFilled: fieldIsLocked(field),
        bsbOnly: field.bsbOnly,
        defaultValue: field.defaultValue,
        builtin: field.builtin,
    }));
}

function cleanDefault(field: QuestionnaireFieldItem, value: string) {
    if (field.key === "insuranceNumber") {
        const normalized = insuranceNumberInput(value);
        if (!normalized) return undefined;
        if (!isValidInsuranceNumber(normalized)) {
            reject("Die Versicherungsnummer hat nicht das richtige Format.");
        }
        return normalized;
    }
    if (isWeekdayHourKey(field.key)) {
        const hours = normalizeHour(value);
        if (hours === null) reject("Die Stunden sind ungültig.");
        return hours;
    }
    const trimmed = value.trim().slice(0, field.max ?? 255);
    if (!trimmed) return undefined;
    if (field.type === "file") return undefined;
    if (field.type === "check") {
        const options = field.options ?? [];
        if (options.length > 0) return options.includes(trimmed) ? trimmed : undefined;
        return trimmed === "ja" ? "ja" : undefined;
    }
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
    const body = input as { items?: unknown; name?: unknown };
    const name = body.name === undefined ? "Personalfragebogen" :
        typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 200) reject("Der Fragebogen braucht einen Namen mit höchstens 200 Zeichen.");
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 80) {
        reject("Der Fragebogen braucht mindestens eine Frage.");
    }
    const seen = new Set<string>();
    const items = body.items.map((raw) => parseItem(raw, seen));
    return { name, intro: QUESTIONNAIRE_INTRO, items };
}

function parseItem(raw: unknown, seen: Set<string>): QuestionnaireItem {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) reject("Eine Frage ist ungültig.");
    const item = raw as { kind?: unknown; key?: unknown };
    if (item.kind === "repeater") return parseRepeater(item, seen);
    if (item.kind === "field") return parseField(item, seen);
    reject("Eine Frage ist ungültig.");
}

function parseRepeater(raw: object, seen: Set<string>): QuestionnaireRepeaterItem {
    const key = "key" in raw && typeof raw.key === "string" ? raw.key.trim() : "";
    if (CUSTOM_ROWS.test(key)) return parseCustomTable(raw, key, seen);
    const source = catalogByKey.get(key);
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

function parseCustomTable(raw: object, key: string, seen: Set<string>): QuestionnaireRepeaterItem {
    if (seen.has(key)) reject("Jede Frage darf nur einmal vorkommen.");
    seen.add(key);
    const section = "section" in raw && typeof raw.section === "string" ? raw.section.trim() : "";
    if (!section || section.length > 400) reject("Jede Tabelle braucht eine Beschriftung.");
    if (!("columns" in raw) || !Array.isArray(raw.columns)) reject("Eine Tabelle braucht Spalten.");
    const columns = raw.columns.map((column) => readColumn(column));
    if (columns.length < 1 || columns.length > 6) reject("Eine Tabelle braucht eine bis sechs Spalten.");
    if (new Set(columns.map((column) => column.key)).size !== columns.length) {
        reject("Jede Spalte braucht einen eigenen Schlüssel.");
    }
    if (new Set(columns.map((column) => column.label)).size !== columns.length) {
        reject("Jede Spalte darf nur einmal vorkommen.");
    }
    return {
        kind: "repeater",
        key,
        section,
        columns,
        allowMoreRows: "allowMoreRows" in raw && raw.allowMoreRows === true ? true : undefined,
    };
}

function readColumn(raw: unknown): QuestionnaireColumn {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) reject("Eine Spalte ist ungültig.");
    const column = raw as { key?: unknown; label?: unknown; type?: unknown };
    const label = typeof column.label === "string" ? column.label.trim() : "";
    const key = typeof column.key === "string" ? column.key.trim() : "";
    if (!label || label.length > 80 || !COLUMN_KEY.test(key)) reject("Eine Spalte ist ungültig.");
    if (column.type !== "text" && column.type !== "date") reject("Eine Spalte ist ungültig.");
    return {
        key,
        label,
        type: column.type,
        officeOnly: columnOfficeOnly(column) ? true : undefined,
    };
}

function columnOfficeOnly(column: object) {
    return "officeOnly" in column && column.officeOnly === true;
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
    const postedLabel = "label" in raw && typeof raw.label === "string" ? raw.label.trim() : "";
    const label = postedLabel || base.label;
    if ((!label && !builtin) || label.length > 400) reject("Jede Frage braucht eine Beschriftung.");
    const contractFieldKey = readContractKey(raw);
    const draft: QuestionnaireFieldItem = {
        ...base,
        label,
        required: isWeeklyHoursKey(key) ? readRequired(raw, base.required === true) : questionRequired(base),
        employerFilled: false,
        contractFieldKey: base.type === "file" ? undefined : contractFieldKey,
        bsbOnly: ("bsbOnly" in raw && raw.bsbOnly === true) || readOfficeOnly(raw),
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
    } else {
        const section = readSection(raw);
        if (section) draft.section = section;
    }
    return draft;
}

function readSection(raw: object) {
    if (!("section" in raw) || typeof raw.section !== "string") return "";
    const section = raw.section.trim();
    if (section.length > 400) reject("Der Abschnitt ist zu lang.");
    return section;
}

function choiceOptions(raw: object) {
    if (!("options" in raw) || !Array.isArray(raw.options)) return [];
    return raw.options
        .filter((option): option is string => typeof option === "string")
        .map((option) => option.trim())
        .filter(Boolean);
}

function assertChoiceOptions(options: string[], message: string) {
    if (
        options.length < 2 ||
        options.length > 8 ||
        options.some((option) => option.length > 80)
    ) {
        reject(message);
    }
    if (new Set(options).size !== options.length) {
        reject("Jede Antwort darf nur einmal vorkommen.");
    }
}

function customBase(raw: object, key: string): QuestionnaireFieldItem {
    const type = "type" in raw ? raw.type : "";
    if (
        type !== "text" &&
        type !== "date" &&
        type !== "single" &&
        type !== "check" &&
        type !== "file"
    ) {
        reject("Dieser Fragetyp ist nicht verfügbar.");
    }
    const options = choiceOptions(raw);
    if (type === "single") {
        assertChoiceOptions(options, "Eine Auswahl braucht zwei bis acht Antworten.");
    }
    if (type === "check" && options.length > 0) {
        assertChoiceOptions(options, "Eine Checkbox braucht zwei bis acht Beschriftungen.");
    }
    return {
        kind: "field",
        key,
        label: "",
        section: CUSTOM_SECTION,
        type,
        options: type === "single" || (type === "check" && options.length > 0) ? options : undefined,
        max: type === "text" ? 255 : undefined,
        required: !("required" in raw && raw.required === false),
        builtin: false,
    };
}

function readRequired(raw: object, fallback: boolean) {
    if (!("required" in raw) || typeof raw.required !== "boolean") return fallback;
    return raw.required;
}

function readOfficeOnly(raw: object) {
    return "officeOnly" in raw && raw.officeOnly === true;
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
        ...definition,
        items: definition.items.map((item) => {
            if (item.kind !== "field") return item;
            const next = cleanDefault(item, overrides[item.key] ?? item.defaultValue ?? "");
            return {
                ...item,
                defaultValue: next,
                required: questionRequired(item),
                employerFilled: fieldIsLocked({ ...item, defaultValue: next }),
            };
        }),
    };
}

export type AddedQuestionnaireQuestion = QuestionnaireFieldItem;

export function parseCustomQuestions(input: unknown): QuestionnaireFieldItem[] {
    if (input == null) return [];
    if (!Array.isArray(input)) reject("Neue Fragen sind ungültig.");
    const seen = new Set<string>();
    return input.map((raw) => {
        const field = parseField(raw, seen);
        if (field.builtin) reject("Neue Fragen haben einen ungültigen Schlüssel.");
        return field;
    });
}

export function withAddedQuestions(
    definition: QuestionnaireDefinition,
    questions: QuestionnaireFieldItem[],
): QuestionnaireDefinition {
    const seen = new Set(definition.items.map((item) => item.key));
    const extras = questions.filter((question) => !seen.has(question.key));
    return { ...definition, items: [...definition.items, ...extras] };
}

export function readEngagementDraft(value: unknown): {
    values: Record<string, string>;
    questions: QuestionnaireFieldItem[];
    definition?: QuestionnaireDefinition;
} {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { values: {}, questions: [] };
    }
    const body = value as Record<string, unknown>;
    const nested =
        body.definition !== undefined ||
        Array.isArray(body.questions) ||
        (Boolean(body.values) && typeof body.values === "object" && !Array.isArray(body.values));
    if (!nested) return { values: readOverrides(value), questions: [] };
    return {
        values: readOverrides(body.values),
        questions: parseCustomQuestions(body.questions ?? []),
        definition: body.definition === undefined ? undefined : parseQuestionnaireDefinition(body.definition),
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
    return WEEKDAY_HOUR_KEYS;
}
