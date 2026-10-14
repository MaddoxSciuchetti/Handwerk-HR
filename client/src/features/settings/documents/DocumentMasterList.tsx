import { RadioGroup } from '@/components/ui/radio-group';
import { GrowingItem, Items } from '@/features/settings/components/Table';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { PrimaryContractMark } from './components/PrimaryContractMark';
import { DOCUMENT_MASTER_KIND_LABELS } from './documentMaster.types';
import type { DocumentMasterListItem } from './documentMaster.types';
import { useSetPrimaryDocumentMaster } from './useSetPrimaryDocumentMaster';

type DocumentMasterListProps = {
  masters: DocumentMasterListItem[];
};

export function DocumentMasterList({ masters }: DocumentMasterListProps) {
  const navigate = useNavigate();
  const setPrimary = useSetPrimaryDocumentMaster();
  const contracts = masters.filter(
    (master) => master.kind === 'employment_contract'
  );
  const primary = contracts.find((master) => master.isPrimary);

  if (masters.length === 0) {
    return (
      <p className="px-3 py-6 text-sm text-muted-foreground">
        Noch keine Dokumente. Lege einen Arbeitsvertrag oder ein Arbeitszeugnis
        an.
      </p>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <RadioGroup
        value={primary?.id}
        className="gap-2"
        onValueChange={(id) => {
          if (id === primary?.id) return;
          setPrimary.mutate(id, {
            onError: () =>
              toast.error('Die Versandvorlage konnte nicht gespeichert werden'),
          });
        }}
      >
        {masters.map((master) => (
          <Items
            key={master.id}
            state="hover"
            className="w-full min-w-0 cursor-pointer"
            onClick={() =>
              navigate({
                to: '/settings/documents/$id',
                params: { id: master.id },
              })
            }
          >
            <GrowingItem className="min-w-0 flex-1 justify-between gap-3 py-0">
              <div className="flex min-w-0 items-center gap-3">
                {master.kind === 'employment_contract' ? (
                  <PrimaryContractMark
                    id={master.id}
                    name={master.name}
                    isPrimary={master.isPrimary}
                  />
                ) : (
                  <span className="size-4 shrink-0" />
                )}
                <p className="typo-body-sm min-w-0 truncate text-text-primary">
                  {master.name}
                </p>
              </div>
              <span className="typo-body-xs shrink-0 rounded-full border border-border bg-secondary px-3 py-1 text-secondary-foreground">
                {DOCUMENT_MASTER_KIND_LABELS[master.kind]}
              </span>
            </GrowingItem>
          </Items>
        ))}
      </RadioGroup>
    </div>
  );
}
