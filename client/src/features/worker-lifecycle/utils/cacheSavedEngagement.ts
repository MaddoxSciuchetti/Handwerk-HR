import type { EngagementUpdateResponse } from '../api';
import type { WorkerEngagement } from '../types/index.types';

type CachedEngagement = WorkerEngagement & {
  employmentContract?: unknown;
  arbeitszeugnis?: unknown;
};

export function cacheSavedEngagement<T extends CachedEngagement>(
  engagements: T[],
  saved: EngagementUpdateResponse['data']
): T[] {
  const existing = engagements.find((engagement) => engagement.id === saved.id);
  // New phases must not inherit tasks, contracts, or template receipts.
  const phase = {
    startedAt: '',
    completedAt: null,
    startDate: null,
    endDate: null,
    responsibleUser: engagements[0]?.responsibleUser,
    issues: [],
    issueCounts: [],
    templateApplication: null,
    questionnaireSubmission: null,
    employmentContract: null,
    arbeitszeugnis: null,
    ...existing,
    ...saved,
  } as T;
  const history = engagements.filter(
    (engagement) =>
      engagement.id !== saved.id && !engagement.id.startsWith('pending:')
  );
  return [phase, ...history];
}
