import { DescriptionFieldResponse } from '@/types/api.types';
import { queryOptions } from '@tanstack/react-query';
import {
  fetchDescriptionData,
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
};
