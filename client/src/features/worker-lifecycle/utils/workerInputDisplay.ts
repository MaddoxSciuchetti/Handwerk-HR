import { UpdatePayload } from '@/features/task-management/types/index.types';
import { WorkerInfoItem } from '../consts/worker-info.consts';
import { formatDate } from './dateCalculation';

/** Must match `schemaKey` on items in `workerInfos` (Zod: birthday, entryDate, exitDate). */
export const isDateField = (workerItem: WorkerInfoItem) =>
  workerItem.schemaKey === 'birthday' ||
  workerItem.schemaKey === 'entryDate' ||
  workerItem.schemaKey === 'exitDate';

export const getPendingValue = (
  workerItem: WorkerInfoItem,
  variables?: UpdatePayload
) =>
  workerItem.schemaKey ? String(variables?.[workerItem.schemaKey] ?? '') : '';

export const getPendingDisplayValue = (
  workerItem: WorkerInfoItem,
  variables?: UpdatePayload
) => {
  const pendingValue = getPendingValue(workerItem, variables);

  if (!pendingValue) return '';

  return isDateField(workerItem) ? formatDate(pendingValue) : pendingValue;
};

export const getDisplayValue = (workerInfo: WorkerInfoItem) =>
  isDateField(workerInfo)
    ? formatDate(String(workerInfo.value || ''))
    : (workerInfo.value ?? '-');

export const getInputValueForActivation = (workerItem: WorkerInfoItem) =>
  isDateField(workerItem)
    ? workerItem.value
      ? formatDate(String(workerItem.value))
      : ''
    : String(workerItem.value);
