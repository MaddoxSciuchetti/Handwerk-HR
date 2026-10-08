import { useState } from 'react';
import type { DocumentSegment } from './documentSegments';

type ContractPreviewProps = {
  segments: DocumentSegment[];
};

export function ContractPreview({ segments }: ContractPreviewProps) {
  const [values, setValues] = useState<Record<string, string>>({});

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
            onChange={(event) => {
              const next = event.target.value;
              setValues((current) => ({ ...current, [segment.key]: next }));
            }}
            className="mx-0.5 inline-block border-b border-foreground bg-transparent px-1 text-center outline-none placeholder:text-muted-foreground"
          />
        );
      })}
    </div>
  );
}
