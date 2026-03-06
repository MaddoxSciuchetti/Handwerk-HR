import { OFFBOARDING, ONBOARDING } from '@/constants/form.consts';
import { DescriptionResponse } from '@/types/api.types';
import { useQuery } from '@tanstack/react-query';
import { getTemplateTask } from '../api';
import { DESCRIPTION_ROOT } from '../consts/query-key.consts';

function useFetchTask() {
  const { data } = useQuery<DescriptionResponse[]>({
    queryKey: [DESCRIPTION_ROOT],
    queryFn: getTemplateTask,
  });

  const OnboardingData = data?.filter(
    (value) => value.template_type === ONBOARDING
  );
  const OffboardingData = data?.filter(
    (value) => value.template_type === OFFBOARDING
  );

  return {
    OnboardingData,
    OffboardingData,
  };
}

export default useFetchTask;
