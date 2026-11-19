import { useMemo, useState } from 'react';
import {
  EXTRA_WORKER_COLUMN_IDS,
  type ExtraColumnSort,
  type ExtraWorkerColumnId,
  type WorkerSortColumnId,
} from '../consts/extra-worker-columns';
import { nextExtraColumnSort } from '../utils/extraColumnSort';

type WorkerTablePrefs = {
  extraColumns: ExtraWorkerColumnId[];
  columnSort: ExtraColumnSort | null;
};

const SORT_COLUMNS = new Set<WorkerSortColumnId>([
  ...EXTRA_WORKER_COLUMN_IDS,
  'name',
]);

function storageKeyFor(
  organizationId: string | undefined,
  userId: string | undefined
) {
  if (!userId) return null;
  return `worker-table-prefs:v1:${organizationId ?? ''}:${userId}`;
}

function isExtraColumnId(value: unknown): value is ExtraWorkerColumnId {
  return (
    typeof value === 'string' &&
    (EXTRA_WORKER_COLUMN_IDS as readonly string[]).includes(value)
  );
}

function parseColumnSort(value: unknown): ExtraColumnSort | null {
  if (value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const column = (value as { column?: unknown }).column;
  const direction = (value as { direction?: unknown }).direction;
  if (
    typeof column !== 'string' ||
    !SORT_COLUMNS.has(column as WorkerSortColumnId)
  )
    return null;
  if (direction !== 'asc' && direction !== 'desc') return null;
  return { column: column as WorkerSortColumnId, direction };
}

function readPrefs(key: string | null): WorkerTablePrefs {
  if (!key) return { extraColumns: [], columnSort: null };
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { extraColumns: [], columnSort: null };
    const parsed = JSON.parse(raw) as Partial<WorkerTablePrefs>;
    if (!parsed || typeof parsed !== 'object')
      return { extraColumns: [], columnSort: null };
    const seen = new Set<ExtraWorkerColumnId>();
    const extraColumns = Array.isArray(parsed.extraColumns)
      ? parsed.extraColumns.filter((id): id is ExtraWorkerColumnId => {
          if (!isExtraColumnId(id) || seen.has(id)) return false;
          seen.add(id);
          return true;
        })
      : [];
    return {
      extraColumns,
      columnSort: parseColumnSort(parsed.columnSort),
    };
  } catch {
    return { extraColumns: [], columnSort: null };
  }
}

function writePrefs(key: string | null, prefs: WorkerTablePrefs) {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch {
    // Table prefs stay usable when the browser blocks persistent storage.
  }
}

export function useWorkerTablePrefs(
  userId?: string,
  organizationId?: string
) {
  const storageKey = storageKeyFor(organizationId, userId);
  const [selection, setSelection] = useState(() => ({
    key: storageKey,
    prefs: readPrefs(storageKey),
  }));
  const prefs = useMemo(
    () =>
      selection.key === storageKey ? selection.prefs : readPrefs(storageKey),
    [selection, storageKey]
  );

  const addExtraColumn = (id: ExtraWorkerColumnId) => {
    if (!storageKey) return;
    const extraColumns = prefs.extraColumns.includes(id)
      ? prefs.extraColumns
      : [...prefs.extraColumns, id];
    const next = { ...prefs, extraColumns };
    setSelection({ key: storageKey, prefs: next });
    writePrefs(storageKey, next);
  };

  const toggleColumnSort = (column: WorkerSortColumnId) => {
    if (!storageKey) return;
    const columnSort = nextExtraColumnSort(prefs.columnSort, column);
    const next = { ...prefs, columnSort };
    setSelection({ key: storageKey, prefs: next });
    writePrefs(storageKey, next);
  };

  return {
    extraColumns: prefs.extraColumns,
    columnSort: prefs.columnSort,
    addExtraColumn,
    toggleColumnSort,
  };
}
