import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type CreateIssueModalProps = {
  handleAddItem: (e: React.FormEvent) => void;
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  setAddOpen: (value: boolean) => void;
  isCreating: boolean;
};

function CreateIssueModal({
  handleAddItem,
  title,
  setTitle,
  description,
  setDescription,
  setAddOpen,
  isCreating,
}: CreateIssueModalProps) {
  return (
    <SmallWrapper>
      <form
        onSubmit={handleAddItem}
        className="flex w-full flex-col gap-3 text-left"
      >
        <h2 className="text-lg font-semibold">Neuer Punkt</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="item-title">Titel</Label>
          <Input
            id="item-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Kurze Aufgabenbeschreibung"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="item-desc">Beschreibung (optional)</Label>
          <Textarea
            id="item-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20 resize-y"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setAddOpen(false)}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isCreating || !title.trim()}>
            {isCreating ? 'Speichern…' : 'Hinzufügen'}
          </Button>
        </div>
      </form>
    </SmallWrapper>
  );
}
export default CreateIssueModal;
