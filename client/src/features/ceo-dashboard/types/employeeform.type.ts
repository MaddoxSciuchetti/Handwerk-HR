import z from 'zod';
import { EmployFormSchema } from '../schemas/employeeform.schema';

export type TEmployForm = z.infer<typeof EmployFormSchema>;
export type TEmployeFormId = z.infer<typeof EmployFormSchema>[number];
