import { deleteSession } from '@/features/auth/api/auth.api';
import { SessionCache } from '@/types/api.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SESSIONS } from './useSessions';

function useDeleteSession(sessionId: string) {
  const queryClient = useQueryClient();
  const { mutate, ...rest } = useMutation({
    mutationFn: () => deleteSession(sessionId),
    onSuccess: () => {
      queryClient.setQueryData<SessionCache>([SESSIONS], (cache) => {
        return cache?.filter((session) => session.id !== sessionId) ?? [];
      });
    },
  });

  return { deleteSession: mutate, ...rest };
}

export default useDeleteSession;
