import { useQuery } from '@tanstack/react-query';
import { engagementQueries } from '../query/engagements.query';

export function useFetchEngagements() {
  const { data, isLoading, isError } = useQuery(
    engagementQueries.fetchEngagements()
  );

  return { data, isLoading, isError };
}
