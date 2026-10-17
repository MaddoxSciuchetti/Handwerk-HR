import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGetTaskHistory } from '@/features/worker-task-management/hooks/useGetTaskHistory';
import type { TaskHistoryCommentEntry } from '@/features/worker-task-management/types/index.types';
import { cn } from '@/lib/utils';
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useSaveTaskComment } from '../hooks/useSaveTaskComment';
import { MentionMenu } from './MentionMenu';

export type TaskChatCoworker = {
  id: string;
  firstName: string;
  lastName: string;
};

type DraftMention = {
  userId: string;
  label: string;
};

type TaskChatProps = {
  taskId: string;
  coworkers: TaskChatCoworker[];
  currentUserId?: string;
  disabled?: boolean;
};

function coworkerLabel(coworker: TaskChatCoworker) {
  return `${coworker.firstName} ${coworker.lastName}`.trim();
}

function mentionQueryAt(value: string, cursor: number) {
  const upto = value.slice(0, cursor);
  const match = upto.match(/(^|\s)@([^\s@]*)$/);
  if (!match) return null;
  const query = match[2] ?? '';
  return { query, start: upto.length - query.length - 1 };
}

function actorLabel(user: TaskHistoryCommentEntry['user']) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.email;
}

export function TaskChat({
  taskId,
  coworkers,
  currentUserId,
  disabled = false,
}: TaskChatProps) {
  const { historyData, isLoading } = useGetTaskHistory(taskId);
  const saveComment = useSaveTaskComment();
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [mentions, setMentions] = useState<DraftMention[]>([]);
  const [menu, setMenu] = useState<{ query: string; start: number } | null>(
    null
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const comments = useMemo(
    () =>
      (historyData ?? [])
        .filter(
          (entry): entry is TaskHistoryCommentEntry => entry.kind === 'comment'
        )
        .slice()
        .reverse(),
    [historyData]
  );

  const choices = useMemo(() => {
    if (!menu) return [];
    const query = menu.query.toLowerCase();
    return coworkers
      .map((coworker) => ({ id: coworker.id, label: coworkerLabel(coworker) }))
      .filter((choice) => choice.label.toLowerCase().includes(query));
  }, [coworkers, menu]);

  const syncMenu = (value: string, cursor: number) => {
    const next = mentionQueryAt(value, cursor);
    setMenu(next);
    setActiveIndex(0);
  };

  const insertMention = (userId: string) => {
    const coworker = coworkers.find((person) => person.id === userId);
    const cursor = composerRef.current?.selectionStart ?? text.length;
    const query = mentionQueryAt(text, cursor);
    if (!coworker || !query) return;
    const label = coworkerLabel(coworker);
    const next = `${text.slice(0, query.start)}@${label} ${text.slice(cursor)}`;
    setText(next);
    setMentions((current) =>
      current.some((mention) => mention.userId === userId)
        ? current
        : [...current, { userId, label }]
    );
    setMenu(null);
    const caret = query.start + label.length + 2;
    requestAnimationFrame(() => {
      composerRef.current?.focus();
      composerRef.current?.setSelectionRange(caret, caret);
    });
  };

  const send = async () => {
    const body = text.trim();
    if (!body || saveComment.isPending || disabled) return;
    const mentionUserIds = editingCommentId
      ? undefined
      : mentions
          .filter((mention) => text.includes(`@${mention.label}`))
          .map((mention) => mention.userId);
    try {
      await saveComment.mutateAsync({
        taskId,
        body,
        commentId: editingCommentId,
        mentionUserIds,
      });
    } catch {
      return;
    }
    setText('');
    setMentions([]);
    setEditingCommentId(null);
    setMenu(null);
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (menu && choices.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % choices.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex(
          (index) => (index - 1 + choices.length) % choices.length
        );
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        const choice = choices[activeIndex];
        if (choice) insertMention(choice.id);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenu(null);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <div className="flex min-h-48 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="task-chat">Chat</Label>
        {editingCommentId ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 text-xs"
            onClick={() => {
              setEditingCommentId(null);
              setText('');
              setMentions([]);
              setMenu(null);
            }}
          >
            Bearbeiten abbrechen
          </Button>
        ) : null}
      </div>
      <div className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Chat wird geladen…</p>
        ) : (
          comments.map((comment) => {
            const mine = comment.user.id === currentUserId;
            return (
              <div
                key={comment.id}
                className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                  mine
                    ? 'self-end bg-primary text-primary-foreground'
                    : 'self-start bg-muted text-foreground'
                )}
              >
                <p className="text-xs font-medium opacity-80">
                  {actorLabel(comment.user)}
                </p>
                <p className="whitespace-pre-wrap">{comment.body}</p>
                {mine ? (
                  <button
                    type="button"
                    className="mt-1 text-xs underline opacity-80"
                    onClick={() => {
                      setEditingCommentId(comment.id);
                      setText(comment.body);
                      setMentions([]);
                      setMenu(null);
                    }}
                  >
                    Bearbeiten
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </div>
      <div className="relative flex items-end gap-2 border-t border-border pt-2">
        {menu ? (
          <MentionMenu
            choices={choices}
            activeIndex={activeIndex}
            onSelect={insertMention}
          />
        ) : null}
        <Textarea
          ref={composerRef}
          id="task-chat"
          value={text}
          disabled={disabled || saveComment.isPending}
          rows={2}
          placeholder="@ für Erwähnung"
          className="min-h-10 flex-1 resize-none rounded-none border-0 bg-transparent px-0 py-1.5 shadow-none focus-visible:border-transparent focus-visible:ring-0"
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            syncMenu(next, event.target.selectionStart ?? next.length);
          }}
          onKeyDown={onComposerKeyDown}
          onClick={(event) => {
            const target = event.currentTarget;
            syncMenu(
              target.value,
              target.selectionStart ?? target.value.length
            );
          }}
        />
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          disabled={
            disabled || saveComment.isPending || text.trim().length === 0
          }
          onClick={() => void send()}
        >
          Senden
        </Button>
      </div>
    </div>
  );
}
