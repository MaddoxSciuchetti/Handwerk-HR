import { zodResolver } from '@hookform/resolvers/zod';
import { UseFormProps } from 'react-hook-form';
import {
  absenceSchema,
  CreateWorker,
  createWorkerSchema,
} from '../schemas/schema';
import { AbsenceData } from '../types/index.types';

export const employeeFormOptions = {
  createEmployee: {
    resolver: zodResolver(createWorkerSchema),
    criteriaMode: 'all',
  } satisfies UseFormProps<CreateWorker>,

  editEmployeeAbsence: {
    resolver: zodResolver(absenceSchema),
    criteriaMode: 'all',
  } satisfies UseFormProps<AbsenceData>,
};
