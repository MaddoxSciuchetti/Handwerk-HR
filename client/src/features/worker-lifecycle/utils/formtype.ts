import { OffboardingItem } from '@/features/worker-lifecycle/types/index.types';

export const getFirstFormType = (item: OffboardingItem) => {
  return item.employee_forms[0]?.form_type;
};
