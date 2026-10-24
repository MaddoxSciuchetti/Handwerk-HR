import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { useEditorState, type Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { contractFieldKey, unusedFieldKey } from '../util/fieldKey.util';
import {
  insertDocumentField,
  selectedDocumentCheckbox,
} from '../util/insertDocumentField.util';
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
  const [fieldKey, setFieldKey] = useState<string | null>(null);
  const [fieldType, setFieldType] = useState<FieldType>('text');
  const [checkboxGlyph, setCheckboxGlyph] = useState<string>();
  const labelInput = useRef<HTMLInputElement>(null);
  const selectedCheckbox = useEditorState({
    editor,
    selector: ({ editor: current }) => selectedDocumentCheckbox(current),
  });
  const selectedGlyph = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const { from, to } = current.state.selection;
      const text = current.state.doc.textBetween(from, to);
      return /^[☐☑☒□]$/.test(text) ? text : undefined;
    },
  });
  const [useToday, setUseToday] = useState(false);
  const canInsert = Boolean(
    label.trim() ||
    (fieldType === 'checkbox' && (selectedCheckbox || selectedGlyph))
  );
  const suggestedFieldKey = label.trim()
    ? fieldType === 'checkbox' && selectedCheckbox
      ? String(selectedCheckbox.attrs.key)
      : unusedFieldKey(usedFieldKeys(editor), contractFieldKey(label, ''))
    : '';
  const nextField = () => {
    const nextLabel =
      label.trim() ||
      (fieldType === 'checkbox' && selectedGlyph ? 'Kontrollkästchen' : '');
    const requested = contractFieldKey(nextLabel, fieldKey ?? '');
    return {
      key: fieldKey?.trim()
        ? requested
        : unusedFieldKey(usedFieldKeys(editor), requested),
      label: nextLabel,
      fieldType,
      required: fieldType !== 'checkbox',
      dateMode: fieldType === 'date' && useToday ? ('today' as const) : null,
    };
  };
  const insertField = () => {
    if (fieldType === 'checkbox' && selectedCheckbox) {
      insertDocumentField(editor, {
        ...nextField(),
        ...selectedCheckbox.attrs,
        label: label.trim() || String(selectedCheckbox.attrs.label),
        key: fieldKey?.trim()
          ? contractFieldKey(label, fieldKey)
          : String(selectedCheckbox.attrs.key),
        fieldType: 'checkbox',
        checkboxGlyph,
      });
      setLabel('');
      setFieldKey(null);
      return;
    }
    if (!canInsert) return;
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
    setFieldKey(null);
  };
  const insertOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    event.preventDefault();
    insertField();
  };
  const startFieldDrag = (event: DragEvent<HTMLSpanElement>) => {
    event.dataTransfer.setData(
      FIELD_DRAG_TYPE,
      JSON.stringify({
        ...nextField(),
        ...(fieldType === 'checkbox'
          ? { checkboxGlyph: checkboxGlyph ?? '☐' }
          : {}),
      })
    );
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="space-y-2 border-t pt-2">
      <div className="flex min-w-0 flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Feldbezeichnung
          <Input
            ref={labelInput}
            aria-label="Feldbezeichnung"
            placeholder={
              fieldType === 'points'
                ? 'Tätigkeiten, Aufgaben …'
                : 'z. B. Vorname'
            }
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            onKeyDown={insertOnEnter}
            className="h-7 w-44"
            maxLength={120}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Feldtyp
          <Select
            value={fieldType}
            onValueChange={(value) => setFieldType(value as FieldType)}
          >
            <SelectTrigger aria-label="Feldtyp" size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                labelInput.current?.focus();
              }}
            >
              {FIELD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Feldverknüpfung (optional)
          <Input
            aria-label="Feldverknüpfung (optional)"
            placeholder="Schlüssel (automatisch)"
            value={fieldKey ?? suggestedFieldKey}
            onKeyDown={insertOnEnter}
            onChange={(event) =>
              setFieldKey(
                event.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '')
              )
            }
            onBlur={() => {
              if (!fieldKey?.trim()) setFieldKey(null);
            }}
            className="h-7 w-44"
            maxLength={120}
            title="Gleicher Schlüssel = gemeinsamer Wert. Ein neuer Schlüssel erzeugt ein unabhängiges Feld."
          />
        </label>
        {fieldType === 'date' ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useToday}
              onChange={(event) => setUseToday(event.target.checked)}
            />
            Immer aktuelles Datum verwenden
          </label>
        ) : null}
        {fieldType === 'checkbox' ? (
          <>
            <Select
              value={
                checkboxGlyph ??
                selectedCheckbox?.attrs.checkboxGlyph ??
                selectedGlyph ??
                '☐'
              }
              onValueChange={setCheckboxGlyph}
            >
              <SelectTrigger
                aria-label="Kästchenform"
                size="sm"
                className="w-16"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  labelInput.current?.focus();
                }}
              >
                <SelectItem value="☐">☐</SelectItem>
                <SelectItem value="□">□</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              Vorhandenes Kästchen markieren und ersetzen, oder neues einsetzen.
              Schlüssel: {contractFieldKey(label, fieldKey ?? '') || '…'} · true
              = angekreuzt, false = leer
            </span>
          </>
        ) : null}
        <Button
          type="button"
          size="sm"
          onClick={insertField}
          disabled={!canInsert}
        >
          {fieldType === 'points' ? 'Punkteblock einsetzen' : 'Feld einsetzen'}
        </Button>
        {label.trim() ? (
          <span
            draggable
            className="inline-flex h-7 min-w-0 max-w-full cursor-grab items-center gap-1 rounded-lg border bg-background px-2 text-xs sm:max-w-64"
            title={`${fieldType === 'points' ? 'Block' : 'Feld'} ziehen: ${label.trim()}`}
            onDragStart={startFieldDrag}
          >
            <span className="shrink-0">
              {fieldType === 'points' ? 'Block' : 'Feld'} ziehen:
            </span>
            <span className="min-w-0 truncate">{label.trim()}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
