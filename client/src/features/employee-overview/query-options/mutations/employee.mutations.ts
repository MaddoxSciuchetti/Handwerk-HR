import queryClient from '@/config/query.client';
import { signup } from '@/features/auth/api/auth.api';
import { CreateAccountResponse } from '@/features/auth/types/auth.types';
import { User } from '@/features/user-profile/types/auth.type';
import { mutationOptions } from '@tanstack/react-query';
import {
  deleteEmployeeHandler,
  editEmployeeAbsence,
} from '../../api/employee-overview.api';
import { EMPLOYEE_SPECIFICS } from '../../consts/query-keys';
import { AbsenceFormData } from '../../schemas/schema';

import { CreateAccountParams } from '../../../../../../server/src/services/auth.serviceV2';

export const employeeMutations = {
  createEmployee: () => {
    return mutationOptions<CreateAccountResponse, Error, CreateAccountParams>({
      mutationFn: signup,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [EMPLOYEE_SPECIFICS],
        });
      },
    });
  },

  deleteEmployee: () => {
    return mutationOptions<User, Error, string>({
      mutationFn: deleteEmployeeHandler,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [EMPLOYEE_SPECIFICS],
        });
      },
    });
  },

  editEmployee: () => {
    return mutationOptions<AbsenceFormData, Error, AbsenceFormData>({
      mutationFn: editEmployeeAbsence,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [EMPLOYEE_SPECIFICS],
        });
      },
    });
  },
};
