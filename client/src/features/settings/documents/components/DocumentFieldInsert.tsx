import { useState, type DragEvent } from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { contractFieldKey } from '../util/fieldKey.util';
import { FIELD_DRAG_TYPE } from '../consts/editor.consts';

type FieldType = 'text' | 'date' | 'checkbox';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Datum' },
  { value: 'checkbox', label: 'Kontrollkästchen' },
] as const;

type DocumentFieldInsertProps = {
  editor: Editor;
};

export function DocumentFieldInsert({ editor }: DocumentFieldInsertProps) {
  const [label, setLabel] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('text');
  const [required, setRequired] = useState(true);
  const insertField = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'documentField',
        attrs: {
          key: contractFieldKey(label, fieldKey),
          label: label.trim(),
          fieldType,
          required,
        },
      })
      .run();
    setLabel('');
    setFieldKey('');
  };
  const startFieldDrag = (event: DragEvent<HTMLSpanElement>) => {
    event.dataTransfer.setData(
      FIELD_DRAG_TYPE,
      JSON.stringify({
        key: contractFieldKey(label, fieldKey),
        label: label.trim(),
        fieldType,
        required,
      })
    );
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <>
      <Input
        aria-label="Feldbezeichnung"
        placeholder="Vorname, Nachname …"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        className="h-7 w-44"
        maxLength={120}
      />
      <Input
        aria-label="Feldschlüssel"
        placeholder="Schlüssel (automatisch)"
        value={fieldKey}
        onChange={(event) =>
          setFieldKey(
            event.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '')
          )
        }
        className="h-7 w-44"
        maxLength={120}
        title="Gleicher Schlüssel = gemeinsamer Wert. Ein neuer Schlüssel erzeugt ein unabhängiges Feld."
      />
      <Select
        value={fieldType}
        onValueChange={(value) => {
          const next = value as FieldType;
          setFieldType(next);
          setRequired(next !== 'checkbox');
        }}
      >
        <SelectTrigger aria-label="Feldtyp" size="sm" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FIELD_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Label className="h-7 gap-1.5 px-1 text-xs font-normal">
        <input
          type="checkbox"
          className="size-3.5 accent-primary"
          checked={required}
          onChange={(event) => setRequired(event.target.checked)}
        />
        {fieldType === 'checkbox' ? 'Muss angekreuzt sein' : 'Pflichtfeld'}
      </Label>
      <Button
        type="button"
        size="sm"
        onClick={insertField}
        disabled={!label.trim()}
      >
        Feld einsetzen
      </Button>
      {label.trim() ? (
        <span
          draggable
          className="inline-flex h-7 cursor-grab items-center rounded-lg border bg-background px-2 text-xs"
          onDragStart={startFieldDrag}
        >
          Feld ins Dokument ziehen: {label}
        </span>
      ) : null}
    </>
  );
}
