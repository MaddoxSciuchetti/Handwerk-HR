import type { WorkerEngagement } from '../types/index.types';

export function workerRefreshInterval(
  engagements: Pick<
    WorkerEngagement,
    'templateApplication' | 'questionnaireSubmission'
  >[] = []
) {
  if (
    engagements.some(
      (engagement) =>
        engagement.templateApplication &&
        !engagement.templateApplication.completedAt
    )
  )
    return 2000;
  return engagements.some(
    (engagement) => engagement.questionnaireSubmission?.status === 'sent'
  )
    ? 5000
    : false;
}
