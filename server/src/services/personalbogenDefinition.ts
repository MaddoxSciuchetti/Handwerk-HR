import {
    HOURS_DISTRIBUTION_KEY,
    WEEKDAYS,
    WEEKLY_HOURS_PROMPT,
    WEEKLY_HOURS_SECTION,
} from "../../../shared/weeklyHours";

const PERSONAL = "Persönliche Angaben";
const JOB = "Beschäftigung";
const TERM = "Befristung";
const TAX = "Steuer";
const SOCIAL = "Sozialversicherung";
const VWL = "VWL - nur notwendig, wenn Vertrag vorliegt";

type PersonalField = {
    kind: "field";
    key: string;
    label?: string;
    section?: string;
    type?: "text" | "date" | "single" | "check";
    options?: string[];
    required?: boolean;
    officeOnly?: boolean;
    defaultValue?: string;
};

type PersonalRepeater = {
    kind: "repeater";
    key: string;
    section?: string;
    allowMoreRows?: boolean;
    columns?: {
        key: string;
        label: string;
        type: "text" | "date";
        officeOnly?: boolean;
    }[];
};

export type PersonalbogenItem = PersonalField | PersonalRepeater;

function field(key: string, label?: string): PersonalField {
    return label ? { kind: "field", key, label } : { kind: "field", key };
}

function office(
    key: string,
    label: string,
    section: string,
    extra: Partial<PersonalField> = {},
): PersonalField {
    return {
        kind: "field",
        key,
        label,
        section,
        required: false,
        officeOnly: true,
        ...extra,
    };
}

/** The DATEV Personalbogen, in document order. Grey cells are office-only. */
export function personalbogenItems(): PersonalbogenItem[] {
    return [
        field("lastName", "Familienname"),
        field("birthName", "ggf. Geburtsname"),
        field("firstName", "Vorname"),
        field("street", "Straße und Hausnummer inkl. Anschriftenzusatz"),
        field("postalCode", "PLZ"),
        field("city", "Ort"),
        field("birthday", "Geburtsdatum"),
        field("sex", "Geschlecht (bitte ankreuzen)"),
        field("insuranceNumber", "Versicherungsnummer gem. Sozialversicherungsausweis"),
        field("birthPlace", "Geburtsort, -land"),
        office("custom.schwerbehindert", "Schwerbehindert (bitte ankreuzen)", PERSONAL, {
            type: "single",
            options: ["ja", "nein"],
        }),
        field("nationality", "Staatsangehörigkeit"),
        field("employeeNumber", "Arbeitnehmernummer"),
        field("iban", "IBAN"),
        field("bic", "BIC"),

        field("entryDate", "Eintrittsdatum"),
        office("custom.ersteintritt", "Ersteintrittsdatum", JOB, { type: "date" }),
        {
            kind: "field",
            key: "custom.beschaeftigungsbetrieb",
            label: "Beschäftigungsbetrieb",
            section: JOB,
            type: "text",
            required: false,
            defaultValue: "BSB Haustechnik GmbH",
        },
        field("jobTitle", "Berufsbezeichnung"),
        office("custom.ausgeuebte-taetigkeit", "Ausgeübte Tätigkeit", JOB, { type: "text" }),
        field("employmentKind"),
        office("custom.probezeit", "Probezeit", JOB, {
            type: "single",
            options: ["ja", "nein"],
            defaultValue: "ja",
        }),
        office("custom.probezeit-dauer", "Dauer der Probezeit", JOB, {
            type: "text",
            defaultValue: "6 Monate",
        }),
        field("otherJobs", "Üben Sie weitere Beschäftigungen aus?"),
        field("marginalJob", "Handelt es sich hierbei um eine geringfügige Beschäftigung?"),
        field("schoolDegree", "Höchster Schulabschluss"),
        field("vocationalDegree", "Höchste Berufsausbildung"),
        field("trainingStart", "Beginn der Ausbildung"),
        field("trainingEnd", "Voraussichtliches Ende der Ausbildung"),
        field("constructionSince", "Im Baugewerbe beschäftigt seit"),
        office("employmentExtent", "Wöchentliche Arbeitszeit", JOB, {
            defaultValue: "Vollzeit",
            required: undefined,
        }),

        {
            kind: "field",
            key: HOURS_DISTRIBUTION_KEY,
            label: WEEKLY_HOURS_PROMPT,
            required: false,
        },
        ...WEEKDAYS.map((day) => ({
            kind: "field" as const,
            key: day.key,
            label: day.label,
            officeOnly: true,
        })),
        office("custom.urlaubsanspruch", "Urlaubsanspruch (Kalenderjahr)", WEEKLY_HOURS_SECTION, {
            type: "text",
        }),

        office("custom.kostenstelle", "Kostenstelle", JOB, { type: "text" }),
        office("custom.abteilungsnummer", "Abt.-Nummer", JOB, { type: "text" }),
        office("custom.personengruppe", "Personengruppe", JOB, { type: "text" }),
        office("custom.vertragsform", "Vertragsform", JOB, {
            type: "single",
            options: [
                "1- Unbefristet in Vollzeit",
                "2- Unbefristet in Teilzeit",
                "3- Befristet in Vollzeit",
                "4– Befristet in Teilzeit",
            ],
            defaultValue: "1- Unbefristet in Vollzeit",
        }),

        office("custom.befristungsart", "Das Arbeitsverhältnis ist", TERM, {
            type: "single",
            options: ["befristet", "zweckbefristet", "nicht befristet"],
            defaultValue: "nicht befristet",
        }),
        office("custom.befristung-bis", "Befristung Arbeitsvertrag zum", TERM, { type: "date" }),
        office(
            "custom.befristung-schriftlich",
            "Schriftlicher Abschluss des befristeten Arbeitsvertrages",
            TERM,
            { type: "check" },
        ),
        office("custom.vertragsabschluss", "Abschluss Arbeitsvertrag am", TERM, { type: "date" }),
        office(
            "custom.befristung-aussicht",
            "Befristete Beschäftigung ist für mindestens 2 Monate vorgesehen, mit Aussicht auf Weiterbeschäftigung",
            TERM,
            { type: "check" },
        ),

        field("taxId", "Identifikationsnr."),
        field("taxClass", "Steuerklasse/Faktor"),
        field("childAllowance", "Kinderfreibeträge"),
        field("religion", "Konfession"),

        field("healthInsurance", "Gesetzl. Krankenkasse (bei PKV: letzte ges. Krankenkasse)"),
        office("custom.beitrag-kv", "KV", SOCIAL, { type: "text" }),
        office("custom.beitrag-rv", "RV", SOCIAL, { type: "text" }),
        office("custom.beitrag-av", "AV", SOCIAL, { type: "text" }),
        office("custom.beitrag-pv", "PV", SOCIAL, { type: "text" }),
        office("custom.uv-gefahrentarif", "UV-Gefahrentarif", SOCIAL, { type: "text" }),
        office("custom.deuev-status", "DEÜV-Status", SOCIAL, { type: "text" }),

        { kind: "repeater", key: "children" },

        {
            kind: "repeater",
            key: "rows.entlohnung",
            section: "Entlohnung",
            allowMoreRows: true,
            columns: [
                { key: "bezeichnung", label: "Bezeichnung", type: "text", officeOnly: true },
                { key: "betrag", label: "Betrag", type: "text", officeOnly: true },
                { key: "gueltigab", label: "Gültig ab", type: "date", officeOnly: true },
                { key: "stundenlohn", label: "Stundenlohn", type: "text", officeOnly: true },
                {
                    key: "stundenlohnab",
                    label: "Gültig ab (Stundenlohn)",
                    type: "date",
                    officeOnly: true,
                },
            ],
        },

        field("vwlRecipient", "Empfang VWL durch"),
        field("vwlAmount", "Betrag"),
        office("custom.ag-anteil", "AG-Anteil (Höhe mtl.)", VWL, { type: "text" }),
        field("vwlSince", "Seit wann"),
        field("vwlContractNumber", "Vertragsnr."),
        field("vwlIban", "IBAN"),
        field("vwlBic", "BIC"),

        { kind: "repeater", key: "priorEmployment" },

        field("declaration"),
        field("signatureDate", "Datum"),
        field("minorSignatureDate", "Datum"),
        {
            kind: "field",
            key: "custom.arbeitgeber-datum",
            label: "Datum",
            section: "Unterschrift Arbeitgeber",
            type: "date",
            required: false,
        },
    ];
}
