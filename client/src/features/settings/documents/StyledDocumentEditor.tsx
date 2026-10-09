import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Extension, Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, FontFamily, Color } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentFieldNode } from './DocumentFieldNode';
import { DocumentValuesContext } from './DocumentValuesContext';
import type { StyledDocument } from './styledDocument';
import {
  getDraggedContractInput,
  setDraggedContractInput,
} from './contractBodyDom';

const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  parseHTML: () => [{ tag: 'div[data-page-break]' }],
  renderHTML: () => ['div', { 'data-page-break': '' }],
});
const Layout = Extension.create({
  name: 'documentLayout',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => parseFloat(el.style.fontSize) || null,
            renderHTML: (attrs) =>
              attrs.fontSize
                ? { style: 'font-size:' + attrs.fontSize + 'pt' }
                : {},
          },
        },
      },
      {
        types: ['paragraph', 'heading'],
        attributes: Object.fromEntries(
          ['fontSize', 'marginTop', 'marginBottom', 'lineHeight'].map((key) => [
            key,
            {
              default: null,
              renderHTML: (attrs: Record<string, unknown>) =>
                attrs[key] == null
                  ? {}
                  : {
                      style:
                        key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()) +
                        ':' +
                        attrs[key] +
                        (key === 'lineHeight' ? '' : 'pt'),
                    },
            },
          ])
        ),
      },
    ];
  },
});
type StyledDocumentEditorProps = {
  document: StyledDocument;
  onChange?: (document: StyledDocument) => void;
  values?: Record<string, string>;
  onValueChange?: (key: string, value: string) => void;
  master?: boolean;
  readOnly?: boolean;
  section?: 'content' | 'header' | 'footer';
};

export function StyledDocumentEditor({
  document,
  onChange,
  values = {},
  onValueChange = () => undefined,
  master = false,
  readOnly = false,
  section = 'content',
}: StyledDocumentEditorProps) {
  const latest = useRef({ document, onChange, section, master, readOnly });
  useLayoutEffect(() => {
    latest.current = { document, onChange, section, master, readOnly };
  }, [document, onChange, section, master, readOnly]);
  const [label, setLabel] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'date' | 'checkbox'>(
    'text'
  );
  const [required, setRequired] = useState(true);
  const lastPublished = useRef('');
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      TextStyle,
      FontFamily,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TableKit,
      Image.configure({ allowBase64: true }),
      DocumentFieldNode,
      PageBreak,
      Layout,
    ],
    content: document[section],
    editable: master && !readOnly,
    onUpdate: ({ editor }) => {
      const next = editor.getJSON();
      lastPublished.current = JSON.stringify(next);
      latest.current.onChange?.({
        ...latest.current.document,
        [latest.current.section]: next,
      });
    },
    editorProps: {
      handleDrop: (view, event) => {
        let dragged = getDraggedContractInput();
        const payload = event.dataTransfer?.getData('application/x-bsb-field');
        if (payload) {
          try {
            dragged = JSON.parse(payload);
          } catch {
            return false;
          }
        }
        if (
          !dragged ||
          !latest.current.onChange ||
          !latest.current.master ||
          latest.current.readOnly
        )
          return false;
        const pos = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        if (!pos) return false;
        view.dispatch(
          view.state.tr.insert(
            pos.pos,
            view.state.schema.nodes.documentField.create({
              key: dragged.key,
              label: dragged.label,
              fieldType:
                (dragged as { fieldType?: string }).fieldType ?? 'text',
              required:
                (dragged as { required?: boolean }).required ??
                (dragged as { fieldType?: string }).fieldType !== 'checkbox',
            })
          )
        );
        setDraggedContractInput(null);
        return true;
      },
    },
  });
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(master && !readOnly);
    const json = JSON.stringify(document[section]);
    if (
      json !== lastPublished.current &&
      JSON.stringify(editor.getJSON()) !== json
    )
      editor.commands.setContent(document[section], { emitUpdate: false });
  }, [editor, document, section, master, readOnly]);
  if (!editor) return null;
  const insertField = () => {
    const slug =
      label
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'feld';
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'documentField',
        attrs: {
          key: fieldKey.trim() || 'contract.' + slug,
          label: label.trim(),
          fieldType,
          required,
        },
      })
      .run();
    setLabel('');
    setFieldKey('');
  };
  const actions: [string, () => void][] = [
    [
      'Fett',
      () => {
        editor.chain().focus().toggleBold().run();
      },
    ],
    [
      'Kursiv',
      () => {
        editor.chain().focus().toggleItalic().run();
      },
    ],
    [
      'Unterstrichen',
      () => {
        editor.chain().focus().toggleUnderline().run();
      },
    ],
    [
      'Liste',
      () => {
        editor.chain().focus().toggleBulletList().run();
      },
    ],
    [
      'Nummeriert',
      () => {
        editor.chain().focus().toggleOrderedList().run();
      },
    ],
    [
      'Tabelle',
      () => {
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 2, withHeaderRow: true })
          .run();
      },
    ],
    [
      'Seitenumbruch',
      () => {
        editor.chain().focus().insertContent({ type: 'pageBreak' }).run();
      },
    ],
    [
      'Zeile +',
      () => {
        editor.chain().focus().addRowAfter().run();
      },
    ],
    [
      'Spalte +',
      () => {
        editor.chain().focus().addColumnAfter().run();
      },
    ],
    [
      'Zeile entfernen',
      () => {
        editor.chain().focus().deleteRow().run();
      },
    ],
    [
      'Spalte entfernen',
      () => {
        editor.chain().focus().deleteColumn().run();
      },
    ],
    [
      'Tabelle entfernen',
      () => {
        editor.chain().focus().deleteTable().run();
      },
    ],
    [
      'Rückgängig',
      () => {
        editor.chain().focus().undo().run();
      },
    ],
  ];
  return (
    <DocumentValuesContext.Provider
      value={{ master, readOnly, values, onValueChange }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        {master && !readOnly ? (
          <div className="flex flex-wrap items-center gap-1 rounded border p-2">
            {actions.map(([text, action]) => (
              <Button
                key={text}
                type="button"
                variant="outline"
                size="sm"
                onClick={action}
              >
                {text}
              </Button>
            ))}
            <select
              aria-label="Schriftart"
              onChange={(e) =>
                editor.chain().focus().setFontFamily(e.target.value).run()
              }
              defaultValue="Calibri"
            >
              {[
                'Calibri',
                'Arial',
                'Helvetica',
                'Times New Roman',
                'Symbol',
                'Apple Symbols',
                'Wingdings',
              ].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
            <input
              aria-label="Schriftgröße"
              type="number"
              min={4}
              max={72}
              defaultValue={11}
              className="w-14 border"
              onChange={(e) =>
                editor
                  .chain()
                  .focus()
                  .setMark('textStyle', { fontSize: Number(e.target.value) })
                  .run()
              }
            />
            <select
              aria-label="Absatzformat"
              defaultValue="0"
              onChange={(e) => {
                const level = Number(e.target.value);
                if (!level) editor.chain().focus().setParagraph().run();
                else
                  editor
                    .chain()
                    .focus()
                    .setHeading({ level: level as 1 | 2 | 3 })
                    .run();
              }}
            >
              <option value="0">Absatz</option>
              <option value="1">Überschrift 1</option>
              <option value="2">Überschrift 2</option>
              <option value="3">Überschrift 3</option>
            </select>
            <select
              aria-label="Ausrichtung"
              defaultValue="left"
              onChange={(e) =>
                editor.chain().focus().setTextAlign(e.target.value).run()
              }
            >
              <option value="left">Links</option>
              <option value="center">Zentriert</option>
              <option value="right">Rechts</option>
              <option value="justify">Blocksatz</option>
            </select>
            <input
              type="number"
              aria-label="Absatzabstand"
              min={0}
              max={100}
              defaultValue={8}
              className="w-14 border"
              onChange={(e) =>
                editor
                  .chain()
                  .focus()
                  .updateAttributes('paragraph', {
                    marginBottom: Number(e.target.value),
                  })
                  .run()
              }
            />
            <input
              type="number"
              aria-label="Zeilenabstand"
              min={1}
              max={3}
              step={0.1}
              defaultValue={1.2}
              className="w-14 border"
              onChange={(e) =>
                editor
                  .chain()
                  .focus()
                  .updateAttributes('paragraph', {
                    lineHeight: Number(e.target.value),
                  })
                  .run()
              }
            />
            <label className="cursor-pointer text-sm underline">
              Bild hinzufügen
              <input
                className="hidden"
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || file.size > 1_000_000) return;
                  const reader = new FileReader();
                  reader.onload = () =>
                    editor
                      .chain()
                      .focus()
                      .setImage({ src: String(reader.result) })
                      .run();
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            <Input
              aria-label="Feldbezeichnung"
              placeholder="Vorname, Nachname …"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-44"
              maxLength={120}
            />
            <Input
              aria-label="Feldschlüssel"
              placeholder="Schlüssel (automatisch)"
              value={fieldKey}
              onChange={(e) =>
                setFieldKey(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '')
                )
              }
              className="w-44"
              maxLength={120}
              title="Gleicher Schlüssel = gemeinsamer Wert. Ein neuer Schlüssel erzeugt ein unabhängiges Feld."
            />
            <select
              aria-label="Feldtyp"
              value={fieldType}
              onChange={(e) => {
                setFieldType(e.target.value as typeof fieldType);
                setRequired(e.target.value !== 'checkbox');
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
                onChange={(e) => setRequired(e.target.checked)}
              />{' '}
              {fieldType === 'checkbox'
                ? 'Muss angekreuzt sein'
                : 'Pflichtfeld'}
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
                onDragStart={(event) => {
                  const slug =
                    label
                      .trim()
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '_')
                      .replace(/^_+|_+$/g, '') || 'feld';
                  event.dataTransfer.setData(
                    'application/x-bsb-field',
                    JSON.stringify({
                      key: fieldKey.trim() || 'contract.' + slug,
                      label: label.trim(),
                      fieldType,
                      required,
                    })
                  );
                  event.dataTransfer.effectAllowed = 'copy';
                }}
              >
                Feld ins Dokument ziehen: {label}
              </span>
            ) : null}
          </div>
        ) : null}
        <div
          className="styled-document flex-1 overflow-auto rounded border p-5"
          style={{
            fontFamily: document.page.fontFamily,
            fontSize: document.page.fontSize + 'pt',
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </DocumentValuesContext.Provider>
  );
}
