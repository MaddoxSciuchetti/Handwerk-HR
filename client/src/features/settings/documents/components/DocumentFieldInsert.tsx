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
import { contractFieldKey, unusedFieldKey } from '../util/fieldKey.util';
import { insertDocumentField } from '../util/insertDocumentField.util';
import { FIELD_DRAG_TYPE } from '../consts/editor.consts';

type FieldType = 'text' | 'date' | 'checkbox' | 'points';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Datum' },
  { value: 'checkbox', label: 'Kontrollkästchen' },
  { value: 'points', label: 'Beschreibungspunkte' },
] as const;

function usedFieldKeys(editor: Editor) {
  const keys: string[] = [];
  editor.state.doc.descendants((node) => {
    const key = node.attrs?.key;
    if (typeof key === 'string' && key) keys.push(key);
  });
  return keys;
}

type DocumentFieldInsertProps = {
  editor: Editor;
};

export function DocumentFieldInsert({ editor }: DocumentFieldInsertProps) {
  const [label, setLabel] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('text');
  const [checkboxGlyph, setCheckboxGlyph] = useState('☐');
  const [required, setRequired] = useState(true);
  const nextField = () => {
    const requested = contractFieldKey(label, fieldKey);
    return {
      key: fieldKey.trim()
        ? requested
        : unusedFieldKey(usedFieldKeys(editor), requested),
      label: label.trim(),
      fieldType,
      required,
    };
  };
  const insertField = () => {
    const field = nextField();
    if (field.fieldType === 'points') {
      editor
        .chain()
        .focus()
        .insertContent({ type: 'descriptionPoints', attrs: field })
        .run();
    } else {
      insertDocumentField(editor, { ...field, checkboxGlyph });
    }
    setLabel('');
    setFieldKey('');
  };
  const startFieldDrag = (event: DragEvent<HTMLSpanElement>) => {
    event.dataTransfer.setData(
      FIELD_DRAG_TYPE,
      JSON.stringify({
        ...nextField(),
        ...(fieldType === 'checkbox' ? { checkboxGlyph } : {}),
      })
    );
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <>
      <Input
        aria-label="Feldbezeichnung"
        placeholder={
          fieldType === 'points' ? 'Tätigkeiten, Aufgaben …' : 'Vorname, Nachname …'
        }
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
      {fieldType === 'checkbox' ? (
        <>
          <Select value={checkboxGlyph} onValueChange={setCheckboxGlyph}>
            <SelectTrigger aria-label="Kästchenform" size="sm" className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="☐">☐</SelectItem>
              <SelectItem value="□">□</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            Vorhandenes Kästchen markieren und ersetzen, oder neues einsetzen.
            Schlüssel: {contractFieldKey(label, fieldKey) || '…'} · true =
            angekreuzt, false = leer
          </span>
        </>
      ) : null}
      <Label className="h-7 gap-1.5 px-1 text-xs font-normal">
        <input
          type="checkbox"
          className="size-3.5 accent-primary"
          checked={required}
          onChange={(event) => setRequired(event.target.checked)}
        />
        {fieldType === 'checkbox'
          ? 'Muss angekreuzt sein'
          : fieldType === 'points'
            ? 'Mindestens ein Punkt'
            : 'Pflichtfeld'}
      </Label>
      <Button
        type="button"
        size="sm"
        onClick={insertField}
        disabled={!label.trim()}
      >
        {fieldType === 'points' ? 'Punkteblock einsetzen' : 'Feld einsetzen'}
      </Button>
      {label.trim() ? (
        <span
          draggable
          className="inline-flex h-7 cursor-grab items-center rounded-lg border bg-background px-2 text-xs"
          onDragStart={startFieldDrag}
        >
          {fieldType === 'points' ? 'Block' : 'Feld'} ins Dokument ziehen: {label}
        </span>
      ) : null}
    </>
  );
}
