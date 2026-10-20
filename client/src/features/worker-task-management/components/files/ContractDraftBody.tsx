import { cn } from '@/lib/utils';
import type { DocumentSegment } from '@/features/settings/documents/documentSegments';
import type { StyledDocument } from '@/features/settings/documents/styledDocument';
import { StyledDocumentReview } from '@/features/settings/documents/StyledDocumentReview';
import { useQuestionnaireAnswerDrop } from './questionnaireAnswerDrag';

type ContractDraftBodyProps = {
  document?: StyledDocument;
  segments: DocumentSegment[];
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  readOnly: boolean;
  acceptAnswerDrop?: boolean;
};

export function ContractDraftBody({
  document,
  segments,
  values,
  onValueChange,
  readOnly,
  acceptAnswerDrop = false,
}: ContractDraftBodyProps) {
  const canDrop = acceptAnswerDrop && !readOnly;
  if (document)
    return (
      <StyledDocumentReview
        document={document}
        values={values}
        onValueChange={onValueChange}
        readOnly={readOnly}
      />
    );

  return (
    <div className="min-h-80 flex-1 overflow-auto rounded-lg border border-border p-4 text-sm leading-8 whitespace-pre-wrap">
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.text}</span>;
        }

        return (
          <ContractValue
            key={`${segment.key}-${index}`}
            label={segment.label}
            value={values[segment.key] ?? ''}
            readOnly={readOnly}
            canDrop={canDrop}
            onChange={(value) => onValueChange(segment.key, value)}
          />
        );
      })}
    </div>
  );
}

function ContractValue({
  label,
  value,
  readOnly,
  canDrop,
  onChange,
}: {
  label: string;
  value: string;
  readOnly: boolean;
  canDrop: boolean;
  onChange: (value: string) => void;
}) {
  const answerDrop = useQuestionnaireAnswerDrop<HTMLInputElement>(
    canDrop,
    onChange
  );
  return (
    <input
      {...answerDrop}
      aria-label={label}
      placeholder={label}
      value={value}
      size={Math.max(label.length, value.length, 8)}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        'mx-0.5 inline-block border-b border-foreground bg-transparent px-1 text-center outline-none placeholder:text-muted-foreground read-only:text-foreground',
        answerDrop.className
      )}
    />
  );
}
