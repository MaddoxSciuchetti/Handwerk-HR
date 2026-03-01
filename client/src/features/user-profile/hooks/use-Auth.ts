import { getUser } from '@/features/auth/api/auth.api';
import { useQuery } from '@tanstack/react-query';
import { Auth, User } from '../types/auth.type';

export const AUTH = 'auth';

const useAuth = (opts: Record<string, any> = {}): Auth => {
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<User>({
    queryKey: [AUTH],
    queryFn: getUser,
    staleTime: Infinity,
  });

  return {
    user,
    isLoading,
    isError,
  };
};

export default useAuth;
