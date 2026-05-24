import { useQuery } from '@tanstack/react-query';
import { templateQueries } from '../query-options/queries/template.queries';

export function useGetTemplateTasks(templatedId: string) {
  const { data, isLoading, isError } = useQuery(
    templateQueries.getTasks(templatedId)
  );
  return { data, isLoading, isError };
}
