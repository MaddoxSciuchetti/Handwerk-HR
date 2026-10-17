import { RadioGroup } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { DocumentMasterDelete } from './components/DocumentMasterDelete';
import { PrimaryContractMark } from './components/PrimaryContractMark';
import { DOCUMENT_MASTER_KIND_LABELS } from './documentMaster.types';
import type { DocumentMasterListItem } from './documentMaster.types';
import {
  settingsTableBodyClassName,
  settingsTableClassName,
} from '@/features/settings/components/settingsTable';
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
    <RadioGroup
      value={primary?.id}
      onValueChange={(id) => {
        if (id === primary?.id) return;
        setPrimary.mutate(id, {
          onError: () =>
            toast.error('Die Versandvorlage konnte nicht gespeichert werden'),
        });
      }}
    >
      <Table className={settingsTableClassName}>
        <TableHeader>
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className="h-12 py-3 pl-10">Name</TableHead>
            <TableHead className="py-3 px-2">Versand</TableHead>
            <TableHead className="py-3 px-2">Art</TableHead>
            <TableHead className="py-3 pr-6 text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={settingsTableBodyClassName}>
          {masters.map((master) => (
            <TableRow
              key={master.id}
              className="cursor-pointer hover:bg-transparent"
              onClick={() =>
                navigate({
                  to: '/settings/documents/$id',
                  params: { id: master.id },
                })
              }
            >
              <TableCell>
                <div className="flex min-w-0 items-center gap-3">
                  {master.kind === 'employment_contract' ? (
                    <PrimaryContractMark id={master.id} name={master.name} />
                  ) : (
                    <span className="size-4 shrink-0" />
                  )}
                  <p className="typo-body-sm min-w-0 truncate text-text-primary">
                    {master.name}
                  </p>
                </div>
              </TableCell>
              <TableCell className="whitespace-normal">
                {master.isPrimary ? (
                  <span className="typo-body-xs inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-secondary-foreground">
                    Für den Versand
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="whitespace-normal">
                <span className="typo-body-xs inline-flex rounded-full border border-border bg-secondary px-3 py-1 text-secondary-foreground">
                  {DOCUMENT_MASTER_KIND_LABELS[master.kind]}
                </span>
              </TableCell>
              <TableCell
                className="pr-6 text-right"
                onClick={(event) => event.stopPropagation()}
              >
                <DocumentMasterDelete id={master.id} name={master.name} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </RadioGroup>
  );
}
