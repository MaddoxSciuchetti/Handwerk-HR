import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MentionMenu } from '@/features/all-tasks/components/MentionMenu';
import { useRef, useState, type KeyboardEvent } from 'react';

type Coworker = {
  id: string;
  firstName: string;
  lastName: string;
};

type DraftMention = {
  userId: string;
  label: string;
};

function coworkerLabel(coworker: Coworker) {
  return `${coworker.firstName} ${coworker.lastName}`.trim();
}

function mentionQueryAt(value: string, cursor: number) {
  const upto = value.slice(0, cursor);
  const match = upto.match(/(^|\s)@([^\s@]*)$/);
  if (!match) return null;
  const query = match[2] ?? '';
  return { query, start: upto.length - query.length - 1 };
}

export function OrgChatComposer({
  coworkers,
  currentUserId,
  disabled,
  onSend,
}: {
  coworkers: Coworker[];
  currentUserId?: string;
  disabled?: boolean;
  onSend: (body: string, mentionUserIds: string[]) => Promise<void>;
}) {
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [mentions, setMentions] = useState<DraftMention[]>([]);
  const [menu, setMenu] = useState<{ query: string; start: number } | null>(
    null
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const choices = coworkers
    .filter((coworker) => coworker.id !== currentUserId)
    .map((coworker) => ({ id: coworker.id, label: coworkerLabel(coworker) }))
    .filter((choice) =>
      menu ? choice.label.toLowerCase().includes(menu.query.toLowerCase()) : false
    );

  const syncMenu = (value: string, cursor: number) => {
    setMenu(mentionQueryAt(value, cursor));
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
    if (!body || disabled) return;
    const mentionUserIds = mentions
      .filter((mention) => text.includes(`@${mention.label}`))
      .map((mention) => mention.userId);
    const draft = text;
    setText('');
    setMenu(null);
    try {
      await onSend(body, mentionUserIds);
    } catch {
      setText(draft);
      return;
    }
    setMentions([]);
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
    <div className="relative flex items-end gap-2 border-t border-border p-3">
      {menu ? (
        <MentionMenu
          choices={choices}
          activeIndex={activeIndex}
          onSelect={insertMention}
        />
      ) : null}
      <Textarea
        ref={composerRef}
        value={text}
        disabled={disabled}
        rows={2}
        placeholder="@ für Erwähnung"
        aria-label="Nachricht"
        className="min-h-16 flex-1 resize-none"
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          syncMenu(next, event.target.selectionStart ?? next.length);
        }}
        onClick={(event) => {
          const target = event.currentTarget;
          syncMenu(target.value, target.selectionStart ?? target.value.length);
        }}
        onKeyDown={onComposerKeyDown}
      />
      <Button
        type="button"
        size="sm"
        disabled={disabled || text.trim().length === 0}
        onClick={() => void send()}
      >
        Senden
      </Button>
    </div>
  );
}
