import { getProfilePhoto } from '@/features/user-profile/api/index.api';
import { queryOptions } from '@tanstack/react-query';
import { getWorkerFiles } from '../../api/index.api';
import { HistoryData, ProfilePicture } from '../../consts/query-key.consts';
import { File_Request } from '../../types/index.types';

export const workerQueries = {
  getFoto: () =>
    queryOptions<string>({
      queryKey: [ProfilePicture] as const,
      queryFn: getProfilePhoto,
    }),

  getFiles: (id: number) =>
    queryOptions<File_Request[], Error, File_Request[]>({
      queryKey: [HistoryData, id] as const,
      queryFn: () => getWorkerFiles(id),
    }),
};
