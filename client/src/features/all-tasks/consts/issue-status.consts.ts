export const ISSUE_STATUSES = [
  'open',
  'in_progress',
  'done',
  'cancelled',
] as const;

export type IssueStatusValue = (typeof ISSUE_STATUSES)[number];

export const ISSUE_STATUS_OPTIONS: ReadonlyArray<{
  value: IssueStatusValue;
  label: string;
}> = [
  { value: 'open', label: 'Offen' },
  { value: 'in_progress', label: 'In Bearbeitung' },
  { value: 'done', label: 'Erledigt' },
  { value: 'cancelled', label: 'Abgebrochen' },
];

export function issueStatusLabel(status: IssueStatusValue | string): string {
  return (
    ISSUE_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}
