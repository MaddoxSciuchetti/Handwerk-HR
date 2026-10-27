import {
  formatCompanyAnniversary,
  nextCompanyAnniversary,
} from '../utils/companyAnniversary';
import { getWorkerIssueCount } from '../utils/workerHealth.utils';
import { showsCompanyAnniversary } from '../utils/teamMembers';
import type { WorkerDetailResponse } from '../types/index.types';

export type WorkerEngagementInfoItem = {
  label: string;
  value: string;
  editable?:
    | 'email'
    | 'firstName'
    | 'lastName'
    | 'birthday'
    | 'street'
    | 'postalCode'
    | 'city'
    | 'state'
    | 'country'
    | 'entryDate'
    | 'exitDate'
    | 'position'
    | 'workwearSize'
    | 'phase';
  inputType?: 'text' | 'date';
  required?: boolean;
  maxLength?: number;
  itemName?: 'Hose' | 'T-Shirt';
  engagementId?: string;
};

function workwearSize(worker: WorkerDetailResponse['data'], itemName: string) {
  return (
    worker.workwear?.find((item) => item.itemName === itemName)?.size ?? ''
  );
}

function dateValue(value: string | null) {
  return value?.slice(0, 10) ?? '';
}

export function workerEngagementInfoItems(
  worker: WorkerDetailResponse['data']
): WorkerEngagementInfoItem[] {
  const engagement = worker.engagements[0];
  const taskCount = getWorkerIssueCount(worker);

  const items: WorkerEngagementInfoItem[] = [
    {
      label: 'Vorname',
      value: worker.firstName,
      editable: 'firstName',
      required: true,
      maxLength: 120,
    },
    {
      label: 'Nachname',
      value: worker.lastName,
      editable: 'lastName',
      required: true,
      maxLength: 120,
    },
    { label: 'E-Mail', value: worker.email ?? '', editable: 'email' },
    {
      label: 'Microsoft-E-Mail',
      value: worker.microsoftEmail ?? '',
    },
    {
      label: 'Geburtsdatum',
      value: dateValue(worker.birthday),
      editable: 'birthday',
      inputType: 'date',
    },
    {
      label: 'Straße und Hausnummer',
      value: worker.street ?? '',
      editable: 'street',
      maxLength: 255,
    },
    {
      label: 'Postleitzahl',
      value: worker.postalCode ?? '',
      editable: 'postalCode',
      maxLength: 24,
    },
    {
      label: 'Ort',
      value: worker.city ?? '',
      editable: 'city',
      maxLength: 120,
    },
    {
      label: 'Bundesland',
      value: worker.state ?? '',
      editable: 'state',
      maxLength: 120,
    },
    {
      label: 'Land (Ländercode)',
      value: worker.country ?? '',
      editable: 'country',
      maxLength: 3,
    },
    {
      label: 'Hosengröße',
      value: workwearSize(worker, 'Hose'),
      editable: 'workwearSize',
      itemName: 'Hose',
      maxLength: 32,
    },
    {
      label: 'T-Shirt-Größe',
      value: workwearSize(worker, 'T-Shirt'),
      editable: 'workwearSize',
      itemName: 'T-Shirt',
      maxLength: 32,
    },
    {
      label: 'Eintrittsdatum',
      value: dateValue(worker.entryDate),
      editable: 'entryDate',
      inputType: 'date',
    },
  ];

  if (showsCompanyAnniversary(worker)) {
    items.push({
      label: 'Firmenjubiläum',
      value: formatCompanyAnniversary(nextCompanyAnniversary(worker.entryDate)),
    });
  }

  items.push(
    {
      label: 'Position',
      value: worker.position ?? '',
      editable: 'position',
      maxLength: 160,
    },
    {
      label: 'Austrittsdatum',
      value: dateValue(worker.exitDate),
      editable: 'exitDate',
      inputType: 'date',
    },
    {
      label: 'Phase',
      value: engagement ? engagement.type : '—',
      editable: engagement ? 'phase' : undefined,
      engagementId: engagement?.id,
    },
    { label: 'Aufgaben', value: String(taskCount) }
  );

  return items;
}
