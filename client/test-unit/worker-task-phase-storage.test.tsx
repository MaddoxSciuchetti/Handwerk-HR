import {
  readTaskPhase,
  taskPhaseStorageKey,
  writeTaskPhase,
} from '@/features/worker-task-management/taskPhaseStorage';
import { beforeEach, expect, it } from 'vitest';

beforeEach(() => {
  localStorage.clear();
});

it('builds a scoped storage key and round-trips valid phases', () => {
  const key = taskPhaseStorageKey('org-a', 'user-a', 'worker-1');
  expect(key).toBe('worker-task-phase:v1:org-a:user-a:worker-1');

  writeTaskPhase(key, 'offboarding');
  expect(readTaskPhase(key)).toBe('offboarding');

  writeTaskPhase(key, 'onboarding');
  expect(readTaskPhase(key)).toBe('onboarding');
});

it('keeps users and workers isolated and ignores invalid values', () => {
  const userA = taskPhaseStorageKey('org-a', 'user-a', 'worker-1');
  const userB = taskPhaseStorageKey('org-a', 'user-b', 'worker-1');
  const otherWorker = taskPhaseStorageKey('org-a', 'user-a', 'worker-2');

  writeTaskPhase(userA, 'offboarding');
  writeTaskPhase(userB, 'onboarding');

  expect(readTaskPhase(userA)).toBe('offboarding');
  expect(readTaskPhase(userB)).toBe('onboarding');
  expect(readTaskPhase(otherWorker)).toBeNull();

  localStorage.setItem(userA!, 'team');
  expect(readTaskPhase(userA)).toBeNull();
  expect(taskPhaseStorageKey('org-a', undefined, 'worker-1')).toBeNull();
});
