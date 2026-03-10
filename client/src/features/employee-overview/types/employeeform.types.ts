import z from 'zod';
import { employeeWorkerSchema } from '../schemas/employeeform.schemas';

export type EmployeeWorker = z.infer<typeof employeeWorkerSchema>;
