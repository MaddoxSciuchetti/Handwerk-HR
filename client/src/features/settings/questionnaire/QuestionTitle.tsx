import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        className="h-auto w-fit rounded-md px-1 text-left text-sm leading-none font-medium hover:bg-muted hover:text-foreground"
        onClick={() => setEditing(true)}
      >
        Frage: {label}
      </Button>
    );
  }

  return (
    <label className="flex items-center gap-1 text-sm leading-none font-medium">
      Frage:
      <Input
        autoFocus
        value={draft}
        maxLength={400}
        aria-label="Frage"
        className="h-auto w-auto min-w-40 rounded-md px-1 py-0 text-sm leading-none md:text-sm"
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
