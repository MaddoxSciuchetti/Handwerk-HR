import {
  DescriptionFieldResponse,
  EmployeeInfoResponse,
} from '@/types/api.types';
import { queryOptions } from '@tanstack/react-query';
import {
  fetchDescriptionData,
  getEmployeeById,
  specificEmployeeData,
} from '../../api/employee-overview.api';
import { EMPLOYEE_SPECIFICS, PROCESS_DATA } from '../../consts/query-keys';
import { OrgUsersArray } from '../../schemas/schema';

export const employeeQueries = {
  getEmployees: () => {
    return queryOptions<OrgUsersArray, Error>({
      queryKey: [EMPLOYEE_SPECIFICS],
      queryFn: specificEmployeeData,
    });
  },

  fetchDescription: (id: string) => {
    return queryOptions<DescriptionFieldResponse, Error>({
      queryKey: [PROCESS_DATA, id],
      queryFn: () => fetchDescriptionData(id),
    });
  },

  employeeById: (employeeId: string) => {
    return queryOptions<EmployeeInfoResponse, Error>({
      queryKey: ['employeeInfo', employeeId],
      queryFn: () => getEmployeeById(employeeId),
    });
  },
};
