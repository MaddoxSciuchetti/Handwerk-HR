import { Button } from '@/components/ui/button';
import type { EmploymentContractDraft } from '../../api/employmentContract.api';
import { useResyncEmploymentContract } from '../../hooks/useEmploymentContract';
import { toast } from 'sonner';

type Props = {
  workerId: string;
  engagementId: string;
  contract: EmploymentContractDraft;
  disabled?: boolean;
  beforeSync?: () => Promise<unknown>;
  onSynced: (saved: EmploymentContractDraft) => void;
  onBusy?: (busy: boolean) => void;
};

export function ContractQuestionnaireSync({
  workerId,
  engagementId,
  contract,
  disabled,
  beforeSync,
  onSynced,
  onBusy,
}: Props) {
  const sync = useResyncEmploymentContract(workerId, engagementId, beforeSync);
  const locked = Boolean(
    contract.printedAt || contract.sentAt || contract.status === 'signed'
  );
  if (!contract.questionnaireSyncNeeded || locked) return null;
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
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
      {sync.isPending ? 'Synchronisiert…' : 'Sync'}
    </Button>
  );
}
