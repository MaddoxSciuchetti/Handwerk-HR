import { OFFBOARDING, ONBOARDING } from '@/constants/form.consts';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { templateQueries } from '../query-options/queries/template.queries';

function useFetchTask() {
  const { data = [], isPending } = useQuery(templateQueries.getTask());
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLowerCase();

  const tasksByTemplateType = useMemo(
    () => ({
      ONBOARDING: data.filter((value) => value.template_type === ONBOARDING),
      OFFBOARDING: data.filter((value) => value.template_type === OFFBOARDING),
    }),
    [data]
  );

  const filteredByType = useMemo(
    () => ({
      ONBOARDING: tasksByTemplateType.ONBOARDING.filter((item) =>
        item.description?.toLowerCase().includes(normalizedSearch)
      ),
      OFFBOARDING: tasksByTemplateType.OFFBOARDING.filter((item) =>
        item.description?.toLowerCase().includes(normalizedSearch)
      ),
    }),
    [tasksByTemplateType, normalizedSearch]
  );

  const taskLengthByTemplateType = useMemo(
    () => ({
      ONBOARDING: tasksByTemplateType.ONBOARDING.length,
      OFFBOARDING: tasksByTemplateType.OFFBOARDING.length,
    }),
    [tasksByTemplateType]
  );

  return {
    isLoading: isPending,
    tasksByTemplateType,
    filteredByType,
    taskLengthByTemplateType,
    search,
    setSearch,
  };
}

export default useFetchTask;
