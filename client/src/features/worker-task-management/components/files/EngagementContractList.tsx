import { apiJson } from '@/config/apiClient';
import { getEngagementContract } from '../../api/employmentContract.api';
import { printPdfBlob } from '../../printPdf';
import { printStoredFile } from '../../printStoredFile';
import { useState } from 'react';
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

export function EngagementContractList({
  workerId,
  contracts,
}: EngagementContractListProps) {
  const [openEngagementId, setOpenEngagementId] = useState<string | null>(null);

  if (!contracts.length) return null;

  return (
    <>
      {contracts.map((contract) => (
        <StoredFileBox
          key={contract.id}
          label="Vertrag"
          icon={FileText}
          onOpen={() => setOpenEngagementId(contract.engagementId)}
          onPrint={async () => {
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
            } else {
              const blob = await apiJson.get<Blob>(
                `worker/${workerId}/engagements/${contract.engagementId}/contract/print`,
                { responseType: 'blob' }
              );
              await printPdfBlob(blob);
            }
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
