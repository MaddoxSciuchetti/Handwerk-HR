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
