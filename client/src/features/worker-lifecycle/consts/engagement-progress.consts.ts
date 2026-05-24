export const ENGAGEMENT_PROGRESS_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export type EngagementProgressValue =
  (typeof ENGAGEMENT_PROGRESS_STATUSES)[number];

export const ENGAGEMENT_PROGRESS_OPTIONS: ReadonlyArray<{
  value: EngagementProgressValue;
  label: string;
}> = [
  { value: 'pending', label: 'Ausstehend' },
  { value: 'in_progress', label: 'In Bearbeitung' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'cancelled', label: 'Abgebrochen' },
];

export function engagementProgressLabel(
  status: EngagementProgressValue | string
): string {
  return (
    ENGAGEMENT_PROGRESS_OPTIONS.find((option) => option.value === status)
      ?.label ?? status
  );
}
