import { useQuery } from '@tanstack/react-query';
import { workerQueries } from '../query-options/queries/worker.queries';
import { mapIssueAuditRowsToHistory } from '../utils/mapIssueAuditToHistory';

export function isV2IssueId(id: string | number): boolean {
  return typeof id === 'string' && id.includes('-');
}

type UseTaskHistoryOptions = {
  /** Hide the automatic `issue.created` row (template bulk-create noise). */
  omitCreationAudit?: boolean;
};

export function useTaskHistory(
  workerId: string,
  issueId: string | number,
  options?: UseTaskHistoryOptions
) {
  const v2 = isV2IssueId(issueId);

  const legacy = useQuery({
    ...workerQueries.getHistory(
      typeof issueId === 'number' ? issueId : Number(issueId)
    ),
    enabled:
      !v2 &&
      typeof issueId === 'number' &&
      issueId > 0,
  });

  const audit = useQuery({
    ...workerQueries.issueAuditLogs(workerId, String(issueId)),
    enabled: v2 && !!workerId,
  });

  if (v2) {
    let rows = audit.data ?? [];
    if (options?.omitCreationAudit) {
      rows = rows.filter((r) => r.action !== 'issue.created');
    }
    return {
      historyData: mapIssueAuditRowsToHistory(rows),
      isLoading: audit.isPending,
    };
  }

  return {
    historyData: legacy.data,
    isLoading: legacy.isPending,
  };
}
