import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useState, type DragEvent } from 'react';
import { NewQuestionForm } from './NewQuestionForm';
import type { TemplateItem } from './questionnaireTemplate.types';

type QuestionInsertGapProps = {
  open: boolean;
  onOpen: () => void;
  onAdd: (fields: TemplateItem[]) => void;
  existingKeys: string[];
  onDrop: (event: DragEvent) => void;
};

export function QuestionInsertGap({
  open,
  onOpen,
  onAdd,
  existingKeys,
  onDrop,
}: QuestionInsertGapProps) {
  const [near, setNear] = useState(false);

  return (
    <div
      className={open ? 'py-4' : 'flex h-14 items-center justify-center'}
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
        <NewQuestionForm existingKeys={existingKeys} onAdd={onAdd} />
      ) : (
        <button
          type="button"
          aria-label="Frage hier einfügen"
          onClick={onOpen}
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
