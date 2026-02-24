import { OffboardingItem } from '@/types/onof_home';

export const getFirstFormType = (item: OffboardingItem) => {
  return item.employee_forms[0]?.form_type;
};
