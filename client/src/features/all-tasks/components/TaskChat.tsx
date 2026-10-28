import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';
import {
  ArrowUpIcon,
  SaveIcon,
  LoaderCircleIcon,
  PencilIcon,
} from 'lucide-react';
import { useGetTaskHistory } from '@/features/worker-task-management/hooks/useGetTaskHistory';
import type { TaskHistoryCommentEntry } from '@/features/worker-task-management/types/index.types';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
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
  const focusEditAtEnd = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }, []);
  const [text, setText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
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

  const latestOwnComment = comments
    .slice()
    .reverse()
    .find((comment) => comment.user.id === currentUserId);

  const choices = useMemo(() => {
    if (!menu) return [];
    const query = menu.query.toLowerCase();
    return coworkers
      .filter((coworker) => coworker.id !== currentUserId)
      .map((coworker) => ({ id: coworker.id, label: coworkerLabel(coworker) }))
      .filter((choice) => choice.label.toLowerCase().includes(query));
  }, [coworkers, currentUserId, menu]);

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
    const mentionUserIds = mentions
      .filter((mention) => text.includes(`@${mention.label}`))
      .map((mention) => mention.userId);
    const draft = text;
    setText('');
    setMenu(null);
    try {
      await saveComment.mutateAsync({
        taskId,
        body,
        commentId: null,
        mentionUserIds,
      });
    } catch {
      setText(draft);
      return;
    }
    setText('');
    setMentions([]);
    setMenu(null);
  };

  const saveEdit = async () => {
    const body = editText.trim();
    if (!editingCommentId || !body || disabled || saveComment.isPending) return;
    try {
      await saveComment.mutateAsync({
        taskId,
        body,
        commentId: editingCommentId,
      });
      setEditingCommentId(null);
      setEditText('');
    } catch {
      // Keep the inline draft available for retry.
    }
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="task-chat">Chat</Label>
      </div>
      <MessageScrollerProvider
        key={taskId}
        autoScroll
        defaultScrollPosition="end"
      >
        <MessageScroller className="h-auto max-h-72">
          <MessageScrollerViewport
            aria-label="Chatverlauf"
            className="h-auto max-h-72"
          >
            <MessageScrollerContent className="min-h-0 gap-4 py-1 pr-2">
              {isLoading ? (
                <MessageScrollerItem messageId="loading">
                  <p role="status" className="text-xs text-muted-foreground">
                    Chat wird geladen…
                  </p>
                </MessageScrollerItem>
              ) : (
                comments.map((comment) => {
                  const mine = comment.user.id === currentUserId;
                  return (
                    <MessageScrollerItem
                      key={comment.id}
                      messageId={comment.id}
                      onBlur={(event) => {
                        if (
                          !saveComment.isPending &&
                          !event.currentTarget.contains(
                            event.relatedTarget as Node | null
                          )
                        ) {
                          setEditingCommentId(null);
                          setEditText('');
                        }
                      }}
                    >
                      <Message align={mine ? 'end' : 'start'}>
                        <MessageAvatar className="self-center">
                          <Avatar title={actorLabel(comment.user)}>
                            <AvatarFallback>
                              {`${comment.user.firstName?.[0] ?? ''}${comment.user.lastName?.[0] ?? ''}` ||
                                '?'}
                            </AvatarFallback>
                          </Avatar>
                        </MessageAvatar>
                        <MessageContent>
                          <Bubble
                            variant="muted"
                            align={mine ? 'end' : 'start'}
                          >
                            <BubbleContent className="whitespace-pre-wrap wrap-anywhere">
                              {editingCommentId === comment.id ? (
                                <textarea
                                  ref={focusEditAtEnd}
                                  aria-label="Nachricht bearbeiten"
                                  value={editText}
                                  disabled={disabled || saveComment.isPending}
                                  rows={1}
                                  className="block field-sizing-content max-h-32 min-w-40 max-w-full resize-none bg-transparent p-0 text-inherit leading-inherit outline-none"
                                  onChange={(event) =>
                                    setEditText(event.target.value)
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === 'Escape') {
                                      setEditingCommentId(null);
                                      setEditText('');
                                    }
                                  }}
                                />
                              ) : (
                                comment.body
                              )}
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                      {comment.id === latestOwnComment?.id ? (
                        <div className="mt-1 flex justify-end pr-10">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground"
                            aria-label={
                              editingCommentId === comment.id
                                ? 'Änderung speichern'
                                : 'Letzte Nachricht bearbeiten'
                            }
                            disabled={
                              disabled ||
                              saveComment.isPending ||
                              (editingCommentId === comment.id &&
                                !editText.trim())
                            }
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              if (editingCommentId === comment.id) {
                                void saveEdit();
                              } else {
                                setEditingCommentId(comment.id);
                                setEditText(comment.body);
                              }
                            }}
                          >
                            {editingCommentId === comment.id ? (
                              <SaveIcon />
                            ) : (
                              <PencilIcon />
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </MessageScrollerItem>
                  );
                })
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="relative">
        {menu ? (
          <MentionMenu
            choices={choices}
            activeIndex={activeIndex}
            onSelect={insertMention}
          />
        ) : null}
        <InputGroup className="rounded-xl bg-background has-disabled:bg-background has-disabled:opacity-100 has-[[data-slot=input-group-control]:focus-visible]:border-input has-[[data-slot=input-group-control]:focus-visible]:ring-0 dark:bg-background dark:has-disabled:bg-background">
          <InputGroupTextarea
            ref={composerRef}
            id="task-chat"
            value={text}
            disabled={disabled || saveComment.isPending}
            rows={1}
            placeholder="@ für Erwähnung"
            className="max-h-32 min-h-8 py-1.5 leading-5"
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
          <InputGroupAddon align="inline-end" className="self-end py-1">
            <InputGroupButton
              type="button"
              variant="default"
              size="icon-xs"
              className="rounded-full"
              aria-label="Senden"
              disabled={
                disabled || saveComment.isPending || text.trim().length === 0
              }
              onClick={() => void send()}
            >
              {saveComment.isPending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <ArrowUpIcon />
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}
