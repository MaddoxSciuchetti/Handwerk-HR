export const STATUS_MAP: Record<string, { label: string; className: string }> =
  {
    erledigt: {
      label: 'Erledigt',
      className: 'bg-(--status-success-bg) text-(--status-success-foreground)',
    },
    in_bearbeitung: {
      label: 'In Bearbeitung',
      className: 'bg-(--status-warning-bg) text-(--status-warning-foreground)',
    },
    offen: {
      label: 'Offen',
      className: 'bg-(--status-error-bg) text-(--status-error-foreground)',
    },
  };
