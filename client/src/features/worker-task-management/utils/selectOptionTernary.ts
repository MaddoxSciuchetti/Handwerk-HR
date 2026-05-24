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
    className: 'bg-(--status-success-bg) text-(--status-success-foreground)',
    iconClassName: 'text-(--status-success-foreground)',
    dotClassName: 'bg-(--chart-2) shadow-sm',
  },
  in_bearbeitung: {
    label: 'In Bearbeitung',
    className: 'bg-(--status-warning-bg) text-(--status-warning-foreground)',
    iconClassName: 'text-(--status-warning-foreground)',
    dotClassName: 'bg-(--chart-3) shadow-sm',
  },
  offen: {
    label: 'Offen',
    className: 'bg-(--status-error-bg) text-(--status-error-foreground)',
    iconClassName: 'text-(--status-error-foreground)',
    dotClassName: 'bg-(--chart-5) shadow-sm',
  },
} satisfies Record<TaskStatus, StatusMapEntry>;
