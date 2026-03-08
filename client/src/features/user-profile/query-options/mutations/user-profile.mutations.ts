import queryClient from '@/config/query.client';
import { PROFILEPICTURE } from '@/constants/querykey.consts';
import { mutationOptions } from '@tanstack/react-query';
import { uploadProfileFoto } from '../../api/index.api';
import { TFile } from '../../types';

export const userProfileMutations = {
  uploadFoto: () => {
    return mutationOptions<TFile, Error, TFile>({
      mutationFn: uploadProfileFoto,
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [PROFILEPICTURE] });
      },
    });
  },
};
