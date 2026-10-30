import type { WorkerRecord } from '../types/index.types';
import type { ExtraColumnSort, ExtraWorkerColumnId } from '../consts/extra-worker-columns';
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

function columnSortKey(
  worker: WorkerRecord,
  column: ExtraWorkerColumnId
): number {
  return column === 'birthday'
    ? birthdaySortKey(worker.birthday)
    : anniversarySortKey(worker.entryDate);
}

export function sortWorkersByExtraColumn(
  workers: WorkerRecord[],
  sort: ExtraColumnSort | null
): WorkerRecord[] {
  if (!sort) return workers;
  const direction = sort.direction === 'asc' ? 1 : -1;
  return [...workers].sort((left, right) => {
    const leftKey = columnSortKey(left, sort.column);
    const rightKey = columnSortKey(right, sort.column);
    if (leftKey !== rightKey) {
      if (!Number.isFinite(leftKey)) return 1;
      if (!Number.isFinite(rightKey)) return -1;
      return (leftKey - rightKey) * direction;
    }
    return `${left.lastName} ${left.firstName}`.localeCompare(
      `${right.lastName} ${right.firstName}`,
      'de'
    );
  });
}

export function nextExtraColumnSort(
  current: ExtraColumnSort | null,
  column: ExtraWorkerColumnId
): ExtraColumnSort {
  if (current?.column === column) {
    return {
      column,
      direction: current.direction === 'asc' ? 'desc' : 'asc',
    };
  }
  return { column, direction: 'asc' };
}
