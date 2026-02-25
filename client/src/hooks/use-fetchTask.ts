import { fetchTaskData } from '@/lib/api';
import { TDescriptionResponse } from '@/types/api';
import { useQuery } from '@tanstack/react-query';

function useFetchTask() {
  const { data } = useQuery<TDescriptionResponse[]>({
    queryKey: ['description_root'],
    queryFn: fetchTaskData,
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
