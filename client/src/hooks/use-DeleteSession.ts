import { deleteSession } from '@/features/auth/api/auth.api';
import { SessionCache } from '@/types/api.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SESSIONS } from './use-Sessions';

function useDeleteSession(sessionId: string) {
  const queryClient = useQueryClient();
  const { mutate, ...rest } = useMutation({
    mutationFn: () => deleteSession(sessionId),
    onSuccess: () => {
      queryClient.setQueryData<SessionCache>([SESSIONS], (cache) => {
        const updatedCache =
          cache?.filter((session) => session.id !== sessionId) ?? [];
        return updatedCache;
      });
    },
  });
  const updatedCache = queryClient.getQueryData([SESSIONS]);

  return { deleteSession: mutate, ...rest };
}

export default useDeleteSession;
