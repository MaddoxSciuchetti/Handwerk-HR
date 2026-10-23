export type TemplateApplyTarget = {
  workerId: string;
  engagementId: string;
  label: string;
};

type PendingIssue = {
  workerEngagementId: string | null;
  title: string;
  status: string;
  kind: string;
  templateItemId: string | null;
  workerEngagement?: {
    templateApplication?: { id: string; completedAt: string | null } | null;
    workerId: string;
    worker?: { firstName: string; lastName: string } | null;
  } | null;
};

function isSignedContract(issue: PendingIssue) {
  return (
    issue.status === 'done' &&
    issue.kind === 'standard' &&
    issue.title.trim().toLocaleLowerCase('de-DE') ===
      'arbeitsvertrag unterschrieben'
  );
}

function workerLabel(issue: PendingIssue, fallbackLabel: string) {
  const worker = issue.workerEngagement?.worker;
  const name = `${worker?.firstName ?? ''} ${worker?.lastName ?? ''}`.trim();
  return name || fallbackLabel;
}

export function engagementsAwaitingTemplate(
  issues: PendingIssue[],
  fallback?: { workerId: string; label: string }
): TemplateApplyTarget[] {
  const byEngagement = new Map<string, PendingIssue[]>();
  for (const issue of issues) {
    if (!issue.workerEngagementId) continue;
    const group = byEngagement.get(issue.workerEngagementId) ?? [];
    group.push(issue);
    byEngagement.set(issue.workerEngagementId, group);
  }

  const targets: TemplateApplyTarget[] = [];
  for (const [engagementId, group] of byEngagement) {
    if (!group.some(isSignedContract)) continue;
    if (group.some((issue) => issue.templateItemId || issue.workerEngagement?.templateApplication)) continue;
    const sample = group.find((issue) => issue.workerEngagement?.workerId);
    const workerId = sample?.workerEngagement?.workerId ?? fallback?.workerId;
    if (!workerId) continue;
    targets.push({
      workerId,
      engagementId,
      label: workerLabel(sample ?? group[0], fallback?.label ?? 'Mitarbeiter'),
    });
  }
  return targets;
}
