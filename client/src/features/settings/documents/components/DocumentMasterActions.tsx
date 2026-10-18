import { Button } from '@/components/ui/button';

type DocumentMasterActionsProps = {
  pending: boolean;
  onSave: () => void;
  onPreview: () => void;
};

export function DocumentMasterActions({ pending, onSave, onPreview }: DocumentMasterActionsProps) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <Button type="button" variant="outline" className="rounded-2xl" onClick={onPreview}>
        Vorschau
      </Button>
      <Button type="button" className="rounded-2xl" disabled={pending} onClick={onSave}>
        {pending ? 'Speichert…' : 'Speichern'}
      </Button>
    </div>
  );
}
