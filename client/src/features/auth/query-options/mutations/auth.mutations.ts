import { SuccessResponse } from '@/types/api.types';
import { mutationOptions } from '@tanstack/react-query';
import { sendPasswordResetEmail } from '../../api/auth.api';

export const authMutations = {
  passwortResetMail: () => {
    return mutationOptions<SuccessResponse<string>, Error, string>({
      mutationFn: sendPasswordResetEmail,
    });
  },
};
