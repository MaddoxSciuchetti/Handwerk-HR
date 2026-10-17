import { useMutation } from '@tanstack/react-query';
import { taskMutations } from '../query-options/mutations/tasks.mutations';
import useAuth from '@/features/user-profile/hooks/useAuth';

export function useSaveTaskComment() {
  const { user } = useAuth();
  return useMutation(
    taskMutations.saveTaskComment(
      user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            avatarUrl: user.avatarUrl ?? null,
          }
        : undefined
    )
  );
}
