import type { WorkerRecord } from '../types/index.types';
import type {
  ExtraColumnSort,
  ExtraWorkerColumnId,
  WorkerSortColumnId,
} from '../consts/extra-worker-columns';
import { nextCompanyAnniversary } from './companyAnniversary';
import { parseCalendarDate } from './calendarDate';

function birthdaySortKey(birthday: string | null | undefined): number {
  if (!birthday) return Number.POSITIVE_INFINITY;
  const date = parseCalendarDate(birthday);
  if (!date) return Number.POSITIVE_INFINITY;
  return date.getUTCMonth() * 32 + date.getUTCDate();
}

function anniversarySortKey(entryDate: string | null | undefined): number {
  const anniversary = nextCompanyAnniversary(entryDate);
  if (!anniversary) return Number.POSITIVE_INFINITY;
  return anniversary.date.getTime();
}

function calendarDateSortKey(value: string | null | undefined): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const date = parseCalendarDate(value);
  if (!date) return Number.POSITIVE_INFINITY;
  return date.getTime();
}

function nameSortKey(worker: WorkerRecord): string {
  return `${worker.lastName} ${worker.firstName}`.trim();
}

function compareNames(left: WorkerRecord, right: WorkerRecord): number {
  return nameSortKey(left).localeCompare(nameSortKey(right), 'de', {
    sensitivity: 'base',
  });
}

function columnSortKey(
  worker: WorkerRecord,
  column: ExtraWorkerColumnId
): number {
  switch (column) {
    case 'birthday':
      return birthdaySortKey(worker.birthday);
    case 'entryDate':
      return calendarDateSortKey(worker.entryDate);
    case 'anniversary':
      return anniversarySortKey(worker.entryDate);
  }
}

export function sortWorkersByExtraColumn(
  workers: WorkerRecord[],
  sort: ExtraColumnSort | null
): WorkerRecord[] {
  if (!sort) return workers;
  const direction = sort.direction === 'asc' ? 1 : -1;
  const column = sort.column;
  if (column === 'name') {
    return [...workers].sort(
      (left, right) => compareNames(left, right) * direction
    );
  }
  return [...workers].sort((left, right) => {
    const leftKey = columnSortKey(left, column);
    const rightKey = columnSortKey(right, column);
    if (leftKey !== rightKey) {
      if (!Number.isFinite(leftKey)) return 1;
      if (!Number.isFinite(rightKey)) return -1;
      return (leftKey - rightKey) * direction;
    }
    return compareNames(left, right);
  });
}

export function nextExtraColumnSort(
  current: ExtraColumnSort | null,
  column: WorkerSortColumnId
): ExtraColumnSort {
  if (current?.column === column) {
    return {
      column,
      direction: current.direction === 'asc' ? 'desc' : 'asc',
    };
  }
  return { column, direction: 'asc' };
}
