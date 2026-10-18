import { engagementsAwaitingTemplate } from '@/features/worker-task-management/pendingTemplate';
import { describe, expect, it } from 'vitest';

const printed = {
  workerEngagementId: 'engagement-1',
  title: 'Arbeitsvertrag drucken',
  status: 'done',
  kind: 'contract_send',
  templateItemId: null,
  workerEngagement: {
    workerId: 'worker-1',
    worker: { firstName: 'Ada', lastName: 'Lovelace' },
  },
};

describe('engagementsAwaitingTemplate', () => {
  it('asks for a template after the contract was printed on the fast track', () => {
    expect(engagementsAwaitingTemplate([printed])).toEqual([
      {
        workerId: 'worker-1',
        engagementId: 'engagement-1',
        label: 'Ada Lovelace',
      },
    ]);
  });

  it('stays hidden while the print task is still open', () => {
    expect(
      engagementsAwaitingTemplate([{ ...printed, status: 'in_progress' }])
    ).toEqual([]);
  });

  it('stays hidden once a template already filled the tasks', () => {
    expect(
      engagementsAwaitingTemplate([
        printed,
        { ...printed, title: 'Willkommensmail', templateItemId: 'item-1' },
      ])
    ).toEqual([]);
  });
});
