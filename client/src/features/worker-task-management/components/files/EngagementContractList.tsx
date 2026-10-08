import { useState } from 'react';
import { ContractDraftDialog } from './ContractDraftDialog';

export type EngagementContractLink = {
  engagementId: string;
  id: string;
  name: string;
  status: 'draft' | 'signed';
};

type EngagementContractListProps = {
  workerId: string;
  contracts: EngagementContractLink[];
};

const STATUS_LABEL = {
  draft: 'Entwurf',
  signed: 'Unterschrieben',
} as const;

export function EngagementContractList({
  workerId,
  contracts,
}: EngagementContractListProps) {
  const [openEngagementId, setOpenEngagementId] = useState<string | null>(null);

  if (!contracts.length) return null;

  return (
    <>
      <ul>
        {contracts.map((contract) => (
          <li key={contract.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between border-b border-border py-4 pr-2 pl-10 text-left hover:bg-muted/40"
              onClick={() => setOpenEngagementId(contract.engagementId)}
            >
              <span className="text-sm font-medium">{contract.name}</span>
              <span className="text-xs text-muted-foreground">
                {STATUS_LABEL[contract.status]}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {openEngagementId ? (
        <ContractDraftDialog
          workerId={workerId}
          engagementId={openEngagementId}
          onClose={() => setOpenEngagementId(null)}
        />
      ) : null}
    </>
  );
}
