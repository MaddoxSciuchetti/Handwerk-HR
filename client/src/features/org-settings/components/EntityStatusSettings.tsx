import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Button } from '@/components/ui/button';
import {
  type OrgStatusEntityType,
  type OrgStatusRow
} from '@/features/org-settings/api/orgStatus.api';
import { orgStatusQueries } from '@/features/org-settings/query-options/queries/orgStatus.queries';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { orgStatusMutations } from '../query-options/mutations/orgStatus.mutations';
import StatusModal from './StatusModal';
import { StatusRowItem } from './StatusRowItem';

type EntityStatusSettingsProps = {
  entityType: OrgStatusEntityType;
  title: string;
  description: string;
};

export function EntityStatusSettings({
  entityType,
  title,
  description,
}: EntityStatusSettingsProps) {
  const { data: statuses = [], isPending } = useQuery(
    orgStatusQueries.list(entityType)
  );
  const [modal, setModal] = useState<OrgStatusRow | 'add' | null>(null);

  const { mutate: remove , isPending: isRemoving } = useMutation(orgStatusMutations.remove());

  if (isPending) return <LoadingAlert />;

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">
            Status
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            onClick={() => setModal('add')}
            aria-label="Status hinzufügen"
          >
            <Plus className="size-5" />
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {statuses.map((row) => {
            const canDelete =
              statuses.length > 1 && row.usageCount === 0 && !isRemoving;
            return (
              <StatusRowItem
                key={row.id}
                row={row}
                entityType={entityType}
                setModal={setModal}
                canDelete={canDelete}
                statuses={statuses}
                remove={remove}
              />
            );
          })}
        </ul>
      </div>

      {modal && (
        <ModalOverlay handleToggle={() => setModal(null)}>
          <StatusModal
            entityType={entityType}
            modalType={modal === "add" ? null : modal }
            onClose={() => setModal(null)}
          />
        </ModalOverlay>
      )}
    </div>
  );
}
