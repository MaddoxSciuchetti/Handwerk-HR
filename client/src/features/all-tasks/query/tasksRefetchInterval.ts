/** Poll mentions/tasks only while the tab is visible; 15s keeps near-realtime without 5s hammering. */
export const TASKS_REFETCH_INTERVAL_MS = 15_000;

export function tasksRefetchInterval(): number | false {
  if (typeof document === 'undefined') return TASKS_REFETCH_INTERVAL_MS;
  return document.visibilityState === 'visible'
    ? TASKS_REFETCH_INTERVAL_MS
    : false;
}
