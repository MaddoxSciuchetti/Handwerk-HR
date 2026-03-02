import { WorkerItem } from '@/features/worker-lifecycle/types/index.types';

export const getFirstFormType = (item: WorkerItem) => {
  return item.employee_forms[0]?.form_type;
};
