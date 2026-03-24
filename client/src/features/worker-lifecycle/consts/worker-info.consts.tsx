import { DescriptionFieldResponse } from '@/types/api.types';
import { addWorkerBaseSchema } from '../schemas/zod.schemas';
import { formatDate } from '../utils/dateCalculation';

export type WorkerInfoItem = {
  label: string;
  value: string | number;
  className?: string;
  schemaKey?: keyof typeof addWorkerBaseSchema.shape | 'austrittsdatum';
  form: boolean;
};

export const workerInfos = (
  workerInfo: DescriptionFieldResponse
): WorkerInfoItem[] => [
  {
    label: 'Vorname',
    className: 'text-muted-foreground',
    value: workerInfo.worker.vorname,
    schemaKey: 'vorname',
    form: true,
  },
  {
    label: 'Nachname',
    className: 'text-muted-foreground truncate',
    value: workerInfo.worker.nachname,
    schemaKey: 'nachname',
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
    value: formatDate(workerInfo.worker.geburtsdatum),
    schemaKey: 'geburtsdatum',
    form: true,
  },
  {
    label: 'Adresse',
    className: 'text-muted-foreground',
    value: workerInfo.worker.adresse || '',
    schemaKey: 'adresse',
    form: true,
  },
  {
    label: 'Eintrittsdatum',
    className: 'text-muted-foreground',
    value: formatDate(workerInfo.worker.eintrittsdatum),
    schemaKey: 'eintrittsdatum',
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
    value: formatDate(workerInfo.worker.austrittsdatum),
    schemaKey: 'austrittsdatum',
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
