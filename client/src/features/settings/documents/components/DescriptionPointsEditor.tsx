import { Button } from '@/components/ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DEFAULT_DESCRIPTION_SENTENCES,
  descriptionSentenceKey,
  mergeDescriptionSentences,
} from '@shared/descriptionSentences';
import {
  descriptionSentencesKey,
  getDescriptionSentences,
  saveDescriptionSentence,
} from '../descriptionSentences.api';
import { DescriptionSentenceSelect } from './DescriptionSentenceSelect';

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
  const queryClient = useQueryClient();
  const sentences = useQuery({
    queryKey: descriptionSentencesKey,
    queryFn: getDescriptionSentences,
    enabled: !readOnly,
  });
  const options = mergeDescriptionSentences(
    sentences.data ?? DEFAULT_DESCRIPTION_SENTENCES
  );
  const save = useMutation({
    mutationFn: saveDescriptionSentence,
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: descriptionSentencesKey }),
    onSuccess: (saved) => {
      queryClient.setQueryData(descriptionSentencesKey, saved);
      toast.success('Beschreibungspunkt für spätere Verwendung gespeichert');
    },
    onError: () =>
      toast.error('Beschreibungspunkt konnte nicht gespeichert werden'),
  });
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
          <DescriptionSentenceSelect
            label={`${label} ${index + 1}`}
            value={line}
            options={options}
            saveLabel={`Punkt ${index + 1} als Vorlage speichern`}
            canSave={
              Boolean(line.trim()) &&
              !save.isPending &&
              !options.some(
                (option) =>
                  descriptionSentenceKey(option) ===
                  descriptionSentenceKey(line)
              )
            }
            saving={save.isPending && save.variables === line}
            onSave={() => save.mutate(line)}
            onChange={(value) => {
              const next = [...lines];
              next[index] = value;
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
      {sentences.isError ? (
        <p className="text-xs text-destructive">
          Gespeicherte Sätze konnten nicht geladen werden.
        </p>
      ) : null}
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
