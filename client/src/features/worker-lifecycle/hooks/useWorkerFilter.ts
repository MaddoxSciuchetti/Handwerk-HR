import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ENGAGEMENT_TYPE_OPTIONS } from '../consts/engagement-type.consts';
import type { EngagementType, WorkerRecord } from '../types/index.types';
import { applyFilterAndSort } from '../utils/applyFilter';

const allTypes = ENGAGEMENT_TYPE_OPTIONS.map((option) => option.value);

function readTypes(key: string | null): EngagementType[] {
  if (!key) return allTypes;
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return allTypes;
    const values: unknown = JSON.parse(saved);
    if (
      !Array.isArray(values) ||
      values.some((value) => !allTypes.includes(value))
    )
      return allTypes;
    return allTypes.filter((type) => values.includes(type));
  } catch {
    return allTypes;
  }
}

export function useWorkerFilter(
  workers: WorkerRecord[] | undefined,
  userId?: string,
  organizationId?: string
) {
  const storageKey = userId
    ? `worker-type-filter:v1:${organizationId ?? ''}:${userId}`
    : null;
  const [selection, setSelection] = useState(() => ({
    key: storageKey,
    types: readTypes(storageKey),
  }));
  // Resolve a new account's saved value immediately, without writing the previous
  // account's selection into its preferences during authentication changes.
  const selectedTypes = useMemo(
    () =>
      selection.key === storageKey ? selection.types : readTypes(storageKey),
    [selection, storageKey]
  );
  const { data: employees = [] } = useQuery(employeeQueries.getEmployees());

  const toggleType = (type: EngagementType) => {
    if (!storageKey) return;
    const types = allTypes.filter((value) =>
      value === type
        ? !selectedTypes.includes(value)
        : selectedTypes.includes(value)
    );
    setSelection({ key: storageKey, types });
    try {
      localStorage.setItem(storageKey, JSON.stringify(types));
    } catch {
      // Filtering remains usable when the browser blocks persistent storage.
    }
  };
  const filteredWorkers = useMemo(
    () => applyFilterAndSort(workers ?? [], selectedTypes),
    [workers, selectedTypes]
  );

  return {
    employees,
    isTeamMode: selectedTypes.length === 1 && selectedTypes[0] === 'transfer',
    selectedTypes,
    filteredWorkers,
    toggleType,
  };
}
