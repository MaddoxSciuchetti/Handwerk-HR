import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSession } from '../lib/api';
import { SESSIONS } from './use-Sessions';

type Cache = {
  createdAt: string;
  id: string;
  isCurrent: boolean;
  userAgent: string;
};

type SessionCache = Cache[];

const useDeleteSession = (sessionId: string) => {
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
};

export default useDeleteSession;
