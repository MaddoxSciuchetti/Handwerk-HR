import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TaskStatusIcon } from '@/features/all-tasks/components/ui/TaskStatusIcons';
import {
  ISSUE_STATUSES,
  issueStatusLabel,
  type IssueStatusValue,
} from '@/features/all-tasks/consts/issue-status.consts';
import { type ReactNode } from 'react';
import { useGetTaskHistory } from '../../../../hooks/useGetTaskHistory';
import {
  TaskHistoryAuditEntry,
  TaskHistoryChange,
  TaskHistoryCommentEntry,
  TaskHistoryItem,
} from '../../../../types/index.types';

type HistoryContentProps = {
  taskId: string;
  currentUserId?: string;
  onEditComment?: (commentId: string, body: string) => void;
  hideComments?: boolean;
};

const FIELD_LABELS: Record<string, string> = {
  workerEngagementId: 'Handwerker',
  title: 'Titel',
  description: 'Beschreibung',
  status: 'Status',
  statusId: 'Status',
  assigneeUserId: 'Zuständig',
  priority: 'Priorität',
  dueDate: 'Fälligkeit',
  automation: 'Automation',
  automationError: 'Fehler',
  integrationProvider: 'Integration',
  sequence: 'Aktion',
  mailTemplateId: 'Vorlage',
  mailSenderAddress: 'Absender',
  microsoftAccountId: 'Microsoft-Konto',
};

function getActorLabel(actor: {
  firstName: string;
  lastName: string;
  email: string;
}): string {
  const fullName = `${actor.firstName} ${actor.lastName}`.trim();
  return fullName || actor.email;
}

function getActionLabel(entry: TaskHistoryAuditEntry): string {
  if (entry.action === 'issue.created') return 'Aufgabe erstellt';
  if (entry.action === 'issue.updated' && entry.changes.length === 1) {
    return `${FIELD_LABELS[entry.changes[0].field] ?? entry.changes[0].field} geändert`;
  }
  if (entry.action === 'issue.updated') return 'Aufgabe aktualisiert';
  return entry.action;
}

function isIssueStatusValue(value: string): value is IssueStatusValue {
  return (ISSUE_STATUSES as readonly string[]).includes(value);
}

function TaskHistoryStatusBadge({
  statusId,
  name,
}: {
  statusId: string;
  name: string;
}) {
  const label = name || issueStatusLabel(statusId);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
      {isIssueStatusValue(statusId) ? (
        <TaskStatusIcon status={statusId} className="size-3.5" />
      ) : null}
      {label}
    </span>
  );
}

function HistoryAvatar({
  actor,
}: {
  actor: TaskHistoryCommentEntry['user'] | null;
}) {
  const initials = actor
    ? `${actor.firstName.trim().charAt(0)}${actor.lastName.trim().charAt(0)}`.toUpperCase() ||
      actor.email.charAt(0).toUpperCase()
    : '?';
  return (
    <Avatar size="sm" aria-hidden>
      <AvatarImage src={actor?.avatarUrl ?? undefined} alt="" />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

function actualChanges(entry: TaskHistoryAuditEntry) {
  return entry.changes.filter(
    (change) => (change.from ?? '') !== (change.to ?? '')
  );
}

function renderChange(change: TaskHistoryChange) {
  return (
    <div key={change.field} className="py-3 first:pt-0 last:pb-0">
      <dt className="mb-2 text-xs font-medium text-foreground">
        {FIELD_LABELS[change.field] ?? change.field}
      </dt>
      <dd className="grid grid-cols-2 gap-4 text-sm">
        <div className="min-w-0">
          <span className="mb-1 block text-xs text-muted-foreground">
            Vorher
          </span>
          <span className="block whitespace-pre-wrap break-words text-muted-foreground">
            {change.from || '–'}
          </span>
        </div>
        <div className="min-w-0">
          <span className="mb-1 block text-xs text-muted-foreground">
            Nachher
          </span>
          <span className="block whitespace-pre-wrap break-words text-foreground">
            {change.to || '–'}
          </span>
        </div>
      </dd>
    </div>
  );
}

function renderAuditEntry(entry: TaskHistoryAuditEntry): ReactNode {
  const actor = entry.actorUser;
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <HistoryAvatar actor={actor} />
        <span className="text-sm text-foreground">
          {actor ? getActorLabel(actor) : 'Unbekannt'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {new Date(entry.createdAt).toLocaleString('de-DE', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </span>
        {entry.status &&
        (entry.action !== 'issue.updated' ||
          entry.changes.some((change) => change.field === 'status')) ? (
          <TaskHistoryStatusBadge
            statusId={entry.status.id}
            name={entry.status.name}
          />
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {getActionLabel(entry)}
      </p>
      {actualChanges(entry).length > 0 ? (
        <dl className="mt-3 divide-y divide-border border-t border-border pt-3">
          {actualChanges(entry).map(renderChange)}
        </dl>
      ) : null}
    </>
  );
}

function renderCommentEntry(
  entry: TaskHistoryCommentEntry,
  currentUserId: string | undefined,
  onEditComment: HistoryContentProps['onEditComment']
): ReactNode {
  const canEdit = Boolean(
    currentUserId && entry.user.id === currentUserId && onEditComment
  );
  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HistoryAvatar actor={entry.user} />
          <span className="text-sm text-foreground">
            {getActorLabel(entry.user)}
          </span>
        </div>
        {canEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onEditComment!(entry.id, entry.body)}
          >
            Bearbeiten
          </Button>
        ) : null}
      </div>
      <div className="text-xs font-medium text-muted-foreground">
        {new Date(entry.createdAt).toLocaleString('de-DE', {
          dateStyle: 'short',
          timeStyle: 'short',
        })}
        {new Date(entry.updatedAt).getTime() !==
        new Date(entry.createdAt).getTime()
          ? ' · bearbeitet'
          : null}
      </div>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Kommentar
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
        {entry.body}
      </p>
    </>
  );
}

const HistoryContent = ({
  taskId,
  currentUserId,
  onEditComment,
  hideComments = false,
}: HistoryContentProps) => {
  const { historyData, isLoading, error, refetchHistory } =
    useGetTaskHistory(taskId);
  const entries: TaskHistoryItem[] = (historyData ?? []).flatMap(
    (entry): TaskHistoryItem[] => {
      if (entry.kind === 'comment') return hideComments ? [] : [entry];
      if (entry.action !== 'issue.updated') return [entry];
      return actualChanges(entry).map((change) => ({
        ...entry,
        id: `${entry.id}:${change.field}`,
        changes: [change],
      }));
    }
  );

  if (isLoading) {
    return <p className="mt-5 text-muted-foreground">Verlauf wird geladen…</p>;
  }

  if (error) {
    return (
      <div role="alert" className="mt-5 space-y-2">
        <p className="text-sm text-destructive">
          Der Bearbeitungsverlauf konnte nicht geladen werden.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetchHistory()}
        >
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (!entries.length) {
    return (
      <p className="mt-5 text-muted-foreground">
        Es wurden noch keine Änderungen oder Kommentare erfasst
      </p>
    );
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute top-6 bottom-6 left-3 w-px -translate-x-1/2 bg-(--border)"
      />
      <div className="space-y-4">
        {entries.map((entry: TaskHistoryItem) => (
          <div key={`${entry.kind}-${entry.id}`} className="flex gap-3">
            <div className="flex w-6 shrink-0 justify-center">
              <div
                aria-hidden
                className="relative z-10 mt-6 size-3 shrink-0 rounded-full bg-(--chart-2) shadow-sm"
              />
            </div>
            <div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-4">
              {entry.kind === 'audit'
                ? renderAuditEntry(entry)
                : renderCommentEntry(entry, currentUserId, onEditComment)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryContent;
