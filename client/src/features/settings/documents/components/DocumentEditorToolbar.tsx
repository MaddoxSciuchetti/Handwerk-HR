import { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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
  inTable: boolean;
};

type DocumentEditorToolbarProps = {
  editor: Editor;
  toolbar: EditorToolbarState;
};

const ALIGNMENTS = [
  { value: 'left', label: 'Links' },
  { value: 'center', label: 'Zentriert' },
  { value: 'right', label: 'Rechts' },
  { value: 'justify', label: 'Blocksatz' },
] as const;

const BLOCK_STYLES = [
  { value: '0', label: 'Absatz' },
  { value: '1', label: 'Überschrift 1' },
  { value: '2', label: 'Überschrift 2' },
  { value: '3', label: 'Überschrift 3' },
] as const;

function ToolbarSelect({
  label,
  value,
  onValueChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label={label} size="sm" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DocumentEditorToolbar({
  editor,
  toolbar,
}: DocumentEditorToolbarProps) {
  const actions = documentEditorActions(editor);
  const imageInput = useRef<HTMLInputElement>(null);
  const [blockStyle, setBlockStyle] = useState('0');
  const fontFamilies = (EDITOR_FONT_FAMILIES as readonly string[]).includes(
    toolbar.fontFamily
  )
    ? EDITOR_FONT_FAMILIES
    : [toolbar.fontFamily, ...EDITOR_FONT_FAMILIES];
  const alignment = ALIGNMENTS.some((item) => item.value === toolbar.alignment)
    ? toolbar.alignment
    : 'left';
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
      {actions
        .filter((action) => !action.tableOnly || toolbar.inTable)
        .map((action) => (
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
        <Input
          aria-label="Nummerierungsbeginn"
          type="number"
          min={ORDERED_LIST_START_MIN}
          max={ORDERED_LIST_START_MAX}
          value={toolbar.orderedListStart}
          className="h-7 w-16 px-2"
          onChange={(event) => setOrderedListStart(event.target.value)}
        />
      ) : null}
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarSelect
        label="Schriftart"
        value={toolbar.fontFamily}
        className="w-36"
        options={fontFamilies.map((family) => ({
          value: family,
          label: family,
        }))}
        onValueChange={(value) =>
          editor.chain().focus().setFontFamily(value).run()
        }
      />
      <Input
        aria-label="Schriftgröße"
        type="number"
        min={MIN_FONT_PT}
        max={MAX_FONT_PT}
        value={toolbar.fontSize}
        className="h-7 w-16 px-2"
        onChange={(event) =>
          editor
            .chain()
            .focus()
            .setMark('textStyle', { fontSize: Number(event.target.value) })
            .run()
        }
      />
      <ToolbarSelect
        label="Absatzformat"
        value={blockStyle}
        className="w-36"
        options={BLOCK_STYLES}
        onValueChange={(value) => {
          setBlockStyle(value);
          const level = Number(value);
          if (!level) editor.chain().focus().setParagraph().run();
          else
            editor
              .chain()
              .focus()
              .setHeading({ level: level as 1 | 2 | 3 })
              .run();
        }}
      />
      <ToolbarSelect
        label="Ausrichtung"
        value={alignment}
        className="w-32"
        options={ALIGNMENTS}
        onValueChange={(value) =>
          editor.chain().focus().setTextAlign(value).run()
        }
      />
      <Input
        type="number"
        aria-label="Absatzabstand"
        min={MIN_PARAGRAPH_MARGIN_PT}
        max={MAX_PARAGRAPH_MARGIN_PT}
        defaultValue={DEFAULT_PARAGRAPH_MARGIN_PT}
        className="h-7 w-16 px-2"
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
      <Input
        type="number"
        aria-label="Zeilenabstand"
        min={MIN_LINE_HEIGHT}
        max={MAX_LINE_HEIGHT}
        step={LINE_HEIGHT_STEP}
        defaultValue={DEFAULT_LINE_HEIGHT}
        className="h-7 w-16 px-2"
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => imageInput.current?.click()}
      >
        Bild hinzufügen
      </Button>
      <input
        ref={imageInput}
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
    </>
  );
}
