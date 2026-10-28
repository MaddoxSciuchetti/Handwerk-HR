import useFilteredData from '@/features/worker-task-management/hooks/useFilteredData';
import type { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';
import { renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';

it('preserves worker task positions when tasks are edited or completed', () => {
  const data = {
    data: {
      id: 'worker-1',
      firstName: 'Alex',
      lastName: 'Test',
      engagements: [
        {
          id: 'engagement-1',
          issues: [
            {
              id: 'standard',
              title: 'Questionnaire',
              kind: 'standard',
              status: 'open',
            },
            {
              id: 'confirmation',
              title: 'Contract signed',
              kind: 'contract_confirm',
              status: 'open',
            },
            {
              id: 'print',
              title: 'Print contract',
              kind: 'standard',
              status: 'done',
            },
          ],
        },
      ],
    },
  } as WorkerDetailResponse;
  const { result, rerender } = renderHook(
    ({ worker }) => useFilteredData(worker),
    {
      initialProps: { worker: data },
    }
  );
  expect(result.current.displayData.map((task) => task.id)).toEqual([
    'standard',
    'confirmation',
    'print',
  ]);
  const updated = structuredClone(data);
  Object.assign(updated.data.engagements[0].issues![0], {
    title: 'Edited questionnaire',
    status: 'done',
    updatedAt: '2026-10-27T12:00:00.000Z',
  });
  rerender({ worker: updated });
  expect(result.current.displayData.map((task) => task.id)).toEqual([
    'standard',
    'confirmation',
    'print',
  ]);
  expect(result.current.displayData[0]).toMatchObject({
    title: 'Edited questionnaire',
    status: 'done',
  });
});
