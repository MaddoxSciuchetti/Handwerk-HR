import { X } from 'lucide-react';
import { useState, type DragEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { QuestionInsertGap } from './QuestionInsertGap';
import { QuestionnaireFieldControls } from './QuestionnaireFieldControls';
import type { QuestionnaireBlock } from './questionnaireBlocks';
import { isWeeklyHoursItem, itemsFromBlocks } from './questionnaireBlocks';
import { SectionHeadlineCard } from './SectionHeadlineCard';
import { TableQuestionCard } from './TableQuestionCard';
import { WeeklyHoursEditor } from './WeeklyHoursEditor';
import { useQuestionnaireDragPreview } from './useQuestionnaireDragPreview';
import './questionnaire-sort.css';
import {
  QUESTION_DRAG_TYPE,
  type ContractFieldOption,
  type TemplateField,
  type TemplateItem,
  type TemplateRepeater,
  type TemplateSection,
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
  onReplaceItems: (items: TemplateItem[]) => void;
  onChangeField: (field: TemplateField) => void;
  onChangeRepeater: (repeater: TemplateRepeater) => void;
  onChangeSection: (section: TemplateSection) => void;
  onCommitField: (field: TemplateField) => void;
  onRemove: (id: string) => void;
  onSectionOmitChange?: (section: string, omitted: boolean) => void;
};

type StackGroup =
  | {
      type: 'section';
      index: number;
      block: QuestionnaireBlock;
      children: { index: number; block: QuestionnaireBlock }[];
    }
  | { type: 'item'; index: number; block: QuestionnaireBlock };

export function QuestionnaireStack({
  blocks,
  contractFields,
  onDrop,
  onInsert,
  onReplaceItems,
  onChangeField,
  onChangeRepeater,
  onChangeSection,
  onCommitField,
  onRemove,
  onSectionOmitChange,
}: QuestionnaireStackProps) {
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const { rootRef, preview, start, cancel, over, finish } =
    useQuestionnaireDragPreview();
  const flatItems = itemsFromBlocks(blocks);

  const dropAt = (index: number, event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const payload: DragPayload | null = preview
      ? { source: 'stack', id: preview.id }
      : readPayload(event);
    const target = finish(index, event);
    if (payload) onDrop(target, payload);
  };

  /** Dropping on a headline itself places the question under it. */
  const dropOnBlock = (index: number, event: DragEvent) => {
    const isSection = blocks[index]?.items[0]?.kind === 'section';
    dropAt(isSection ? index + 1 : index, event);
  };

  const itemOffset = (blockIndex: number) =>
    blocks
      .slice(0, blockIndex)
      .reduce((sum, block) => sum + block.items.length, 0);

  const gap = (index: number) => (
    <QuestionInsertGap
      open={insertAt === index}
      onOpen={() => setInsertAt(index)}
      onClose={() => setInsertAt(null)}
      items={flatItems}
      insertAt={itemOffset(index)}
      existingKeys={flatItems.map((item) => item.key)}
      onAdd={(fields) => {
        onInsert(index, fields);
        setInsertAt(null);
      }}
      onReplaceItems={(next) => {
        onReplaceItems(next);
        setInsertAt(null);
      }}
      onDrop={(event) => dropAt(index, event)}
    />
  );

  const renderSortItem = (
    block: QuestionnaireBlock,
    index: number,
    article: ReactNode,
    options?: { articleClassName?: string; afterArticle?: ReactNode }
  ) => {
    // Keep section headlines still while a nested field is dragged so the
    // translate preview cannot slide them out of the section card.
    const isSection = block.items[0]?.kind === 'section';
    const dragOffset =
      preview && !(isSection && preview.id !== block.id)
        ? (preview.offsets.get(block.id) ?? 0)
        : 0;
    return (
    <div
      key={block.id}
      data-questionnaire-sort-item={block.id}
      className="questionnaire-sort-item min-w-0"
      style={
        preview
          ? {
              transform: `translateY(${dragOffset}px)`,
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
        onDrop={(event) => dropOnBlock(index, event)}
        className={
          options?.articleClassName ??
          'relative min-w-0 cursor-default rounded-2xl border border-border bg-card py-5 pr-12 pl-5 outline-none'
        }
      >
        <button
          type="button"
          data-no-drag
          aria-label="Entfernen"
          title="Entfernen"
          className="absolute top-3 right-3 inline-flex size-6 items-center justify-center rounded-md text-destructive outline-none hover:bg-destructive/10 focus-visible:bg-destructive/10"
          onClick={() => onRemove(block.id)}
        >
          <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
        </button>
        {article}
      </article>
      {options?.afterArticle}
    </div>
    );
  };

  const blockBody = (block: QuestionnaireBlock, index: number) => (
    <BlockBody
      block={block}
      contractFields={contractFields}
      onChangeField={onChangeField}
      onChangeRepeater={onChangeRepeater}
      onChangeSection={onChangeSection}
      onCommitField={onCommitField}
      onSectionOmitChange={onSectionOmitChange}
      onAdd={(field) => onInsert(index, [field])}
    />
  );

  return (
    <div
      ref={rootRef}
      className="questionnaire-sort-stack flex flex-col gap-3"
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
          Ziehen Sie Felder hierher oder fügen Sie eine Überschrift hinzu.
        </p>
      ) : null}
      {stackGroups(blocks).map((group) => {
        if (group.type === 'item') {
          return (
            <div key={group.block.id} className="min-w-0">
              {renderSortItem(
                group.block,
                group.index,
                blockBody(group.block, group.index),
                { afterArticle: gap(group.index + 1) }
              )}
            </div>
          );
        }

        const firstChildIndex = group.index + 1;
        return (
          <div
            key={group.block.id}
            className={`min-w-0 rounded-2xl border border-border bg-muted/50 ${
              preview ? 'overflow-visible' : 'overflow-hidden'
            }`}
          >
            {renderSortItem(
              group.block,
              group.index,
              blockBody(group.block, group.index),
              {
                articleClassName:
                  'relative min-w-0 cursor-default rounded-none border-0 bg-transparent py-4 pr-12 pl-5 outline-none',
              }
            )}
            <div className="flex flex-col border-t border-border/60 px-3 pt-1 pb-3">
              {group.children.length > 0 ? gap(firstChildIndex) : null}
              {group.children.map((child) =>
                renderSortItem(
                  child.block,
                  child.index,
                  blockBody(child.block, child.index),
                  {
                    articleClassName:
                      'relative min-w-0 cursor-default rounded-xl border border-border bg-card py-4 pr-12 pl-4 outline-none',
                    afterArticle: gap(child.index + 1),
                  }
                )
              )}
              {group.children.length === 0 ? (
                <>
                  <SectionDropZone
                    onDrop={(event) => dropAt(firstChildIndex, event)}
                  />
                  {gap(firstChildIndex)}
                </>
              ) : null}
            </div>
          </div>
        );
      })}
      {blocks.length === 0 ? gap(0) : null}
    </div>
  );
}

function SectionDropZone({ onDrop }: { onDrop: (event: DragEvent) => void }) {
  const [active, setActive] = useState(false);
  return (
    <div
      data-no-drag
      role="group"
      aria-label="Frage hier ablegen"
      onDragEnter={(event) => {
        event.preventDefault();
        setActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setActive(false);
        onDrop(event);
      }}
      className={`flex min-h-12 items-center justify-center rounded-xl border border-dashed px-3 py-3 text-sm transition-colors ${
        active
          ? 'border-primary bg-primary/5 text-foreground'
          : 'border-border text-muted-foreground'
      }`}
    >
      Frage hier ablegen
    </div>
  );
}

function stackGroups(blocks: QuestionnaireBlock[]): StackGroup[] {
  const groups: StackGroup[] = [];
  let index = 0;
  while (index < blocks.length) {
    const block = blocks[index]!;
    if (block.items[0]?.kind === 'section') {
      const children: { index: number; block: QuestionnaireBlock }[] = [];
      let cursor = index + 1;
      while (
        cursor < blocks.length &&
        blocks[cursor]?.items[0]?.kind !== 'section'
      ) {
        children.push({ index: cursor, block: blocks[cursor]! });
        cursor += 1;
      }
      groups.push({ type: 'section', index, block, children });
      index = cursor;
      continue;
    }
    groups.push({ type: 'item', index, block });
    index += 1;
  }
  return groups;
}

function BlockBody({
  block,
  contractFields,
  onChangeField,
  onChangeRepeater,
  onChangeSection,
  onCommitField,
  onAdd,
}: {
  block: QuestionnaireBlock;
  contractFields: ContractFieldOption[];
  onChangeField: (field: TemplateField) => void;
  onChangeRepeater: (repeater: TemplateRepeater) => void;
  onChangeSection: (section: TemplateSection) => void;
  onCommitField: (field: TemplateField) => void;
  onAdd: (field: TemplateField) => void;
}) {
  const first = block.items[0];
  if (first?.kind === 'section') {
    return (
      <SectionHeadlineCard section={first} onChange={onChangeSection} />
    );
  }
  if (first?.kind === 'repeater') {
    return <TableQuestionCard repeater={first} onChange={onChangeRepeater} />;
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
