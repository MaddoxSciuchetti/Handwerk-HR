import type { TemplateApplicationResult } from '../api/templateApplication.api';

export type AutomationProgress = {
  finishedIds: string[];
  startedIds?: string[];
};

// While automation runs, newly created tasks stay hidden until progress has
// started them so the list advances with the progress bar instead of dumping
// every template task on the first refresh.
export type AutomationReveal = {
  baselineIds: string[];
  visibleIds: string[];
};

export function automationRevealQueryKey(engagementId: string) {
  return ['template-automation-reveal', engagementId] as const;
}

export function isAutomationTaskVisible(
  taskId: string,
  reveal: AutomationReveal | null | undefined
) {
  if (!reveal) return true;
  return (
    reveal.baselineIds.includes(taskId) || reveal.visibleIds.includes(taskId)
  );
}

export function mergeAutomationReveal(
  previous: AutomationReveal | null | undefined,
  result: TemplateApplicationResult,
  progress: AutomationProgress
): AutomationReveal {
  const baselineIds = previous?.baselineIds ?? [];
  const visible = new Set(previous?.visibleIds ?? []);
  for (const id of progress.startedIds ?? []) visible.add(id);
  for (const id of progress.finishedIds) visible.add(id);
  for (const task of result.tasks ?? []) {
    if (!task.sequence) visible.add(task.id);
  }
  return { baselineIds, visibleIds: [...visible] };
}

// Receipts and task refreshes can arrive at different times. A finished task
// stays counted for the lifetime of this run, and each task contributes once.
export function mergeAutomationProgress(
  previous: AutomationProgress | null | undefined,
  result: TemplateApplicationResult
): AutomationProgress {
  const finished = new Set(previous?.finishedIds ?? []);
  const started = new Set(previous?.startedIds ?? []);
  for (const outcome of result.outcomes) {
    if (outcome.status !== 'pending') finished.add(outcome.issueId);
  }
  for (const task of result.tasks ?? []) {
    if (task.sequence && task.status === 'in_progress') started.add(task.id);
    if (
      task.sequence &&
      ['done', 'error', 'cancelled', 'not_applicable'].includes(task.status)
    )
      finished.add(task.id);
  }
  for (const id of finished) started.add(id);
  return { finishedIds: [...finished], startedIds: [...started] };
}
