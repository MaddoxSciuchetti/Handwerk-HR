import { X } from 'lucide-react';

export function DocumentFieldRemove({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      contentEditable={false}
      aria-label={`${label} entfernen`}
      title={`${label} entfernen`}
      className="document-field-remove absolute top-0 right-0 inline-flex size-4 items-center justify-center rounded bg-white text-slate-600 opacity-0 group-hover/document-field:opacity-100 group-focus-within/document-field:opacity-100 hover:bg-red-100 hover:text-red-700 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-blue-600 [@media(hover:none)]:opacity-100"
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onRemove();
      }}
    >
      <X className="size-3" aria-hidden="true" />
    </button>
  );
}
