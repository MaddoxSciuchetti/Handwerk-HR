import { useRef, useState } from 'react';

type QuestionTitleProps = {
  label: string;
  onCommit: (label: string) => void;
  onChange?: (label: string) => void;
};

export function QuestionTitle({
  label,
  onCommit,
  onChange,
}: QuestionTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const skipCommit = useRef(false);
  const original = useRef(label);

  const commit = () => {
    setEditing(false);
    if (skipCommit.current) {
      skipCommit.current = false;
      setDraft(original.current);
      onCommit(original.current);
      return;
    }
    const next = draft.trim();
    if (!next || next === label) {
      setDraft(label);
      return;
    }
    onCommit(next);
  };

  const text = editing ? draft : label;
  const textClass =
    'rounded-md border px-1 py-[3px] text-left text-sm leading-6 font-medium whitespace-pre-wrap [overflow-wrap:anywhere]';

  return (
    <div className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] items-start gap-2 text-sm leading-6 font-medium">
      <span className="w-16 shrink-0 py-1">Frage:</span>
      <div className="relative inline-grid w-max min-w-[min(16rem,100%)] max-w-full justify-self-start">
        {/* The mirror keeps the native text field fitted to its content in every state. */}
        <span
          aria-hidden="true"
          className={`${textClass} invisible border-transparent`}
        >
          {text}
          {'\u200b'}
        </span>
        <textarea
          rows={1}
          value={text}
          maxLength={400}
          aria-label="Frage"
          className={`${textClass} absolute inset-0 h-full w-full cursor-text resize-none overflow-hidden border-transparent bg-transparent outline-none hover:border-border hover:bg-muted focus:border-border focus:bg-muted`}
          onFocus={() => {
            original.current = label;
            setDraft(label);
            setEditing(true);
          }}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (next.trim()) onChange?.(next.trim());
          }}
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
      </div>
    </div>
  );
}
