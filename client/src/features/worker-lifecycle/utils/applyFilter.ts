import { DropdownOption } from '@/components/ui/nested-dropdown';
import { EmployeeDataArray } from '@/features/employee-overview/schemas/schema';
import { OrgStatus } from '@/features/settings/org-statuses/org-status.types';
import { FilterMode } from '../hooks/useWorkerFilter';
import { WorkerRecord } from '../types/index.types';

export type SortDirection = 'asc' | 'desc';

const STATUS_VALUE = 'status';
const RESPONSIBLE_VALUE = 'responsible';
const SORT_MODES = new Set<FilterMode>(['createdAt']);

function compareByDate(
  left: string,
  right: string,
  direction: SortDirection
): number {
  const diff = new Date(left).getTime() - new Date(right).getTime();
  return direction === 'asc' ? diff : -diff;
}

export function applySort(
  workers: WorkerRecord[],
  direction: SortDirection
): WorkerRecord[] {
  return [...workers].sort((a, b) =>
    compareByDate(a.createdAt, b.createdAt, direction)
  );
}

function getSortDirection(mode: FilterMode, value: string): SortDirection {
  if (mode === 'createdAt' && value) {
    return value as SortDirection;
  }
  return 'desc';
}

export function applyFilterAndSort(
  workers: WorkerRecord[],
  mode: FilterMode,
  value: string
): WorkerRecord[] {
  const filtered = applyFilter(workers, mode, value);
  return applySort(filtered, getSortDirection(mode, value));
}

export function applyFilter(
  workers: WorkerRecord[],
  mode: FilterMode,
  value: string
): WorkerRecord[] {
  if (!mode || mode === 'all' || !value || SORT_MODES.has(mode)) return workers;
  switch (mode) {
    case 'engagementType':
      return workers.filter((w) => w.engagements.some((e) => e.type === value));
    case 'status':
      return workers.filter((w) =>
        w.engagements.some((e) => e.engagementStatus.id === value)
      );
    case 'responsible':
      return workers.filter((w) =>
        w.engagements.some((e) => e.responsibleUser.id === value)
      );
    default:
      return workers;
  }
}

export function buildResponsibleSubOptions(
  employees: EmployeeDataArray
): DropdownOption[] {
  return employees.map((e) => ({
    label: `${e.firstName} ${e.lastName}`,
    value: e.id,
  }));
}

export function buildEngagementStatusSubOptions(
  statuses: OrgStatus[]
): DropdownOption[] {
  return statuses.map((status) => ({
    label: status.name,
    value: status.id,
  }));
}

export function withDynamicOptions(
  options: DropdownOption[],
  employees: EmployeeDataArray,
  engagementStatuses: OrgStatus[]
): DropdownOption[] {
  return options.map((option) => {
    if (option.value === RESPONSIBLE_VALUE) {
      return { ...option, subOptions: buildResponsibleSubOptions(employees) };
    }
    if (option.value === STATUS_VALUE) {
      return {
        ...option,
        subOptions: buildEngagementStatusSubOptions(engagementStatuses),
      };
    }
    return option;
  });
}
