import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { AutomationOverviewCard } from './AutomationOverviewCard';
import type { AutomationDocumentPage } from './automationDocument.api';
import { useSaveArbeitszeugnisDocument } from './useArbeitszeugnisDocument';

type ArbeitszeugnisAutomationCardProps = {
  page: AutomationDocumentPage;
};

export function ArbeitszeugnisAutomationCard({
  page,
}: ArbeitszeugnisAutomationCardProps) {
  const save = useSaveArbeitszeugnisDocument();
  const selected = page.masters.some(
    (master) => master.id === page.documentMasterId
  )
    ? page.documentMasterId
    : undefined;

  return (
    <AutomationOverviewCard
      name={page.name}
      description="Erstellt beim Offboarding ein Arbeitszeugnis aus dem ausgewählten Referenzdokument."
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="arbeitszeugnis-master">Referenzdokument</Label>
        {page.masters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch kein Arbeitszeugnis. Lege eines unter Dokumente an.
          </p>
        ) : (
          <Select
            value={selected ?? undefined}
            onValueChange={(documentMasterId) => {
              save.mutate(documentMasterId, {
                onError: () =>
                  toast.error(
                    'Referenzdokument konnte nicht gespeichert werden'
                  ),
              });
            }}
          >
            <SelectTrigger id="arbeitszeugnis-master" className="w-full">
              <SelectValue placeholder="Arbeitszeugnis wählen" />
            </SelectTrigger>
            <SelectContent>
              {page.masters.map((master) => (
                <SelectItem key={master.id} value={master.id}>
                  {master.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </AutomationOverviewCard>
  );
}
