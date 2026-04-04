export const TASK_STATUSES = ['erledigt', 'in_bearbeitung', 'offen'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

type StatusMapEntry = {
  label: string;
  className: string;
  iconClassName: string;
  dotClassName: string;
};

export const STATUS_MAP: Record<TaskStatus, StatusMapEntry> = {
  erledigt: {
    label: 'Erledigt',
    className: 'bg-[var(--status-success-bg)] text-[var(--status-success-foreground)]',
    iconClassName: 'text-[var(--status-success-foreground)]',
    dotClassName: 'bg-[var(--chart-2)] shadow-sm',
  },
  in_bearbeitung: {
    label: 'In Bearbeitung',
    className: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-foreground)]',
    iconClassName: 'text-[var(--status-warning-foreground)]',
    dotClassName: 'bg-[var(--chart-3)] shadow-sm',
  },
  offen: {
    label: 'Offen',
    className: 'bg-[var(--status-error-bg)] text-[var(--status-error-foreground)]',
    iconClassName: 'text-[var(--status-error-foreground)]',
    dotClassName: 'bg-[var(--chart-5)] shadow-sm',
  },
} satisfies Record<TaskStatus, StatusMapEntry>;
