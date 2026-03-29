import { zodResolver } from '@hookform/resolvers/zod';
import { UseFormProps } from 'react-hook-form';
import {
  AbsenceFormData,
  absenceSchema,
  CreateWorker,
  createWorkerSchema,
} from '../schemas/schema';

export const employeeFormOptions = {
  createEmployee: {
    resolver: zodResolver(createWorkerSchema),
    criteriaMode: 'all',
  } satisfies UseFormProps<CreateWorker>,

  editEmployeeAbsence: {
    resolver: zodResolver(absenceSchema),
    criteriaMode: 'all',
  } satisfies UseFormProps<AbsenceFormData>,
};
