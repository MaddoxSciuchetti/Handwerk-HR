import { useState, type DragEvent } from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { contractFieldKey } from '../util/fieldKey.util';
import { FIELD_DRAG_TYPE } from '../consts/editor.consts';

type FieldType = 'text' | 'date' | 'checkbox';

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
        className="w-44"
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
        className="w-44"
        maxLength={120}
        title="Gleicher Schlüssel = gemeinsamer Wert. Ein neuer Schlüssel erzeugt ein unabhängiges Feld."
      />
      <select
        aria-label="Feldtyp"
        value={fieldType}
        onChange={(event) => {
          const next = event.target.value as FieldType;
          setFieldType(next);
          setRequired(next !== 'checkbox');
        }}
      >
        <option value="text">Text</option>
        <option value="date">Datum</option>
        <option value="checkbox">Kontrollkästchen</option>
      </select>
      <label className="text-sm">
        <input
          type="checkbox"
          checked={required}
          onChange={(event) => setRequired(event.target.checked)}
        />{' '}
        {fieldType === 'checkbox' ? 'Muss angekreuzt sein' : 'Pflichtfeld'}
      </label>
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
          className="cursor-grab rounded border px-2 py-1 text-sm"
          onDragStart={startFieldDrag}
        >
          Feld ins Dokument ziehen: {label}
        </span>
      ) : null}
    </>
  );
}
