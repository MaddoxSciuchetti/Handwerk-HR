import { useQuery } from '@tanstack/react-query';
import { userProfileQueries } from '../query-options/queries/user-profile.queries';
import { Auth } from '../types/auth.type';

export const AUTH = 'auth';

const useAuth = (opts: Record<string, any> = {}): Auth => {
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery(userProfileQueries.User());

  return {
    user,
    isLoading,
    isError,
  };
};

export default useAuth;
