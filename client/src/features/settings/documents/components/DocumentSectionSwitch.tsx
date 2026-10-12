import { Button } from '@/components/ui/button';

const DOCUMENT_SECTIONS = [
  { id: 'content', label: 'Dokument' },
  { id: 'header', label: 'Kopfzeile' },
  { id: 'footer', label: 'Fußzeile' },
] as const;

type DocumentSection = (typeof DOCUMENT_SECTIONS)[number]['id'];

type DocumentSectionSwitchProps = {
  section: DocumentSection;
  onSectionChange: (section: DocumentSection) => void;
  showOriginalToggle: boolean;
  showOriginal: boolean;
  onToggleOriginal: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
};

export function DocumentSectionSwitch({
  section,
  onSectionChange,
  showOriginalToggle,
  showOriginal,
  onToggleOriginal,
  expanded,
  onToggleExpanded,
}: DocumentSectionSwitchProps) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {DOCUMENT_SECTIONS.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant={section === item.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSectionChange(item.id)}
        >
          {item.label}
        </Button>
      ))}
      {showOriginalToggle ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleOriginal}
        >
          {showOriginal ? 'Original ausblenden' : 'Original vergleichen'}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onToggleExpanded}
      >
        {expanded ? 'Großansicht schließen' : 'Großansicht'}
      </Button>
    </div>
  );
}
