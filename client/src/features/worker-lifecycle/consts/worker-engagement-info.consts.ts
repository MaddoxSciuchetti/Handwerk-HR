import { formatDate } from '../utils/dateCalculation';
import {
  formatCompanyAnniversary,
  nextCompanyAnniversary,
} from '../utils/companyAnniversary';
import { showsCompanyAnniversary } from '../utils/teamMembers';
import type { WorkerDetailResponse } from '../types/index.types';

export type WorkerEngagementInfoItem = {
  label: string;
  value: string;
  editable?: 'email';
};

const PHASE_LABELS: Record<string, string> = {
  onboarding: 'Onboarding',
  offboarding: 'Offboarding',
  transfer: 'Team',
};

function displayText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

function displayDate(value: string | null) {
  if (!value) return '—';
  return formatDate(value);
}

function workwearSize(
  worker: WorkerDetailResponse['data'],
  itemName: string
) {
  return displayText(
    worker.workwear?.find((item) => item.itemName === itemName)?.size
  );
}

function formatAddress(worker: WorkerDetailResponse['data']) {
  const cityLine = [worker.postalCode, worker.city].filter(Boolean).join(' ');
  const parts = [worker.street, cityLine, worker.state, worker.country].filter(
    Boolean
  );
  return parts.length ? parts.join(', ') : '—';
}

export function workerEngagementInfoItems(
  worker: WorkerDetailResponse['data']
): WorkerEngagementInfoItem[] {
  const engagement = worker.engagements[0];
  const taskCount = worker.engagements.reduce(
    (count, item) => count + (item.issues?.length ?? 0),
    0
  );

  const items: WorkerEngagementInfoItem[] = [
    { label: 'Vorname', value: displayText(worker.firstName) },
    { label: 'Nachname', value: displayText(worker.lastName) },
    { label: 'E-Mail', value: worker.email ?? '', editable: 'email' },
    { label: 'Arbeits-E-Mail', value: displayText(worker.workEmail) },
    { label: 'Microsoft-E-Mail', value: displayText(worker.microsoftEmail) },
    { label: 'Geburtsdatum', value: displayDate(worker.birthday) },
    { label: 'Adresse', value: formatAddress(worker) },
    { label: 'Hosengröße', value: workwearSize(worker, 'Hose') },
    { label: 'T-Shirt-Größe', value: workwearSize(worker, 'T-Shirt') },
    { label: 'Eintrittsdatum', value: displayDate(worker.entryDate) },
  ];

  if (showsCompanyAnniversary(worker)) {
    items.push({
      label: 'Firmenjubiläum',
      value: formatCompanyAnniversary(nextCompanyAnniversary(worker.entryDate)),
    });
  }

  items.push(
    { label: 'Position', value: displayText(worker.position) },
    { label: 'Austrittsdatum', value: displayDate(worker.exitDate) },
    {
      label: 'Phase',
      value: engagement
        ? (PHASE_LABELS[engagement.type] ?? engagement.type)
        : '—',
    },
    { label: 'Aufgaben', value: String(taskCount) },
  );

  return items;
}
