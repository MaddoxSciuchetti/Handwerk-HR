export const EXTRA_WORKER_COLUMN_IDS = ['anniversary', 'birthday'] as const;

export type ExtraWorkerColumnId = (typeof EXTRA_WORKER_COLUMN_IDS)[number];

export type ExtraWorkerColumnOption = {
  id: ExtraWorkerColumnId;
  menuLabel: string;
  headerLabel: string;
};

export const EXTRA_WORKER_COLUMN_OPTIONS: ExtraWorkerColumnOption[] = [
  {
    id: 'anniversary',
    menuLabel: 'Anniversary date',
    headerLabel: 'Anniversary',
  },
  {
    id: 'birthday',
    menuLabel: 'Birthday',
    headerLabel: 'Birthday',
  },
];

export type ExtraColumnSort = {
  column: ExtraWorkerColumnId;
  direction: 'asc' | 'desc';
};
