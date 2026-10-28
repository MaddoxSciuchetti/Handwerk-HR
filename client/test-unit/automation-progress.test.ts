import { expect, it } from 'vitest';
import {
  isAutomationTaskVisible,
  mergeAutomationProgress,
  mergeAutomationReveal,
} from '@/features/worker-task-management/utils/automationProgress';
import type { TemplateApplicationResult } from '@/features/worker-task-management/api/templateApplication.api';
const run: TemplateApplicationResult = {
  count: 3,
  issueIds: ['a', 'b', 'manual'],
  outcomes: [],
  running: true,
};
it('counts each finished task once across receipt and task status updates', () => {
  const previous = mergeAutomationProgress(null, {
    ...run,
    outcomes: [{ issueId: 'a', status: 'completed' }],
  });
  const next = mergeAutomationProgress(previous, {
    ...run,
    outcomes: [{ issueId: 'a', status: 'completed' }],
    tasks: [
      {
        id: 'a',
        title: 'A',
        sequence: 'crewmeister_create_account',
        status: 'done',
      },
      {
        id: 'b',
        title: 'B',
        sequence: 'microsoft_send_email',
        status: 'error',
      },
      { id: 'manual', title: 'Manual', sequence: null, status: 'done' },
    ],
  });
  expect(next.finishedIds).toEqual(['a', 'b']);
});
it('keeps finished tasks when an older receipt or stale task statuses arrive', () => {
  const previous = { finishedIds: ['a', 'b'] };
  expect(
    mergeAutomationProgress(previous, {
      ...run,
      outcomes: [{ issueId: 'a', status: 'pending' }],
      tasks: [
        {
          id: 'b',
          title: 'B',
          sequence: 'microsoft_send_email',
          status: 'in_progress',
        },
      ],
    }).finishedIds
  ).toEqual(['a', 'b']);
  expect(previous.finishedIds).toEqual(['a', 'b']);
});
it('starts a new run at zero and does not count pending automations', () => {
  expect(
    mergeAutomationProgress(null, {
      ...run,
      outcomes: [{ issueId: 'a', status: 'pending' }],
    }).finishedIds
  ).toEqual([]);
});

it('tracks active tasks through stale snapshots and completion', () => {
  const started = mergeAutomationProgress(null, {
    ...run,
    tasks: [{ id: 'a', title: 'A', sequence: 'microsoft_send_email', status: 'in_progress' }],
  });
  expect(started.startedIds).toEqual(['a']);
  expect(started.finishedIds).toEqual([]);
  const stale = mergeAutomationProgress(started, { ...run, tasks: [] });
  expect(stale.startedIds).toEqual(['a']);
  const finished = mergeAutomationProgress(stale, {
    ...run, outcomes: [{ issueId: 'a', status: 'completed' }],
  });
  expect(finished.startedIds).toEqual(['a']);
  expect(finished.finishedIds).toEqual(['a']);
});

it('reveals automation tasks only as progress starts them and keeps manual tasks visible', () => {
  const baseline = { baselineIds: ['existing'], visibleIds: [] };
  expect(isAutomationTaskVisible('existing', baseline)).toBe(true);
  expect(isAutomationTaskVisible('a', baseline)).toBe(false);
  const started = mergeAutomationReveal(
    baseline,
    {
      ...run,
      tasks: [
        {
          id: 'a',
          title: 'A',
          sequence: 'microsoft_send_email',
          status: 'in_progress',
        },
        { id: 'manual', title: 'Manual', sequence: null, status: 'open' },
      ],
    },
    { finishedIds: [], startedIds: ['a'] }
  );
  expect(started.baselineIds).toEqual(['existing']);
  expect(started.visibleIds).toEqual(['a', 'manual']);
  expect(isAutomationTaskVisible('a', started)).toBe(true);
  expect(isAutomationTaskVisible('b', started)).toBe(false);
  expect(isAutomationTaskVisible('manual', started)).toBe(true);
  expect(isAutomationTaskVisible('missing', null)).toBe(true);
});
