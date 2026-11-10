import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  TASKS_REFETCH_INTERVAL_MS,
  tasksRefetchInterval,
} from '@/features/all-tasks/query/tasksRefetchInterval';

describe('tasksRefetchInterval', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('polls every 15s while the document is visible', () => {
    vi.stubGlobal('document', { visibilityState: 'visible' });
    expect(tasksRefetchInterval()).toBe(TASKS_REFETCH_INTERVAL_MS);
  });

  it('stops polling while the document is hidden', () => {
    vi.stubGlobal('document', { visibilityState: 'hidden' });
    expect(tasksRefetchInterval()).toBe(false);
  });
});
