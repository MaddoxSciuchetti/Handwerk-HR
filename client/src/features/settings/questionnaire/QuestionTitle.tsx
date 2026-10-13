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
      <button
        type="button"
        className="w-fit rounded-md px-1 py-0.5 text-left text-sm hover:bg-muted"
        onClick={() => setEditing(true)}
      >
        <span className="font-medium">Frage: </span>
        {label}
      </button>
    );
  }

  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      Frage:
      <Input
        autoFocus
        value={draft}
        maxLength={400}
        aria-label="Frage"
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
