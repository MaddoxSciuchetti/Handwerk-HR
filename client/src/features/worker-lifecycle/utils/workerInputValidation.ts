import { z } from 'zod';
import { WorkerInfoItem } from '../consts/worker-info.consts';
import {
  addWorkerBaseSchema,
  OffboardingValidation,
} from '../schemas/zod.schemas';

type WorkerFieldKey = NonNullable<WorkerInfoItem['schemaKey']>;
export type WorkerFieldSchema = z.ZodType<
  Record<string, unknown>,
  Record<string, unknown>
>;

export const getWorkerFieldSchema = (
  key: WorkerFieldKey
): WorkerFieldSchema => {
  return key === 'austrittsdatum'
    ? (OffboardingValidation.pick({ [key]: true } as Record<
        'austrittsdatum',
        true
      >) as WorkerFieldSchema)
    : (addWorkerBaseSchema.pick({ [key]: true } as Record<
        typeof key,
        true
      >) as WorkerFieldSchema);
};
