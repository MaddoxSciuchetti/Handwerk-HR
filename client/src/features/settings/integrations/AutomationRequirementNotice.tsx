import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Info } from 'lucide-react';
import { MicrosoftLicenseStatus } from '@/features/worker-task-management/components/tasks/MicrosoftLicenseStatus';

const REQUIREMENT_NOTES: Record<string, { summary: string; details: string }> =
  {
    microsoft_deactivate_account: {
      summary: 'Microsoft-Konto-ID für die Ausführung erforderlich.',
      details:
        'Die Microsoft-Konto-ID muss beim Handwerker hinterlegt oder in der Aufgabe eingegeben sein. Ohne ID wird die Deaktivierung nicht ausgeführt.',
    },
    microsoft_create_account: {
      summary: 'Freie Microsoft-Lizenz erforderlich.',
      details:
        'Für die Kontoerstellung muss in Microsoft 365 bereits eine passende, noch nicht zugewiesene Lizenz verfügbar sein. Prüfe vor der Ausführung, ob eine solche Lizenz vorhanden ist.',
    },
  };

export function AutomationRequirementNotice({
  sequence,
}: {
  sequence: string | null | undefined;
}) {
  const note = sequence ? REQUIREMENT_NOTES[sequence] : undefined;

  if (!note) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-1 text-sm text-muted-foreground">
        <p>{note.summary}</p>
        <Popover key={sequence}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Mehr Informationen zur Voraussetzung"
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info className="size-3.5" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-3">
            <p>{note.details}</p>
          </PopoverContent>
        </Popover>
      </div>
      {sequence === 'microsoft_create_account' && (
        <MicrosoftLicenseStatus showAvailable />
      )}
    </div>
  );
}
