import { formatDate } from '../utils/dateCalculation';
import type { WorkerDetailResponse } from '../types/index.types';

export type WorkerEngagementInfoItem = {
  label: string;
  value: string;
};

const PHASE_LABELS: Record<string, string> = {
  onboarding: 'Onboarding',
  offboarding: 'Offboarding',
  transfer: 'Transfer',
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

  return [
    { label: 'Vorname', value: displayText(worker.firstName) },
    { label: 'Nachname', value: displayText(worker.lastName) },
    { label: 'E-Mail', value: displayText(worker.email) },
    { label: 'Arbeits-E-Mail', value: displayText(worker.workEmail) },
    { label: 'Geburtsdatum', value: displayDate(worker.birthday) },
    { label: 'Adresse', value: formatAddress(worker) },
    { label: 'Hosengröße', value: workwearSize(worker, 'Hose') },
    { label: 'T-Shirt-Größe', value: workwearSize(worker, 'T-Shirt') },
    { label: 'Eintrittsdatum', value: displayDate(worker.entryDate) },
    { label: 'Position', value: displayText(worker.position) },
    { label: 'Austrittsdatum', value: displayDate(worker.exitDate) },
    {
      label: 'Phase',
      value: engagement
        ? (PHASE_LABELS[engagement.type] ?? engagement.type)
        : '—',
    },
    { label: 'Aufgaben', value: String(taskCount) },
  ];
}
