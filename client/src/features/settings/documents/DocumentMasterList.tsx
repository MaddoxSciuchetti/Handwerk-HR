import { RadioGroup } from '@/components/ui/radio-group';
import { Items } from '@/features/settings/components/Table';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { DocumentMasterDelete } from './components/DocumentMasterDelete';
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
        Noch keine Dokumente. Laden Sie eine oder mehrere Vorlagen hoch, zum
        Beispiel einen Arbeitsvertrag, eine Verschwiegenheitsvereinbarung oder
        eine Dienstanweisung.
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
            <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_19rem_auto]">
              <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
                {master.kind === 'employment_contract' ? (
                  <PrimaryContractMark id={master.id} name={master.name} />
                ) : (
                  <span className="size-4 shrink-0" />
                )}
                <p className="typo-body-sm min-w-0 truncate text-text-primary">
                  {master.name}
                </p>
              </div>
              <div className="col-start-1 row-start-2 flex flex-wrap items-center gap-2 sm:col-start-2 sm:row-start-1 sm:grid sm:grid-cols-[9rem_10rem] sm:gap-0">
                <div>
                  {master.isPrimary ? (
                    <span className="typo-body-xs inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-secondary-foreground">
                      Für den Versand
                    </span>
                  ) : null}
                </div>
                <div>
                  <span className="typo-body-xs inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-secondary-foreground">
                    {DOCUMENT_MASTER_KIND_LABELS[master.kind]}
                  </span>
                </div>
              </div>
              <div className="col-start-2 row-start-1 sm:col-start-3">
                <DocumentMasterDelete id={master.id} name={master.name} />
              </div>
            </div>
          </Items>
        ))}
      </RadioGroup>
    </div>
  );
}
