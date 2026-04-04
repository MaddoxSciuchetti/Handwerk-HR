import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import useAddNewTemplate from '../hooks/useAddNewTemplate';

type CreateTemplateModalV2Props = {
  onClose: () => void;
};

const CreateTemplateModalV2 = ({ onClose }: CreateTemplateModalV2Props) => {
  const {
    name,
    setName,
    description,
    setDescription,
    phaseTab,
    setPhaseTab,
    handleSubmit,
    isPending,
  } = useAddNewTemplate(onClose);
  return (
    <SmallWrapper className="min-h-72 max-h-[min(90vh,32rem)]">
      <form
        onSubmit={handleSubmit}
        className="flex w-full min-h-0 flex-col gap-4 text-left"
      >
        <div>
          <h2 className="text-lg font-semibold text-foreground">Vorlage</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Name, Phase und Anforderungen für diese Vorlage.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Phase</Label>
          <div className="inline-flex rounded-lg border border-border/70 bg-[var(--secondary)] p-1">
            <Button
              type="button"
              size="sm"
              variant={phaseTab === 'ONBOARDING' ? 'secondary' : 'ghost'}
              className="rounded-md px-4"
              onClick={() => setPhaseTab('ONBOARDING')}
            >
              Onboarding
            </Button>
            <Button
              type="button"
              size="sm"
              variant={phaseTab === 'OFFBOARDING' ? 'secondary' : 'ghost'}
              className="rounded-md px-4"
              onClick={() => setPhaseTab('OFFBOARDING')}
            >
              Offboarding
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="template-name">Name</Label>
          <Input
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Standard-Onboarding IT"
            autoFocus
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <Label htmlFor="template-desc">Anforderungen</Label>
          <Textarea
            id="template-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Was ist bei dieser Phase zu erledigen?"
            className="min-h-24 resize-y"
          />
        </div>
        <div className="mt-auto flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={isPending || !name.trim()}>
            {isPending ? 'Speichern…' : 'Anlegen'}
          </Button>
        </div>
      </form>
    </SmallWrapper>
  );
};

export default CreateTemplateModalV2;
