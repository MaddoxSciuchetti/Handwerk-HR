import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useRef, useState } from 'react';

type QuestionTitleProps = {
  label: string;
  onCommit: (label: string) => void;
};

export function QuestionTitle({ label, onCommit }: QuestionTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const skipCommit = useRef(false);

  useEffect(() => {
    if (!editing) setDraft(label);
  }, [editing, label]);

  const commit = () => {
    setEditing(false);
    if (skipCommit.current) {
      skipCommit.current = false;
      setDraft(label);
      return;
    }
    const next = draft.trim();
    if (!next || next === label) {
      setDraft(label);
      return;
    }
    onCommit(next);
  };

  if (!editing) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="h-auto min-w-0 max-w-full self-start justify-start rounded-md px-1 py-0 text-left text-sm leading-6 font-medium whitespace-normal hover:bg-muted hover:text-foreground"
        onClick={() => setEditing(true)}
      >
        <span className="min-w-0 whitespace-normal [overflow-wrap:anywhere]">
          Frage: {label}
        </span>
      </Button>
    );
  }

  return (
    <label className="flex w-full min-w-0 items-start gap-1 text-sm leading-6 font-medium">
      <span className="shrink-0">Frage:</span>
      <Textarea
        rows={1}
        autoFocus
        value={draft}
        maxLength={400}
        aria-label="Frage"
        className="min-h-6 min-w-0 flex-1 resize-none rounded-md px-1 py-0 text-sm leading-6 [overflow-wrap:anywhere] md:text-sm"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            skipCommit.current = true;
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}
