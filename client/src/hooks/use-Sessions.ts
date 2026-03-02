import { getSessions } from '@/features/auth/api/auth.api';
import { useQuery } from '@tanstack/react-query';

export const SESSIONS = 'sessions';

const useSessions = () => {
  const { data, ...rest } = useQuery({
    queryKey: [SESSIONS],
    queryFn: getSessions,
  });

  const sessions = data ?? [];
  if (!sessions) {
    throw new Error('userSession Error');
  }

  return { sessions: sessions || [], ...rest };
};
export default useSessions;
