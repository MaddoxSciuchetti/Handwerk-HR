import { DescriptionFieldResponse } from '@/types/api.types';
import { EmployeeInfoResponse } from '@/types/api.types';
import { queryOptions } from '@tanstack/react-query';
import {
  fetchDescriptionData,
  getEmployeeById,
  specificEmployeeData,
} from '../../api/employee-overview.api';
import { EMPLOYEE_SPECIFICS, PROCESS_DATA } from '../../consts/query-keys';
import { EmployeeDataArray } from '../../schemas/schema';

export const employeeQueries = {
  getEmployees: () => {
    return queryOptions<EmployeeDataArray, Error>({
      queryKey: [EMPLOYEE_SPECIFICS],
      queryFn: specificEmployeeData,
    });
  },

  fetchDescription: (id: number, form_type: string) => {
    return queryOptions<DescriptionFieldResponse, Error>({
      queryKey: [PROCESS_DATA, id, form_type],
      queryFn: () => fetchDescriptionData(id, form_type),
    });
  },

  employeeById: (employeeId: string) => {
    return queryOptions<EmployeeInfoResponse, Error>({
      queryKey: ['employeeInfo', employeeId],
      queryFn: () => getEmployeeById(employeeId),
    });
  },
};
