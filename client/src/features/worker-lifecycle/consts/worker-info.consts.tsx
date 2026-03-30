import { DescriptionFieldResponse } from '@/types/api.types';
import { baseWorkerSchema } from '../schemas/zod.schemas';

export type WorkerInfoItem = {
  label: string;
  value: string | number;
  className?: string;
  schemaKey?: keyof typeof baseWorkerSchema.shape | 'exitDate';
  form: boolean;
};

export const workerInfos = (
  workerInfo: DescriptionFieldResponse
): WorkerInfoItem[] => [
  {
    label: 'Vorname',
    className: 'text-muted-foreground',
    value: workerInfo.worker.vorname,
    schemaKey: 'firstName',
    form: true,
  },
  {
    label: 'Nachname',
    className: 'text-muted-foreground truncate',
    value: workerInfo.worker.nachname,
    schemaKey: 'lastName',
    form: true,
  },
  {
    label: 'E-Mail',
    className: 'text-muted-foreground ',
    value: workerInfo.worker.email || '',
    schemaKey: 'email',
    form: true,
  },
  {
    label: 'Geburtsdatum',
    className: 'text-muted-foreground',
    value: workerInfo.worker.geburtsdatum || '',
    schemaKey: 'birthday',
    form: true,
  },
  {
    label: 'Adresse',
    className: 'text-muted-foreground',
    value: workerInfo.worker.adresse || '',
    schemaKey: 'street',
    form: true,
  },
  {
    label: 'Eintrittsdatum',
    className: 'text-muted-foreground',
    value: workerInfo.worker.eintrittsdatum || '',
    schemaKey: 'entryDate',
    form: true,
  },
  {
    label: 'Position',
    className: 'text-muted-foreground',
    value: workerInfo.worker.position || '',
    schemaKey: 'position',
    form: true,
  },
  {
    label: 'Austrittsdatum',
    className: 'text-muted-foreground',
    value: workerInfo.worker.austrittsdatum || '',
    schemaKey: 'exitDate',
    form: true,
  },
  {
    label: 'Phase',
    className: 'text-muted-foreground',
    value: workerInfo.form.type,
    form: false,
  },
  {
    label: 'Aufgaben',
    className: 'text-muted-foreground',
    value: workerInfo.form.fields.length,
    form: false,
  },
];
