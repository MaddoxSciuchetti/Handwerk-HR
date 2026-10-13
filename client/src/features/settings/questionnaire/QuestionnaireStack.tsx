import { Button } from '@/components/ui/button';
import type { DragEvent } from 'react';
import { QuestionnaireFieldControls } from './QuestionnaireFieldControls';
import type { QuestionnaireBlock } from './questionnaireBlocks';
import { isHourField } from './questionnaireBlocks';
import {
  QUESTION_DRAG_TYPE,
  type ContractFieldOption,
  type TemplateField,
} from './questionnaireTemplate.types';

export type DragPayload = {
  source: 'palette' | 'stack';
  id: string;
};

type QuestionnaireStackProps = {
  blocks: QuestionnaireBlock[];
  contractFields: ContractFieldOption[];
  onDrop: (index: number, payload: DragPayload) => void;
  onChangeField: (field: TemplateField) => void;
  onRemove: (id: string) => void;
};

export function QuestionnaireStack({
  blocks,
  contractFields,
  onDrop,
  onChangeField,
  onRemove,
}: QuestionnaireStackProps) {
  return (
    <div
      className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-muted/30 p-4"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const payload = readPayload(event);
        if (payload) onDrop(blocks.length, payload);
      }}
    >
      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ziehen Sie Felder hierher. Sie stehen untereinander.
        </p>
      ) : null}
      {blocks.map((block, index) => (
        <article
          key={block.id}
          draggable
          onDragStart={(event) => {
            const payload: DragPayload = { source: 'stack', id: block.id };
            event.dataTransfer.setData(QUESTION_DRAG_TYPE, JSON.stringify(payload));
            event.dataTransfer.setData('text/plain', JSON.stringify(payload));
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const payload = readPayload(event);
            if (payload) onDrop(index, payload);
          }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="text-xs text-muted-foreground">{blockLabel(block.items[0])}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
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
          />
        </article>
      ))}
    </div>
  );
}

function BlockBody({
  block,
  contractFields,
  onChangeField,
}: {
  block: QuestionnaireBlock;
  contractFields: ContractFieldOption[];
  onChangeField: (field: TemplateField) => void;
}) {
  const first = block.items[0];
  if (first?.kind === 'repeater') {
    return <p className="text-sm font-medium">{first.section}</p>;
  }
  if (first && isHourField(first)) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium">Wochenstunden</p>
        {block.items.flatMap((item) =>
          item.kind === 'field' && isHourField(item) ? [item] : []
        ).map((field) => (
          <QuestionnaireFieldControls
            key={field.key}
            field={field}
            contractFields={contractFields}
            onChange={onChangeField}
          />
        ))}
      </div>
    );
  }
  if (first?.kind === 'field') {
    return (
      <QuestionnaireFieldControls
        field={first}
        contractFields={contractFields}
        onChange={onChangeField}
      />
    );
  }
  return null;
}

function blockLabel(item: QuestionnaireBlock['items'][number] | undefined) {
  if (!item) return 'Frage';
  if (item.kind === 'repeater') return 'Block';
  if (isHourField(item)) return 'Arbeitszeit';
  return item.section;
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
