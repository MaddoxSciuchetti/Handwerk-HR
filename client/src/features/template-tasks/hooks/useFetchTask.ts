import { OFFBOARDING, ONBOARDING } from '@/constants/form.consts';
import { useQuery } from '@tanstack/react-query';
import { templateQueries } from '../query-options/queries/template.queries';

function useFetchTask() {
  const { data } = useQuery(templateQueries.getTask());

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
