import { OptionsObjekt } from '@/components/ui/selfmade/selectdropdown';
import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import { fetchOrgStatuses } from '@/features/settings/org-statuses/org-status.api';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FILTER_OPTIONS } from '../consts/filter.consts';
import { WorkerRecord } from '../types/index.types';
import { applyFilterAndSort, withDynamicOptions } from '../utils/applyFilter';

export type FilterMode =
  | ''
  | 'all'
  | 'createdAt'
  | 'engagementType'
  | 'status'
  | 'responsible';

const engagementStatusQueryKey = ['org', 'statuses', 'engagement'] as const;

export function useWorkerFilter(workers: WorkerRecord[] | undefined) {
  const [filterMode, setFilterMode] = useState<FilterMode>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterLabel, setFilterLabel] = useState<string>('');

  const { data: employees = [] } = useQuery(employeeQueries.getEmployees());
  const { data: engagementStatuses = [] } = useQuery({
    queryKey: engagementStatusQueryKey,
    queryFn: () => fetchOrgStatuses('engagement'),
  });

  const filterOptions = useMemo(
    () => withDynamicOptions(FILTER_OPTIONS, employees, engagementStatuses),
    [employees, engagementStatuses]
  );

  const handleSelect = (mode: string) => {
    const option = filterOptions.find((o) => o.value === mode);
    const next = (option?.value ?? '') as FilterMode;
    setFilterMode(next === 'all' ? '' : next);
    setFilterValue('');
    setFilterLabel(option?.label ?? '');
  };

  const handleSubSelect = (sub: OptionsObjekt, parent: OptionsObjekt) => {
    setFilterMode(parent.value as FilterMode);
    setFilterValue(sub.value);
    setFilterLabel(`${parent.label}: ${sub.label}`);
  };

  const filteredWorkers = useMemo(
    () => applyFilterAndSort(workers ?? [], filterMode, filterValue),
    [workers, filterMode, filterValue]
  );

  return {
    filterLabel,
    filterOptions,
    filteredWorkers,
    handleSelect,
    handleSubSelect,
  };
}
