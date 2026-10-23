export const ISSUE_STATUSES = [
  'error',
  'open',
  'in_progress',
  'done',
  'cancelled',
  'not_applicable',
] as const;

export type IssueStatusValue = (typeof ISSUE_STATUSES)[number];

export const ISSUE_STATUS_OPTIONS: ReadonlyArray<{
  value: IssueStatusValue;
  label: string;
}> = [
  { value: 'error', label: 'Fehler' },
  { value: 'open', label: 'Offen' },
  { value: 'in_progress', label: 'In Bearbeitung' },
  { value: 'done', label: 'Erledigt' },
  { value: 'cancelled', label: 'Abgebrochen' },
  { value: 'not_applicable', label: 'Nicht zutreffend' },
];

export function issueStatusLabel(status: IssueStatusValue | string): string {
  return (
    ISSUE_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}
