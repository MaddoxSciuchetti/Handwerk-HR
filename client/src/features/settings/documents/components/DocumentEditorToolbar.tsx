import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_LINE_HEIGHT,
  DEFAULT_PARAGRAPH_MARGIN_PT,
  EDITOR_FONT_FAMILIES,
  LINE_HEIGHT_STEP,
  MAX_EDITOR_IMAGE_BYTES,
  MAX_FONT_PT,
  MAX_LINE_HEIGHT,
  MAX_PARAGRAPH_MARGIN_PT,
  MIN_FONT_PT,
  MIN_LINE_HEIGHT,
  MIN_PARAGRAPH_MARGIN_PT,
  ORDERED_LIST_START_MAX,
  ORDERED_LIST_START_MIN,
} from '../consts/editor.consts';
import { documentEditorActions } from '../util/editorActions';

type EditorToolbarState = {
  fontFamily: string;
  fontSize: number;
  alignment: string;
  orderedListStart: number | null;
};

type DocumentEditorToolbarProps = {
  editor: Editor;
  toolbar: EditorToolbarState;
};

export function DocumentEditorToolbar({
  editor,
  toolbar,
}: DocumentEditorToolbarProps) {
  const actions = documentEditorActions(editor);
  const setOrderedListStart = (value: string) => {
    const start = Number(value);
    if (
      Number.isInteger(start) &&
      start >= ORDERED_LIST_START_MIN &&
      start <= ORDERED_LIST_START_MAX
    )
      editor.chain().focus().updateAttributes('orderedList', { start }).run();
  };

  return (
    <>
      {actions.map((action) => (
        <Button
          key={action.label}
          type="button"
          variant="outline"
          size="sm"
          onMouseDown={(event) => event.preventDefault()}
          onClick={action.run}
        >
          {action.label}
        </Button>
      ))}
      {toolbar.orderedListStart !== null ? (
        <label className="flex items-center gap-1 text-sm">
          Liste beginnt bei
          <input
            aria-label="Nummerierungsbeginn"
            type="number"
            min={ORDERED_LIST_START_MIN}
            max={ORDERED_LIST_START_MAX}
            value={toolbar.orderedListStart}
            className="w-16 border"
            onChange={(event) => setOrderedListStart(event.target.value)}
          />
        </label>
      ) : null}
      <select
        aria-label="Schriftart"
        onChange={(event) =>
          editor.chain().focus().setFontFamily(event.target.value).run()
        }
        value={toolbar.fontFamily}
      >
        {EDITOR_FONT_FAMILIES.map((family) => (
          <option key={family}>{family}</option>
        ))}
      </select>
      <input
        aria-label="Schriftgröße"
        type="number"
        min={MIN_FONT_PT}
        max={MAX_FONT_PT}
        value={toolbar.fontSize}
        className="w-14 border"
        onChange={(event) =>
          editor
            .chain()
            .focus()
            .setMark('textStyle', { fontSize: Number(event.target.value) })
            .run()
        }
      />
      <select
        aria-label="Absatzformat"
        defaultValue="0"
        onChange={(event) => {
          const level = Number(event.target.value);
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
        value={toolbar.alignment}
        onChange={(event) =>
          editor.chain().focus().setTextAlign(event.target.value).run()
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
        min={MIN_PARAGRAPH_MARGIN_PT}
        max={MAX_PARAGRAPH_MARGIN_PT}
        defaultValue={DEFAULT_PARAGRAPH_MARGIN_PT}
        className="w-14 border"
        onChange={(event) =>
          editor
            .chain()
            .focus()
            .updateAttributes('paragraph', {
              marginBottom: Number(event.target.value),
            })
            .run()
        }
      />
      <input
        type="number"
        aria-label="Zeilenabstand"
        min={MIN_LINE_HEIGHT}
        max={MAX_LINE_HEIGHT}
        step={LINE_HEIGHT_STEP}
        defaultValue={DEFAULT_LINE_HEIGHT}
        className="w-14 border"
        onChange={(event) =>
          editor
            .chain()
            .focus()
            .updateAttributes('paragraph', {
              lineHeight: Number(event.target.value),
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
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file || file.size > MAX_EDITOR_IMAGE_BYTES) return;
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
    </>
  );
}
