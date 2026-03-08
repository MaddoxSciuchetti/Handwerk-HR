import queryClient from '@/config/query.client';
import { signup } from '@/features/auth/api/auth.api';
import {
  RegisterRequest,
  RegisterResponse,
} from '@/features/auth/types/auth.types';
import { User } from '@/features/user-profile/types/auth.type';
import { mutationOptions } from '@tanstack/react-query';
import {
  deleteEmployeeHandler,
  editEmployeeAbsence,
} from '../../api/employee-overview.api';
import { EMPLOYEE_SPECIFICS } from '../../consts/query-keys';
import { AbsenceData } from '../../types/index.types';

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
    return mutationOptions<AbsenceData, Error, AbsenceData>({
      mutationFn: editEmployeeAbsence,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [EMPLOYEE_SPECIFICS],
        });
      },
    });
  },
};
