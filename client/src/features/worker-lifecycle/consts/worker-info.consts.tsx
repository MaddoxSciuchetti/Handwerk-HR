import { baseWorkerSchema } from '../schemas/zod.schemas';
import { WorkerDetailResponse } from '../types/index.types';

export type WorkerInfoItem = {
  label: string;
  value: string | number;
  className?: string;
  schemaKey?: keyof typeof baseWorkerSchema.shape | 'exitDate';
  form: boolean;
};

export const workerInfos = (
  workerInfo: WorkerDetailResponse
): WorkerInfoItem[] => [
  {
    label: 'Vorname',
    className: 'text-muted-foreground',
    value: workerInfo.data.firstName,
    schemaKey: 'firstName',
    form: true,
  },
  {
    label: 'Nachname',
    className: 'text-muted-foreground truncate',
    value: workerInfo.data.lastName,
    schemaKey: 'lastName',
    form: true,
  },
  {
    label: 'E-Mail',
    className: 'text-muted-foreground ',
    value: workerInfo.data.email || '',
    schemaKey: 'email',
    form: true,
  },
  {
    label: 'Geburtsdatum',
    className: 'text-muted-foreground',
    value: workerInfo.data.birthday || '',
    schemaKey: 'birthday',
    form: true,
  },
  {
    label: 'Adresse',
    className: 'text-muted-foreground',
    value: workerInfo.data.street || '',
    schemaKey: 'street',
    form: true,
  },
  {
    label: 'Eintrittsdatum',
    className: 'text-muted-foreground',
    value: workerInfo.data.entryDate || '',
    schemaKey: 'entryDate',
    form: true,
  },
  {
    label: 'Position',
    className: 'text-muted-foreground',
    value: workerInfo.data.position || '',
    schemaKey: 'position',
    form: true,
  },
  {
    label: 'Austrittsdatum',
    className: 'text-muted-foreground',
    value: workerInfo.data.exitDate || '',
    schemaKey: 'exitDate',
    form: true,
  },
  {
    label: 'Phase',
    className: 'text-muted-foreground',
    value: workerInfo.data.engagements[0]?.type || '',
    form: false,
  },
  {
    label: 'Aufgaben',
    className: 'text-muted-foreground',
    value: workerInfo.data.engagements.reduce(
      (total, engagement) => total + (engagement.issues?.length ?? 0),
      0
    ),
    form: false,
  },
];
