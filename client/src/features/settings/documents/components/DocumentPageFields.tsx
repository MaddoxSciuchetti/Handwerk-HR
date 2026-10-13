import type { StyledDocument } from '../styledDocument';

const PAGE_FIELDS = [
  { key: 'width', label: 'Breite' },
  { key: 'height', label: 'Höhe' },
  { key: 'marginTop', label: 'Rand oben' },
  { key: 'marginBottom', label: 'Rand unten' },
  { key: 'marginLeft', label: 'Rand links' },
  { key: 'marginRight', label: 'Rand rechts' },
] as const;

type PageFieldKey = (typeof PAGE_FIELDS)[number]['key'];

type DocumentPageFieldsProps = {
  page: StyledDocument['page'];
  onChange: (key: PageFieldKey, value: number) => void;
};

export function DocumentPageFields({
  page,
  onChange,
}: DocumentPageFieldsProps) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {PAGE_FIELDS.map((field) => (
        <label key={field.key}>
          {field.label} (mm)
          <input
            aria-label={field.key}
            type="number"
            min={0}
            max={700}
            className="ml-1 w-16 rounded border p-1"
            value={page[field.key]}
            onChange={(event) =>
              onChange(field.key, Number(event.target.value))
            }
          />
        </label>
      ))}
    </div>
  );
}
