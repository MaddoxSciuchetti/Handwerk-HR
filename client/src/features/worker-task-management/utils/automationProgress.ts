import type { TemplateApplicationResult } from '../api/templateApplication.api';

export type AutomationProgress = {
  finishedIds: string[];
};

// Receipts and task refreshes can arrive at different times. A finished task
// stays counted for the lifetime of this run, and each task contributes once.
export function mergeAutomationProgress(
  previous: AutomationProgress | null | undefined,
  result: TemplateApplicationResult
): AutomationProgress {
  const finished = new Set(previous?.finishedIds ?? []);
  for (const outcome of result.outcomes) {
    if (outcome.status !== 'pending') finished.add(outcome.issueId);
  }
  for (const task of result.tasks ?? []) {
    if (
      task.sequence &&
      ['done', 'error', 'cancelled', 'not_applicable'].includes(task.status)
    )
      finished.add(task.id);
  }
  return { finishedIds: [...finished] };
}
