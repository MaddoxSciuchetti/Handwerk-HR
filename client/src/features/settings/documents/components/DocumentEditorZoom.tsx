import { EDITOR_ZOOM_LEVELS } from '../consts/editor.consts';

type DocumentEditorZoomProps = {
  zoom: number;
  onZoomChange: (zoom: number) => void;
};

export function DocumentEditorZoom({
  zoom,
  onZoomChange,
}: DocumentEditorZoomProps) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-2 text-sm">
      <select
        aria-label="Dokumentzoom"
        value={zoom}
        onChange={(event) => onZoomChange(Number(event.target.value))}
        className="rounded border p-1"
      >
        {EDITOR_ZOOM_LEVELS.map((value) => (
          <option key={value} value={value}>
            {value}%
          </option>
        ))}
      </select>
    </div>
  );
}
