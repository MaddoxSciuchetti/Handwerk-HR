import { apiJson } from '@/config/apiClient';
import { getEngagementContract } from '../../api/employmentContract.api';
import { printPdfBlob } from '../../printPdf';
import { printStoredFile } from '../../printStoredFile';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText } from 'lucide-react';
import { ContractDraftDialog } from './ContractDraftDialog';
import { StoredFileBox } from './StoredFileBox';
import type { EmploymentContractStatus } from '../../api/employmentContract.api';

export type EngagementContractLink = {
  engagementId: string;
  id: string;
  name: string;
  status: EmploymentContractStatus;
};

type EngagementContractListProps = {
  workerId: string;
  contracts: EngagementContractLink[];
};

function contractPrintPath(workerId: string, engagementId: string) {
  return `worker/${workerId}/engagements/${engagementId}/contract/print`;
}

export function EngagementContractList({
  workerId,
  contracts,
}: EngagementContractListProps) {
  const [openEngagementId, setOpenEngagementId] = useState<string | null>(null);
  const draftPdfCache = useRef(new Map<string, Promise<Blob>>());

  if (!contracts.length) return null;

  const prefetchDraftPdf = (engagementId: string) => {
    const cached = draftPdfCache.current.get(engagementId);
    if (cached) return cached;
    const pending = apiJson
      .get<Blob>(contractPrintPath(workerId, engagementId), {
        responseType: 'blob',
      })
      .catch((error) => {
        draftPdfCache.current.delete(engagementId);
        throw error;
      });
    draftPdfCache.current.set(engagementId, pending);
    return pending;
  };

  return (
    <>
      {contracts.map((contract) => (
        <StoredFileBox
          key={contract.id}
          label="Vertrag"
          icon={FileText}
          onOpen={() => setOpenEngagementId(contract.engagementId)}
          onPrefetchPrint={() => {
            if (contract.status === 'draft') {
              void prefetchDraftPdf(contract.engagementId);
            }
          }}
          onPrint={async () => {
            // Drafts can print from the lightweight render endpoint — skip the
            // full contract fetch (presigns + preparation) that only helps stored PDFs.
            if (contract.status === 'draft') {
              await printPdfBlob(await prefetchDraftPdf(contract.engagementId));
              return;
            }
            const draft = await getEngagementContract(
              workerId,
              contract.engagementId
            );
            const storedUrl = draft.signedFileUrl || draft.outgoingFileUrl;
            if (storedUrl) {
              await printStoredFile(
                storedUrl,
                `${draft.name}.pdf`,
                'application/pdf'
              );
              return;
            }
            await printPdfBlob(await prefetchDraftPdf(contract.engagementId));
          }}
        />
      ))}
      {openEngagementId
        ? createPortal(
            <ContractDraftDialog
              workerId={workerId}
              engagementId={openEngagementId}
              onClose={() => setOpenEngagementId(null)}
            />,
            document.body
          )
        : null}
    </>
  );
}
