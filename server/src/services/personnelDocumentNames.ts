export const PERSONNEL_DOCUMENT_NAMES = {
    personalausweis: "Personalausweis",
    fuehrerschein: "Führerschein",
    krankenkassenkarte: "Krankenkassenkarte",
    fragebogen: "Fragebogen",
} as const;

export type PersonnelDocumentName = keyof typeof PERSONNEL_DOCUMENT_NAMES;

export function isPersonnelDocumentName(
    value: string,
): value is PersonnelDocumentName {
    return Object.prototype.hasOwnProperty.call(PERSONNEL_DOCUMENT_NAMES, value);
}

export function personnelDocumentLabel(name: PersonnelDocumentName): string {
    return PERSONNEL_DOCUMENT_NAMES[name];
}
