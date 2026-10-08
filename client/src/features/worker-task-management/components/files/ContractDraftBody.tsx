import type { DocumentSegment } from '@/features/settings/documents/documentSegments';

type ContractDraftBodyProps = {
  segments: DocumentSegment[];
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  readOnly: boolean;
};

export function ContractDraftBody({
  segments,
  values,
  onValueChange,
  readOnly,
}: ContractDraftBodyProps) {
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
            className="mx-0.5 inline-block border-b border-foreground bg-transparent px-1 text-center outline-none placeholder:text-muted-foreground read-only:text-foreground"
          />
        );
      })}
    </div>
  );
}
