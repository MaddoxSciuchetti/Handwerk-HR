import { PROFILEPICTURE } from '@/constants/querykey.consts';
import { getProfilePhoto } from '@/features/user-profile/api/index.api';
import { queryOptions } from '@tanstack/react-query';

export const userQueries = {
  getFoto: () =>
    queryOptions<string>({
      queryKey: [PROFILEPICTURE] as const,
      queryFn: getProfilePhoto,
    }),
};
