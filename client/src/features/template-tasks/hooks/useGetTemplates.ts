import { useQuery } from '@tanstack/react-query';
import { templateQueries } from '../query-options/queries/template.queries';

export function useGetTemplates() {
  const { data, isLoading, isError } = useQuery(templateQueries.getTemplates());

  return { data, isLoading, isError };
}
