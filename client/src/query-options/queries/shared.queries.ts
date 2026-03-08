import { PROFILEPICTURE } from '@/constants/querykey.consts';
import { getSessions } from '@/features/auth/api/auth.api';
import { getProfilePhoto } from '@/features/user-profile/api/index.api';
import { SESSIONS } from '@/hooks/useSessions';
import { Session_API } from '@/types/api.types';
import { queryOptions } from '@tanstack/react-query';

export const userQueries = {
  getFoto: () =>
    queryOptions<string>({
      queryKey: [PROFILEPICTURE] as const,
      queryFn: getProfilePhoto,
    }),
};

export const sessionQueries = {
  getSession: () => {
    return queryOptions<Session_API>({
      queryKey: [SESSIONS],
      queryFn: getSessions,
    });
  },
};
