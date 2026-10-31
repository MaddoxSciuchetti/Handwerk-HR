import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heading, Plus, TextCursorInput } from 'lucide-react';
import { useState, type DragEvent } from 'react';
import { NewQuestionForm } from './NewQuestionForm';
import { NewSectionForm } from './NewSectionForm';
import type { TemplateItem } from './questionnaireTemplate.types';

type InsertMode = 'choose' | 'question' | 'section';

type QuestionInsertGapProps = {
  open: boolean;
  onOpen: () => void;
  onClose?: () => void;
  onAdd: (fields: TemplateItem[]) => void;
  onReplaceItems: (items: TemplateItem[]) => void;
  items: TemplateItem[];
  insertAt: number;
  existingKeys: string[];
  onDrop: (event: DragEvent) => void;
};

export function QuestionInsertGap({
  open,
  onOpen,
  onClose,
  onAdd,
  onReplaceItems,
  items,
  insertAt,
  existingKeys,
  onDrop,
}: QuestionInsertGapProps) {
  const [near, setNear] = useState(false);
  const [mode, setMode] = useState<InsertMode>('choose');

  const close = () => {
    setMode('choose');
    onClose?.();
  };

  return (
    <div
      data-question-insert-gap=""
      className={open ? 'py-4' : 'flex h-6 items-center justify-center'}
      onMouseEnter={() => setNear(true)}
      onMouseLeave={() => setNear(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDrop(event);
      }}
    >
      {open ? (
        mode === 'choose' ? (
          <div
            data-no-drag
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
          >
            <p className="text-sm font-medium text-foreground">Einfügen:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl gap-2"
                onClick={() => setMode('question')}
              >
                <TextCursorInput className="size-4" aria-hidden="true" />
                Frage
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl gap-2"
                onClick={() => setMode('section')}
              >
                <Heading className="size-4" aria-hidden="true" />
                Überschrift
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl"
                onClick={close}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        ) : mode === 'question' ? (
          <NewQuestionForm
            existingKeys={existingKeys}
            onAdd={(fields) => {
              onAdd(fields);
              setMode('choose');
            }}
            onCancel={close}
          />
        ) : (
          <NewSectionForm
            items={items}
            insertAt={insertAt}
            onAdd={(next) => {
              onReplaceItems(next);
              setMode('choose');
            }}
            onCancel={close}
          />
        )
      ) : (
        <button
          type="button"
          aria-label="Frage oder Überschrift hier einfügen"
          onClick={() => {
            setMode('choose');
            onOpen();
          }}
          className={cn(
            'inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none transition duration-200 ease-out focus-visible:scale-100 focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50',
            near ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          )}
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
