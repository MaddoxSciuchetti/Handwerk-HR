import type { HistoryData } from '../types/index.types';
import type { TaskStatus } from './selectOptionTernary';

export type IssueAuditRow = {
  id: string;
  action: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
  actorUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
};

function actionToStatus(action: string): TaskStatus {
  return action === 'issue.created' ? 'offen' : 'in_bearbeitung';
}

function formatEdit(entry: IssueAuditRow): string | null {
  if (entry.action === 'issue.created') {
    const nv = entry.newValue as { title?: string } | null;
    return nv?.title ? `Issue erstellt: ${nv.title}` : 'Issue erstellt';
  }
  if (entry.action === 'issue.updated') {
    const nv = entry.newValue as Record<string, unknown> | null;
    if (!nv || !Object.keys(nv).length) return 'Aktualisiert';
    const parts: string[] = [];
    if ('statusId' in nv) parts.push('Status');
    if ('description' in nv) parts.push('Beschreibung');
    if ('title' in nv) parts.push('Titel');
    if ('assigneeUserId' in nv) parts.push('Verantwortlich');
    if ('priority' in nv) parts.push('Priorität');
    return parts.length ? `Geändert: ${parts.join(', ')}` : 'Aktualisiert';
  }
  return entry.action;
}

export function mapIssueAuditRowsToHistory(rows: IssueAuditRow[]): HistoryData[] {
  return rows.map((entry) => ({
    id: entry.id,
    timestamp: new Date(entry.createdAt),
    status: actionToStatus(entry.action),
    edit: formatEdit(entry),
    form_input_id: 0,
    changed_by: entry.actorUser.id,
    auth_user: {
      id: entry.actorUser.id,
      email: entry.actorUser.email,
      verified: true,
      cloud_url: entry.actorUser.avatarUrl ?? '',
    },
  }));
}
