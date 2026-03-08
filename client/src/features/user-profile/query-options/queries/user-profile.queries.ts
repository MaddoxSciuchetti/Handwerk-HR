import { PROFILEPICTURE } from '@/constants/querykey.consts';
import { getUser } from '@/features/auth/api/auth.api';
import { queryOptions } from '@tanstack/react-query';
import { getProfilePhoto } from '../../api/index.api';
import { AUTH } from '../../hooks/useAuth';
import { User } from '../../types/auth.type';

export const userProfileQueries = {
  User: () => {
    return queryOptions<User>({
      queryKey: [AUTH],
      queryFn: getUser,
      staleTime: Infinity,
    });
  },

  ProfileFoto: () => {
    return queryOptions<string>({
      queryKey: [PROFILEPICTURE],
      queryFn: getProfilePhoto,
    });
  },
};
