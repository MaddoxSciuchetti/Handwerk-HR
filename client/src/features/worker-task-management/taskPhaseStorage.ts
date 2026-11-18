import type { LifecycleType } from './types/index.types';

const PHASES = new Set<LifecycleType>(['onboarding', 'offboarding']);

export function taskPhaseStorageKey(
  organizationId: string | undefined,
  userId: string | undefined,
  workerId: string
) {
  if (!userId) return null;
  return `worker-task-phase:v1:${organizationId ?? ''}:${userId}:${workerId}`;
}

export function readTaskPhase(key: string | null): LifecycleType | null {
  if (!key) return null;
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return null;
    if (!PHASES.has(saved as LifecycleType)) return null;
    return saved as LifecycleType;
  } catch {
    return null;
  }
}

export function writeTaskPhase(key: string | null, phase: LifecycleType) {
  if (!key || !PHASES.has(phase)) return;
  try {
    localStorage.setItem(key, phase);
  } catch {
    // Phase tabs stay usable when the browser blocks persistent storage.
  }
}
