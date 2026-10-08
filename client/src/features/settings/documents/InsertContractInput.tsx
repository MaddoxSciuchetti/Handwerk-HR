import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import {
  CONTRACT_INPUT_DRAG_TYPE,
  setDraggedContractInput,
} from './contractBodyDom';

type ContractPill = {
  key: string;
  label: string;
};

function keyFromLabel(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '_')
    .replaceAll(/^_+|_+$/g, '');
  return slug.length > 0 ? `contract.${slug}` : 'contract.feld';
}

export function InsertContractInput() {
  const [customLabel, setCustomLabel] = useState('');
  const [pills, setPills] = useState<ContractPill[]>([]);

  const createPill = () => {
    const label = customLabel.trim();
    if (label.length === 0) return;
    const key = keyFromLabel(label);
    setPills((current) =>
      current.some((pill) => pill.key === key)
        ? current
        : [...current, { key, label }]
    );
    setCustomLabel('');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          id="custom-input-label"
          value={customLabel}
          maxLength={120}
          onChange={(event) => setCustomLabel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            createPill();
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={customLabel.trim().length === 0}
          onClick={createPill}
        >
          Erstellen
        </Button>
      </div>
      {pills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {pills.map((pill) => (
            <span
              key={pill.key}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs"
            >
              <span
                draggable
                onDragStart={(event) => {
                  const payload = JSON.stringify(pill);
                  setDraggedContractInput({ ...pill, source: null });
                  event.dataTransfer.setData(CONTRACT_INPUT_DRAG_TYPE, payload);
                  event.dataTransfer.setData('text/plain', payload);
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                onDragEnd={() => {
                  queueMicrotask(() => setDraggedContractInput(null));
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                {pill.label}
              </span>
              <button
                type="button"
                className="text-muted-foreground"
                aria-label={`${pill.label} entfernen`}
                onClick={() =>
                  setPills((current) =>
                    current.filter((item) => item.key !== pill.key)
                  )
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
