import { DescriptionResponse } from '@/types/api.types';
import { useQuery } from '@tanstack/react-query';
import { getTemplateTask } from '../api';

function useFetchTask() {
  const { data } = useQuery<DescriptionResponse[]>({
    queryKey: ['description_root'],
    queryFn: getTemplateTask,
  });

  const OnboardingData = data?.filter(
    (value) => value.template_type === 'ONBOARDING'
  );
  const OffboardingData = data?.filter(
    (value) => value.template_type === 'OFFBOARDING'
  );

  return {
    OnboardingData,
    OffboardingData,
  };
}

export default useFetchTask;
