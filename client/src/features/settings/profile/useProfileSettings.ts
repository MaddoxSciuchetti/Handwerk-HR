import queryClient from '@/config/query.client';
import { PROFILEPICTURE } from '@/constants/querykey.consts';
import { getUser } from '@/features/auth/api/auth.api';
import { AUTH } from '@/features/user-profile/hooks/useAuth';
import { User } from '@/features/user-profile/types/auth.type';
import { TFile } from '@/features/user-profile/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getProfilePhotoV2,
  updateProfileInformation,
  uploadProfilePhotoV2,
} from './profile.api';
import { ProfileUpdateInput } from './profile.schemas';

export function useProfileSettings() {
  const userQuery = useQuery<User>({
    queryKey: [AUTH],
    queryFn: getUser,
    staleTime: Infinity,
  });

  const photoQuery = useQuery<string>({
    queryKey: [PROFILEPICTURE],
    queryFn: getProfilePhotoV2,
  });

  const profileUpdateMutation = useMutation({
    mutationFn: updateProfileInformation,
    onMutate: async (nextProfile) => {
      await queryClient.cancelQueries({ queryKey: [AUTH] });

      const previousUser = queryClient.getQueryData<User>([AUTH]);

      if (previousUser) {
        queryClient.setQueryData<User>([AUTH], {
          ...previousUser,
          ...nextProfile,
        });
      }

      return { previousUser };
    },
    onError: (error: { message?: string }, _variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData<User>([AUTH], context.previousUser);
      }
      toast.error(error?.message || 'Profil konnte nicht gespeichert werden.');
    },
    onSuccess: () => {
      toast.success('Profil gespeichert.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [AUTH] });
    },
  });

  const photoUploadMutation = useMutation({
    mutationFn: uploadProfilePhotoV2,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILEPICTURE] });
      toast.success('Profilfoto aktualisiert.');
    },
    onError: (error: { message?: string }) => {
      toast.error(
        error?.message || 'Profilfoto konnte nicht hochgeladen werden.'
      );
    },
  });

  const saveProfile = (values: ProfileUpdateInput) => {
    profileUpdateMutation.mutate(values);
  };

  const uploadPhoto = (file: File) => {
    const payload: TFile = { file: [file] };
    photoUploadMutation.mutate(payload);
  };

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isError: userQuery.isError,
    profilePhoto: photoQuery.data,
    saveProfile,
    uploadPhoto,
    isSaving: profileUpdateMutation.isPending,
    isUploadingPhoto: photoUploadMutation.isPending,
  };
}
