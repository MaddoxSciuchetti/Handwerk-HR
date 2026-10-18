import { Button } from '@/components/ui/button';
import { Fragment, useState, type DragEvent } from 'react';
import { QuestionInsertGap } from './QuestionInsertGap';
import { QuestionnaireFieldControls } from './QuestionnaireFieldControls';
import type { QuestionnaireBlock } from './questionnaireBlocks';
import { isWeeklyHoursItem } from './questionnaireBlocks';
import { TableQuestionCard } from './TableQuestionCard';
import { WeeklyHoursEditor } from './WeeklyHoursEditor';
import {
  QUESTION_DRAG_TYPE,
  type ContractFieldOption,
  type TemplateField,
  type TemplateItem,
  type TemplateRepeater,
} from './questionnaireTemplate.types';

export type DragPayload = {
  source: 'palette' | 'stack';
  id: string;
};

type QuestionnaireStackProps = {
  blocks: QuestionnaireBlock[];
  contractFields: ContractFieldOption[];
  onDrop: (index: number, payload: DragPayload) => void;
  onInsert: (index: number, items: TemplateItem[]) => void;
  onChangeField: (field: TemplateField) => void;
  onChangeRepeater: (repeater: TemplateRepeater) => void;
  onCommitField: (field: TemplateField) => void;
  onRemove: (id: string) => void;
};

export function QuestionnaireStack({
  blocks,
  contractFields,
  onDrop,
  onInsert,
  onChangeField,
  onChangeRepeater,
  onCommitField,
  onRemove,
}: QuestionnaireStackProps) {
  const [insertAt, setInsertAt] = useState<number | null>(null);

  const dropAt = (index: number, event: DragEvent) => {
    const payload = readPayload(event);
    if (payload) onDrop(index, payload);
  };

  return (
    <div
      className="flex flex-col"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => dropAt(blocks.length, event)}
    >
      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ziehen Sie Felder hierher. Sie stehen untereinander.
        </p>
      ) : null}
      {blocks.map((block, index) => (
        <Fragment key={block.id}>
          {index > 0 ? (
            <QuestionInsertGap
              open={insertAt === index}
              onOpen={() => setInsertAt(index)}
              existingKeys={blocks.flatMap((block) => block.items.map((item) => item.key))}
              onAdd={(fields) => {
                onInsert(index, fields);
                setInsertAt(null);
              }}
              onDrop={(event) => dropAt(index, event)}
            />
          ) : null}
          <article
            draggable
            onDragStart={(event) => {
              if (dragStartsOnControl(event)) {
                event.preventDefault();
                return;
              }
              const payload: DragPayload = { source: 'stack', id: block.id };
              event.dataTransfer.setData(
                QUESTION_DRAG_TYPE,
                JSON.stringify(payload)
              );
              event.dataTransfer.setData('text/plain', JSON.stringify(payload));
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              dropAt(index, event);
            }}
            className="min-w-0 rounded-2xl border border-border px-5 py-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              {block.items[0] && isWeeklyHoursItem(block.items[0]) ? (
                <span className="sr-only">Arbeitszeit pro Woche</span>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {blockLabel(block.items[0])}
                </p>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-no-drag
                className="rounded-2xl"
                onClick={() => onRemove(block.id)}
              >
                Entfernen
              </Button>
            </div>
            <BlockBody
              block={block}
              contractFields={contractFields}
              onChangeField={onChangeField}
              onChangeRepeater={onChangeRepeater}
              onCommitField={onCommitField}
              onAdd={(field) => onInsert(index, [field])}
            />
          </article>
        </Fragment>
      ))}
      <QuestionInsertGap
        open={insertAt === blocks.length}
        onOpen={() => setInsertAt(blocks.length)}
        existingKeys={blocks.flatMap((block) => block.items.map((item) => item.key))}
        onAdd={(fields) => {
          onInsert(blocks.length, fields);
          setInsertAt(null);
        }}
        onDrop={(event) => dropAt(blocks.length, event)}
      />
    </div>
  );
}

function BlockBody({
  block,
  contractFields,
  onChangeField,
  onChangeRepeater,
  onCommitField,
  onAdd,
}: {
  block: QuestionnaireBlock;
  contractFields: ContractFieldOption[];
  onChangeField: (field: TemplateField) => void;
  onChangeRepeater: (repeater: TemplateRepeater) => void;
  onCommitField: (field: TemplateField) => void;
  onAdd: (field: TemplateField) => void;
}) {
  const first = block.items[0];
  if (first?.kind === 'repeater' && first.key.startsWith('rows.')) {
    return <TableQuestionCard repeater={first} onChange={onChangeRepeater} />;
  }
  if (first?.kind === 'repeater') {
    return <p className="text-sm font-medium">{first.section}</p>;
  }
  if (first && isWeeklyHoursItem(first)) {
    const fields = block.items.flatMap((item) =>
      item.kind === 'field' ? [item] : []
    );
    return (
      <WeeklyHoursEditor
        fields={fields}
        contractFields={contractFields}
        onChange={onChangeField}
        onAdd={onAdd}
      />
    );
  }
  if (first?.kind === 'field') {
    return (
      <QuestionnaireFieldControls
        field={first}
        contractFields={contractFields}
        onChange={onChangeField}
        onCommit={onCommitField}
      />
    );
  }
  return null;
}

function blockLabel(item: QuestionnaireBlock['items'][number] | undefined) {
  if (!item) return 'Frage';
  if (item.kind === 'repeater') return item.key.startsWith('rows.') ? 'Tabelle' : 'Block';
  if (isWeeklyHoursItem(item)) return 'Arbeitszeit pro Woche';
  return item.section;
}

function dragStartsOnControl(event: DragEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('input, textarea, select, [role="switch"], [data-no-drag]')
  );
}

function readPayload(event: DragEvent): DragPayload | null {
  const raw =
    event.dataTransfer.getData(QUESTION_DRAG_TYPE) ||
    event.dataTransfer.getData('text/plain');
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as DragPayload;
    if (payload.source !== 'palette' && payload.source !== 'stack') return null;
    if (!payload.id) return null;
    return payload;
  } catch {
    return null;
  }
}
