import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  useEmploymentContract,
  useSaveEmploymentContract,
} from '../../hooks/useEmploymentContract';
import { ContractDraftBody } from './ContractDraftBody';

const DETACHED_NOTE =
  'Änderungen am Mustertext werden für diesen Vertrag nicht mehr übernommen.';

type ContractDraftDialogProps = {
  workerId: string;
  engagementId: string;
  onClose: () => void;
};

export function ContractDraftDialog({
  workerId,
  engagementId,
  onClose,
}: ContractDraftDialogProps) {
  const { data, isLoading, isError } = useEmploymentContract(
    workerId,
    engagementId
  );
  const saveDraft = useSaveEmploymentContract(workerId, engagementId);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    setValues(data.values);
  }, [data]);

  const readOnly = data?.status !== 'draft';

  const save = () => {
    if (!data || readOnly) return;
    saveDraft.mutate(values, {
      onSuccess: (saved) => {
        toast.success(
          saved.detachedFromMaster
            ? `Entwurf gespeichert. ${DETACHED_NOTE}`
            : 'Entwurf gespeichert'
        );
      },
      onError: () => toast.error('Entwurf konnte nicht gespeichert werden'),
    });
  };

  return (
    <ModalOverlay handleToggle={onClose} size="max-w-3xl">
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-hidden rounded-2xl bg-card p-6 text-card-foreground">
        {isLoading ? <LoadingAlert className="min-h-40" /> : null}
        {isError || (!isLoading && !data) ? (
          <p className="text-sm text-destructive">
            Der Vertrag konnte nicht geladen werden.
          </p>
        ) : null}
        {data ? (
          <>
            <div className="pr-8">
              <h2 className="text-base font-medium">{data.name}</h2>
              <p className="text-sm text-muted-foreground">
                {data.status === 'draft' ? 'Entwurf' : 'Unterschrieben'}
              </p>
            </div>
            {data.followsMaster ? null : (
              <p className="text-sm text-muted-foreground">{DETACHED_NOTE}</p>
            )}
            <ContractDraftBody
              segments={data.segments}
              values={values}
              readOnly={readOnly}
              onValueChange={(key, value) =>
                setValues((current) => ({ ...current, [key]: value }))
              }
            />
            {readOnly ? null : (
              <div className="flex justify-end">
                <Button
                  type="button"
                  className="rounded-2xl"
                  disabled={saveDraft.isPending}
                  onClick={save}
                >
                  {saveDraft.isPending ? 'Speichert…' : 'Entwurf speichern'}
                </Button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </ModalOverlay>
  );
}
