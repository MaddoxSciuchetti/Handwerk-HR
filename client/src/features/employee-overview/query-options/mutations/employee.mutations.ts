import queryClient from '@/config/query.client';
import { signup } from '@/features/auth/api/auth.api';
import {
  RegisterRequest,
  RegisterResponse,
} from '@/features/auth/types/auth.types';
import { mutationOptions } from '@tanstack/react-query';
import { EMPLOYEE_SPECIFICS } from '../../consts/query-keys';

export const employeeMutations = {
  createEmployee: () => {
    return mutationOptions<RegisterResponse, Error, RegisterRequest>({
      mutationFn: signup,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [EMPLOYEE_SPECIFICS],
        });
      },
    });
  },
};
