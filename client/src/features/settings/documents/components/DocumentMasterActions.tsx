import { Button } from '@/components/ui/button';

type DocumentMasterActionsProps = {
  editing: boolean;
  pending: boolean;
  onSave: (approved: boolean) => void;
  onCancel: () => void;
  onEdit: () => void;
};

export function DocumentMasterActions({
  editing,
  pending,
  onSave,
  onCancel,
  onEdit,
}: DocumentMasterActionsProps) {
  if (!editing) {
    return (
      <div className="flex gap-2">
        <Button type="button" onClick={onEdit}>
          Bearbeiten
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button type="button" disabled={pending} onClick={() => onSave(false)}>
        {pending ? 'Speichert…' : 'Speichern'}
      </Button>
      <Button type="button" disabled={pending} onClick={() => onSave(true)}>
        Speichern und Vorlage freigeben
      </Button>
      <Button type="button" variant="outline" onClick={onCancel}>
        Abbrechen
      </Button>
    </div>
  );
}
