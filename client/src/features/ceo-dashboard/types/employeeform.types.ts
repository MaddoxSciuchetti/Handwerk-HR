import z from 'zod';
import { EmployeexWorkerData } from '../schemas/employeeform.schemas';

export type TEmployeeForm = z.infer<typeof EmployeexWorkerData>;
export type TEmployeeeFormId = z.infer<typeof EmployeexWorkerData>[number];
