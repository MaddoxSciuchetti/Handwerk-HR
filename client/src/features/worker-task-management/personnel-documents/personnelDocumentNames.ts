export const PERSONNEL_DOCUMENT_NAMES = [
  { value: 'personalausweis', label: 'Personalausweis' },
  { value: 'fuehrerschein', label: 'Führerschein' },
  { value: 'krankenkassenkarte', label: 'Krankenkassenkarte' },
  { value: 'fragebogen', label: 'Fragebogen' },
] as const;

export type PersonnelDocumentName =
  (typeof PERSONNEL_DOCUMENT_NAMES)[number]['value'];

export function isPersonnelDocumentName(
  value: string
): value is PersonnelDocumentName {
  return PERSONNEL_DOCUMENT_NAMES.some((item) => item.value === value);
}
