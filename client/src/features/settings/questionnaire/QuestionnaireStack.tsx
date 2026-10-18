import { Button } from '@/components/ui/button';
import { useState, type DragEvent } from 'react';
import { flushSync } from 'react-dom';
import { QuestionInsertGap } from './QuestionInsertGap';
import { QuestionnaireFieldControls } from './QuestionnaireFieldControls';
import type { QuestionnaireBlock } from './questionnaireBlocks';
import { isHourField } from './questionnaireBlocks';
import { useQuestionnaireDragPreview } from './useQuestionnaireDragPreview';
import './questionnaire-sort.css';
import {
  QUESTION_DRAG_TYPE,
  type ContractFieldOption,
  type TemplateField,
  type TemplateItem,
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
  onCommitField: (field: TemplateField) => void;
  onRemove: (id: string) => void;
};

export function QuestionnaireStack({
  blocks,
  contractFields,
  onDrop,
  onInsert,
  onChangeField,
  onCommitField,
  onRemove,
}: QuestionnaireStackProps) {
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const { rootRef, preview, start, cancel, over, finish } =
    useQuestionnaireDragPreview();

  const dropAt = (index: number, event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const payload: DragPayload | null = preview
      ? { source: 'stack', id: preview.id }
      : readPayload(event);
    const target = finish(index, event);
    if (payload) onDrop(target, payload);
  };

  const gap = (index: number) => (
    <QuestionInsertGap
      open={insertAt === index}
      onOpen={() => setInsertAt(index)}
      onAdd={(field) => {
        onInsert(index, [field]);
        setInsertAt(null);
      }}
      onDrop={(event) => dropAt(index, event)}
    />
  );

  return (
    <div
      ref={rootRef}
      className="questionnaire-sort-stack flex flex-col"
      data-sorting={Boolean(preview)}
      onDragOver={(event) => {
        event.preventDefault();
        over(event);
      }}
      onDrop={(event) => dropAt(blocks.length, event)}
      onDragEnd={cancel}
    >
      {preview ? (
        <>
          <div
            className="questionnaire-sort-placeholder"
            data-questionnaire-drop-preview=""
            aria-hidden="true"
            style={{
              height: preview.height,
              transform: `translateY(${preview.top}px)`,
            }}
          >
            Hier ablegen
          </div>
          <span className="sr-only" role="status">
            Position {preview.position} von {preview.total}
          </span>
        </>
      ) : null}
      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ziehen Sie Felder hierher. Sie stehen untereinander.
        </p>
      ) : null}
      {blocks.map((block, index) => (
        <div
          key={block.id}
          data-questionnaire-sort-item={block.id}
          className="questionnaire-sort-item min-w-0"
          style={
            preview
              ? {
                  transform: `translateY(${preview.offsets.get(block.id) ?? 0}px)`,
                  // WebKit cancels native dragging when its source is fully
                  // invisible or stops accepting pointer events.
                  opacity: preview.id === block.id ? 0.001 : 1,
                }
              : undefined
          }
        >
          <article
            draggable
            onDragStart={(event) => {
              if (dragStartsOnControl(event)) {
                event.preventDefault();
                return;
              }
              flushSync(() => setInsertAt(null));
              const payload: DragPayload = { source: 'stack', id: block.id };
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData(
                QUESTION_DRAG_TYPE,
                JSON.stringify(payload)
              );
              event.dataTransfer.setData('text/plain', JSON.stringify(payload));
              start(block.id, event);
            }}
            onDrop={(event) => dropAt(index, event)}
            className="min-w-0 cursor-grab rounded-2xl border border-border bg-card px-5 py-4 active:cursor-grabbing"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {blockLabel(block.items[0])}
              </p>
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
              onCommitField={onCommitField}
            />
          </article>
          {gap(index + 1)}
        </div>
      ))}
      {blocks.length === 0 ? gap(0) : null}
    </div>
  );
}

function BlockBody({
  block,
  contractFields,
  onChangeField,
  onCommitField,
}: {
  block: QuestionnaireBlock;
  contractFields: ContractFieldOption[];
  onChangeField: (field: TemplateField) => void;
  onCommitField: (field: TemplateField) => void;
}) {
  const first = block.items[0];
  if (first?.kind === 'repeater') {
    return <p className="text-sm font-medium">{first.section}</p>;
  }
  if (first && isHourField(first)) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium">Wochenstunden</p>
        {block.items
          .flatMap((item) =>
            item.kind === 'field' && isHourField(item) ? [item] : []
          )
          .map((field) => (
            <QuestionnaireFieldControls
              key={field.key}
              field={field}
              contractFields={contractFields}
              onChange={onChangeField}
              onCommit={onCommitField}
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
        onCommit={onCommitField}
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

function dragStartsOnControl(event: DragEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, button, [role="switch"], [role="combobox"], [data-no-drag]'
    )
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
