import LoadingAlert from '@/components/alerts/LoadingAlert';
import ModalOverlay from '@/components/modal/ModalOverlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createOrgStatus,
  deleteOrgStatus,
  type OrgStatusEntityType,
  type OrgStatusRow,
  updateOrgStatus,
} from '@/features/org-settings/api/orgStatus.api';
import { ORG_STATUSES } from '@/features/org-settings/consts/query-key.consts';
import { orgStatusQueries } from '@/features/org-settings/query-options/queries/orgStatus.queries';
import {
  WORKER_ISSUE_STATUSES,
  WORKERBYID,
} from '@/features/task-management/consts/query-key.consts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type EntityStatusSettingsProps = {
  entityType: OrgStatusEntityType;
  title: string;
  description: string;
};

function StatusModal({
  onClose,
  entityType,
  initial,
}: {
  onClose: () => void;
  entityType: OrgStatusEntityType;
  initial: OrgStatusRow | null;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(initial?.name ?? '');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [ORG_STATUSES] });
    qc.invalidateQueries({ queryKey: [WORKERBYID] });
    qc.invalidateQueries({ queryKey: [WORKER_ISSUE_STATUSES] });
  };

  const save = useMutation({
    mutationFn: async () => {
      if (initial) {
        await updateOrgStatus(initial.id, {
          name,
        });
      } else {
        await createOrgStatus({
          entityType,
          name,
          color: null,
        });
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success(initial ? 'Status aktualisiert' : 'Status angelegt');
      onClose();
    },
    onError: (e: { message?: string }) => {
      toast.error(e?.message ?? 'Aktion fehlgeschlagen');
    },
  });

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-foreground">
        {initial ? 'Status bearbeiten' : 'Neuer Status'}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Änderungen gelten für alle Projekte bzw. Issues, die diesen Status
        verwenden.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor="st-name">Name</Label>
          <Input
            id="st-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Abbrechen
        </Button>
        <Button
          type="button"
          disabled={!name.trim() || save.isPending}
          onClick={() => save.mutate()}
        >
          Speichern
        </Button>
      </div>
    </div>
  );
}

function usageLine(entityType: OrgStatusEntityType, n: number) {
  if (n <= 0) return null;
  if (entityType === 'engagement') {
    return n === 1 ? '1 Projekt' : `${n} Projekte`;
  }
  return n === 1 ? '1 Issue' : `${n} Issues`;
}

export function EntityStatusSettings({
  entityType,
  title,
  description,
}: EntityStatusSettingsProps) {
  const qc = useQueryClient();
  const { data: statuses = [], isPending } = useQuery(
    orgStatusQueries.list(entityType)
  );
  const [modal, setModal] = useState<OrgStatusRow | 'add' | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => deleteOrgStatus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORG_STATUSES] });
      qc.invalidateQueries({ queryKey: [WORKERBYID] });
      qc.invalidateQueries({ queryKey: [WORKER_ISSUE_STATUSES] });
      toast.success('Status gelöscht');
    },
    onError: (e: { message?: string }) => {
      toast.error(e?.message ?? 'Löschen nicht möglich');
    },
  });

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
              statuses.length > 1 && row.usageCount === 0 && !remove.isPending;
            return (
              <li
                key={row.id}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{row.name}</p>
                  {row.usageCount > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {usageLine(entityType, row.usageCount)}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-lg"
                    onClick={() => setModal(row)}
                    aria-label="Bearbeiten"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-lg text-destructive hover:text-destructive"
                    disabled={!canDelete}
                    title={
                      statuses.length <= 1
                        ? 'Der letzte Status kann nicht gelöscht werden'
                        : row.usageCount > 0
                          ? 'Zuerst alle Zuordnungen entfernen'
                          : 'Löschen'
                    }
                    onClick={() => remove.mutate(row.id)}
                    aria-label="Löschen"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {modal && (
        <ModalOverlay handleToggle={() => setModal(null)}>
          <StatusModal
            entityType={entityType}
            initial={modal === 'add' ? null : modal}
            onClose={() => setModal(null)}
          />
        </ModalOverlay>
      )}
    </div>
  );
}
