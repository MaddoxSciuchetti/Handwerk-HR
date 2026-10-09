import { cn } from '@/lib/utils';
import type { DocumentSegment } from '@/features/settings/documents/documentSegments';
import { useState } from 'react';
import {
  getDraggedQuestionnaireAnswer,
  setDraggedQuestionnaireAnswer,
} from './questionnaireAnswerDrag';

type ContractDraftBodyProps = {
  segments: DocumentSegment[];
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  readOnly: boolean;
  acceptAnswerDrop?: boolean;
};

export function ContractDraftBody({
  segments,
  values,
  onValueChange,
  readOnly,
  acceptAnswerDrop = false,
}: ContractDraftBodyProps) {
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const canDrop = acceptAnswerDrop && !readOnly;

  return (
    <div className="min-h-80 flex-1 overflow-auto rounded-lg border border-border p-4 text-sm leading-8 whitespace-pre-wrap">
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.text}</span>;
        }

        const value = values[segment.key] ?? '';
        const width = Math.max(segment.label.length, value.length, 8);

        return (
          <input
            key={`${segment.key}-${index}`}
            aria-label={segment.label}
            placeholder={segment.label}
            value={value}
            size={width}
            readOnly={readOnly}
            onChange={(event) => onValueChange(segment.key, event.target.value)}
            onDragOver={
              canDrop
                ? (event) => {
                    if (!getDraggedQuestionnaireAnswer()) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'copy';
                    setDropIndex(index);
                  }
                : undefined
            }
            onDragLeave={
              canDrop
                ? () => {
                    setDropIndex((current) => (current === index ? null : current));
                  }
                : undefined
            }
            onDrop={
              canDrop
                ? (event) => {
                    const dragged = getDraggedQuestionnaireAnswer();
                    setDropIndex(null);
                    if (!dragged) return;
                    event.preventDefault();
                    onValueChange(segment.key, dragged.value);
                    setDraggedQuestionnaireAnswer(null);
                  }
                : undefined
            }
            className={cn(
              'mx-0.5 inline-block border-b border-foreground bg-transparent px-1 text-center outline-none placeholder:text-muted-foreground read-only:text-foreground',
              dropIndex === index && 'bg-accent'
            )}
          />
        );
      })}
    </div>
  );
}
