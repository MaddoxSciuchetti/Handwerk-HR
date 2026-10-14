import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';

type DocumentEditorCornerProps = {
  expanded: boolean;
  onToggleExpanded: () => void;
  showOriginalToggle?: boolean;
  showOriginal?: boolean;
  onToggleOriginal?: () => void;
};

export function DocumentEditorCorner({
  expanded,
  onToggleExpanded,
  showOriginalToggle = false,
  showOriginal = false,
  onToggleOriginal,
}: DocumentEditorCornerProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
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
        size="icon-sm"
        aria-label={expanded ? 'Ansicht verkleinern' : 'Ansicht verbreitern'}
        onClick={onToggleExpanded}
      >
        {expanded ? <Minimize2 /> : <Maximize2 />}
      </Button>
    </div>
  );
}
