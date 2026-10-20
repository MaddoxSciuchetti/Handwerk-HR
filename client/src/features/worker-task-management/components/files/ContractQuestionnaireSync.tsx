import { Button } from '@/components/ui/button';
import type { EmploymentContractDraft } from '../../api/employmentContract.api';
import { useResyncEmploymentContract } from '../../hooks/useEmploymentContract';
import { toast } from 'sonner';

type Props = {
  workerId: string;
  engagementId: string;
  contract: EmploymentContractDraft;
  disabled?: boolean;
  onSynced: (saved: EmploymentContractDraft) => void;
  onBusy?: (busy: boolean) => void;
};

export function ContractQuestionnaireSync({
  workerId,
  engagementId,
  contract,
  disabled,
  onSynced,
  onBusy,
}: Props) {
  const sync = useResyncEmploymentContract(workerId, engagementId);
  if (!contract.questionnaireSyncNeeded) return null;
  const locked = Boolean(contract.sentAt || contract.status === 'signed');
  return (
    <div
      className="shrink-0 rounded-xl border border-border p-3 text-sm"
      role="status"
    >
      <p>Der Fragebogen wurde geändert.</p>
      {locked ? (
        <p>
          Der Vertrag wurde bereits versendet und kann nicht mehr synchronisiert
          werden.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p>
            Beim Synchronisieren werden die Vertragsfelder mit den aktuellen
            Fragebogendaten neu ausgefüllt. Manuelle Vertragswerte können
            ersetzt werden.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || sync.isPending}
            onClick={() => {
              onBusy?.(true);
              sync.mutate(undefined, {
                onSuccess: (saved) => {
                  onSynced(saved);
                  toast.success('Vertrag synchronisiert');
                },
                onSettled: () => onBusy?.(false),
                onError: (error) =>
                  toast.error(
                    (error as { message?: string }).message ??
                      'Vertrag konnte nicht synchronisiert werden'
                  ),
              });
            }}
          >
            {sync.isPending ? 'Synchronisiert…' : 'Sync?'}
          </Button>
        </div>
      )}
    </div>
  );
}
