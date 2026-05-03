import { type ReactNode } from 'react';
import { Button } from '@/components/ui/selfmade/button';
import { cn } from '@/lib/trycatch';
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
};

const FIELD_LABELS: Record<string, string> = {
  title: 'Titel',
  description: 'Beschreibung',
  statusId: 'Status',
  assigneeUserId: 'Zuständig',
  priority: 'Priorität',
  dueDate: 'Fälligkeit',
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
  if (entry.action === 'issue.updated') return 'Aufgabe aktualisiert';
  return entry.action;
}

function renderChange(change: TaskHistoryChange) {
  const label = FIELD_LABELS[change.field] ?? change.field;
  const from = change.from ?? '–';
  const to = change.to ?? '–';
  return `${label}: ${from} → ${to}`;
}

function renderAuditEntry(
  entry: TaskHistoryAuditEntry,
): ReactNode {
  const actor = entry.actorUser;
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        {actor?.avatarUrl ? (
          <img
            src={actor.avatarUrl}
            alt={actor.email}
            className="h-8 w-8 rounded-xl object-cover"
          />
        ) : null}
        <span className="text-sm text-foreground">
          {actor ? getActorLabel(actor) : 'Unbekannt'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {new Date(entry.createdAt).toLocaleString()}
        </span>
        {entry.status ? (
          <span
            className={cn(
              'rounded px-2 py-0.5 text-xs font-medium',
              'bg-(--status-success-bg) text-(--status-success-foreground)'
            )}
            style={
              entry.status.color
                ? { backgroundColor: entry.status.color }
                : undefined
            }
          >
            {entry.status.name}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {getActionLabel(entry)}
      </p>
      {entry.changes.length > 0 ? (
        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {entry.changes.map((change) => (
            <li key={`${entry.id}-${change.field}`}>
              {renderChange(change)}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function renderCommentEntry(
  entry: TaskHistoryCommentEntry,
  currentUserId: string | undefined,
  onEditComment: HistoryContentProps['onEditComment'],
): ReactNode {
  const canEdit = Boolean(
    currentUserId && entry.user.id === currentUserId && onEditComment
  );
  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {entry.user.avatarUrl ? (
            <img
              src={entry.user.avatarUrl}
              alt={entry.user.email}
              className="h-8 w-8 rounded-xl object-cover"
            />
          ) : null}
          <span className="text-sm text-foreground">
            {getActorLabel(entry.user)}
          </span>
        </div>
        {canEdit ? (
          <Button
            type="button"
            size="small"
            className="h-8 bg-transparent text-xs hover:bg-muted"
            onClick={() => onEditComment!(entry.id, entry.body)}
          >
            Bearbeiten
          </Button>
        ) : null}
      </div>
      <div className="text-xs font-medium text-muted-foreground">
        {new Date(entry.createdAt).toLocaleString()}
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
}: HistoryContentProps) => {
  const { historyData, isLoading } = useGetTaskHistory(taskId);

  if (isLoading) {
    return <p className="mt-5 text-muted-foreground">Verlauf wird geladen…</p>;
  }

  if (!historyData || historyData.length === 0) {
    return (
      <p className="mt-5 text-muted-foreground">
        Es wurden noch keine Änderungen oder Kommentare erfasst
      </p>
    );
  }

  return (
    <div className="pb-4">
      <div className="relative pl-6">
        <div className="absolute top-2 bottom-2 left-[7px] w-px bg-(--border)" />
        <div className="space-y-4">
          {historyData.map((entry: TaskHistoryItem) => (
            <div key={`${entry.kind}-${entry.id}`} className="relative">
              <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-(--chart-2) shadow-sm" />
              <div className="bg-(--dropdown-surface) rounded-lg p-3">
                {entry.kind === 'audit'
                  ? renderAuditEntry(entry)
                  : renderCommentEntry(entry, currentUserId, onEditComment)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryContent;
