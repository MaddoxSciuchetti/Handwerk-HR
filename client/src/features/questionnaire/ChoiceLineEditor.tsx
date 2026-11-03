/* eslint-disable react-refresh/only-export-components */
import { useEffect, useId, useState } from 'react';

type ChoiceLineEditorProps = {
  options: string[];
  onChange: (options: string[]) => void;
};

export function choiceLines(value: string) {
  const lines = [
    ...new Set(
      value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    ),
  ];
  if (lines.length < 2 || lines.length > 8 || lines.some((line) => line.length > 80)) {
    return null;
  }
  return lines;
}

export function ChoiceLineEditor({ options, onChange }: ChoiceLineEditorProps) {
  const fieldId = useId();
  const saved = options.join('\n');
  const [text, setText] = useState(saved);

  useEffect(() => {
    setText(saved);
  }, [saved]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium" htmlFor={fieldId}>
        Text neben den Kästchen
      </label>
      <textarea
        id={fieldId}
        aria-label="Text neben den Kästchen"
        className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          const lines = choiceLines(text);
          if (!lines) {
            setText(saved);
            return;
          }
          if (lines.join('\n') !== saved) onChange(lines);
        }}
      />
      <p className="text-xs text-muted-foreground">
        Jede Zeile steht neben einem Kästchen. Mindestens zwei.
      </p>
    </div>
  );
}
