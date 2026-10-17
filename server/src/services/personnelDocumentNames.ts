export const PERSONNEL_DOCUMENT_NAMES = {
    personalausweis: "Personalausweis",
    fuehrerschein: "Führerschein",
    krankenkassenkarte: "Krankenkassenkarte",
    fragebogen: "Fragebogen",
    ordner: "Ordner",
} as const;

const ASSIGNABLE_PERSONNEL_DOCUMENT_NAMES = [
    "personalausweis",
    "fuehrerschein",
    "krankenkassenkarte",
] as const;

export type PersonnelDocumentName = keyof typeof PERSONNEL_DOCUMENT_NAMES;
export type AssignablePersonnelDocumentName =
    (typeof ASSIGNABLE_PERSONNEL_DOCUMENT_NAMES)[number];

export function isPersonnelDocumentName(
    value: string,
): value is PersonnelDocumentName {
    return Object.prototype.hasOwnProperty.call(PERSONNEL_DOCUMENT_NAMES, value);
}

export function isAssignablePersonnelDocumentName(
    value: string,
): value is AssignablePersonnelDocumentName {
    return (ASSIGNABLE_PERSONNEL_DOCUMENT_NAMES as readonly string[]).includes(
        value,
    );
}

export function personnelDocumentLabel(name: PersonnelDocumentName): string {
    return PERSONNEL_DOCUMENT_NAMES[name];
}
