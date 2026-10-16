import { Button } from '@/components/ui/button';

type DescriptionPointsEditorProps = {
  label: string;
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
};

function linesOf(value: string) {
  return value.length > 0 ? value.split('\n') : [''];
}

export function DescriptionPointsEditor({
  label,
  value,
  readOnly,
  onChange,
}: DescriptionPointsEditorProps) {
  const lines = linesOf(value);
  const write = (next: string[]) => onChange(next.join('\n'));

  if (readOnly) {
    const points = lines.map((line) => line.trim()).filter(Boolean);
    if (points.length === 0)
      return <p className="text-sm text-muted-foreground">Keine Punkte</p>;
    return (
      <ul className="list-disc pl-5 text-sm">
        {points.map((point, index) => (
          <li key={`${index}-${point}`}>{point}</li>
        ))}
      </ul>
    );
  }

  return (
    <div
      className="flex flex-col gap-1.5"
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {lines.map((line, index) => (
        <div key={index} className="flex items-center gap-1">
          <input
            aria-label={`${label} ${index + 1}`}
            value={line}
            placeholder="Beschreibungspunkt"
            className="min-w-0 flex-1 border-b border-blue-400 bg-transparent px-1 text-sm outline-none"
            onChange={(event) => {
              const next = [...lines];
              next[index] = event.target.value;
              write(next);
            }}
            onPaste={(event) => {
              const text = event.clipboardData.getData('text/plain');
              if (!text.includes('\n')) return;
              event.preventDefault();
              const next = [...lines];
              next.splice(index, 1, ...text.split(/\r?\n/));
              write(next);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Punkt ${index + 1} entfernen`}
            onClick={() => write(lines.filter((_, item) => item !== index))}
          >
            Entfernen
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => write([...lines, ''])}
      >
        Punkt hinzufügen
      </Button>
    </div>
  );
}
