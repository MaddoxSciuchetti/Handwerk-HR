import { sessionQueries } from '@/query-options/queries/shared.queries';
import { useQuery } from '@tanstack/react-query';

export const SESSIONS = 'sessions';

const useSessions = () => {
  const { data, ...rest } = useQuery(sessionQueries.getSession());

  const sessions = data ?? [];
  if (!sessions) {
    throw new Error('userSession Error');
  }

  return { sessions: sessions || [], ...rest };
};
export default useSessions;
