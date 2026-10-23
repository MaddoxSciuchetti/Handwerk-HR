import { engagementsAwaitingTemplate } from '@/features/worker-task-management/pendingTemplate';
import { describe, expect, it } from 'vitest';

const signed = {
  workerEngagementId: 'engagement-1',
  title: 'Arbeitsvertrag unterschrieben',
  status: 'done',
  kind: 'standard',
  templateItemId: null,
  workerEngagement: {
    workerId: 'worker-1',
    worker: { firstName: 'Ada', lastName: 'Lovelace' },
  },
};

describe('engagementsAwaitingTemplate', () => {
  it('asks for a template after the signed-contract task is completed', () => {
    expect(engagementsAwaitingTemplate([signed])).toEqual([
      {
        workerId: 'worker-1',
        engagementId: 'engagement-1',
        label: 'Ada Lovelace',
      },
    ]);
  });

  it('stays hidden while the signed-contract task is still open', () => {
    expect(
      engagementsAwaitingTemplate([{ ...signed, status: 'in_progress' }])
    ).toEqual([]);
  });

  it('stays hidden after printing until the signed-contract task is completed', () => {
    expect(
      engagementsAwaitingTemplate([
        { ...signed, title: 'Arbeitsvertrag drucken', kind: 'contract_send' },
        { ...signed, status: 'open' },
      ])
    ).toEqual([]);
  });

  it('stays hidden once a template already filled the tasks', () => {
    expect(
      engagementsAwaitingTemplate([
        signed,
        { ...signed, title: 'Willkommensmail', templateItemId: 'item-1' },
      ])
    ).toEqual([]);
  });
});
