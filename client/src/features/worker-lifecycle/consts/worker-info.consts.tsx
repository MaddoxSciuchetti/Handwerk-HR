import { DescriptionFieldResponse } from '@/types/api.types';
import { formatDate } from '../utils/dateCalculation';

export type WorkerInfoItem = {
  label: string;
  value: string | number | null;
  className?: string;
};

export const workerInfos = (
  workerInfo: DescriptionFieldResponse
): WorkerInfoItem[] => [
  {
    label: 'Vorname',
    className: 'text-muted-foreground',
    value: workerInfo.worker.vorname,
  },
  {
    label: 'Nachname',
    className: 'text-muted-foreground',
    value: workerInfo.worker.nachname,
  },
  {
    label: 'E-Mail',
    className: 'text-muted-foreground',
    value: workerInfo.worker.email,
  },
  {
    label: 'Position',
    className: 'text-muted-foreground',
    value: workerInfo.worker.position,
  },
  {
    label: 'Adresse',
    className: 'text-muted-foreground',
    value: workerInfo.worker.adresse,
  },
  {
    label: 'Eintrittsdatum',
    className: 'text-muted-foreground',
    value: formatDate(workerInfo.worker.eintrittsdatum),
  },
  {
    label: 'Austrittsdatum',
    className: 'text-muted-foreground',
    value: formatDate(workerInfo.worker.austrittsdatum),
  },
  {
    label: 'Geburtsdatum',
    className: 'text-muted-foreground',
    value: formatDate(workerInfo.worker.geburtsdatum),
  },
  {
    label: 'Phase',
    className: 'text-muted-foreground',
    value: workerInfo.form.type,
  },
  {
    label: 'Aufgaben',
    className: 'text-muted-foreground',
    value: workerInfo.form.fields.length,
  },
];
