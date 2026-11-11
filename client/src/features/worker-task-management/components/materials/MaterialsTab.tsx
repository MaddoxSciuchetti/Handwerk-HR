import type { EngagementType } from '@/features/worker-lifecycle/types/index.types';
import { useEffect, useState } from 'react';
import {
  useDeleteEngagementMaterial,
  useEngagementMaterials,
  useUpdateEngagementMaterial,
  useUploadEngagementMaterial,
} from '../../hooks/useEngagementMaterials';
import { MaterialsEngagementPicker } from './MaterialsEngagementPicker';
import { MaterialsTable, MaterialsTableSkeleton } from './MaterialsTable';

type MaterialsTabProps = {
  workerId: string;
  engagements: Array<{
    id: string;
    type: EngagementType;
    startDate: string | null;
  }>;
  /** File chosen via the parent input (kept outside Suspense for user-activation). */
  pendingFile?: File | null;
  onPendingFileConsumed?: () => void;
};

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return 'Hochladen ist fehlgeschlagen.';
}

export function MaterialsTab({
  workerId,
  engagements,
  pendingFile = null,
  onPendingFileConsumed,
}: MaterialsTabProps) {
  const [engagementId, setEngagementId] = useState<string | null>(
    engagements[0]?.id ?? null
  );
  const selectedId =
    engagementId && engagements.some((item) => item.id === engagementId)
      ? engagementId
      : (engagements[0]?.id ?? null);

  const materials = useEngagementMaterials(workerId, selectedId);
  const upload = useUploadEngagementMaterial(workerId, selectedId);
  const update = useUpdateEngagementMaterial(workerId, selectedId);
  const remove = useDeleteEngagementMaterial(workerId, selectedId);
  const { mutate: uploadMaterial, isPending: uploadPending } = upload;

  useEffect(() => {
    if (!pendingFile || !selectedId || uploadPending) return;
    uploadMaterial(pendingFile);
    onPendingFileConsumed?.();
  }, [
    pendingFile,
    selectedId,
    uploadPending,
    uploadMaterial,
    onPendingFileConsumed,
  ]);

  const documents = materials.data?.documents ?? [];
  const unassigned = materials.data?.unassigned ?? [];
  const hasRows = documents.length > 0 || unassigned.length > 0;

  return (
    <div
      className="flex min-h-full flex-1 flex-col px-4 py-4"
      data-testid="materials-tab"
    >
      <MaterialsEngagementPicker
        engagements={engagements}
        value={selectedId ?? ''}
        onChange={setEngagementId}
      />
      {upload.isPending ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Materialien werden gelesen…
        </p>
      ) : null}
      {upload.isError ? (
        <p className="mb-4 text-sm text-destructive">
          {errorMessage(upload.error)}
        </p>
      ) : null}
      {update.isError ? (
        <p className="mb-4 text-sm text-destructive">
          {errorMessage(update.error)}
        </p>
      ) : null}

      {materials.isError ? (
        <p className="text-sm text-destructive">
          {errorMessage(materials.error)}
        </p>
      ) : null}
      {materials.isLoading ? (
        <MaterialsTableSkeleton />
      ) : hasRows ? (
        <MaterialsTable
          documents={documents}
          unassigned={unassigned}
          savingId={
            update.isPending ? (update.variables?.materialId ?? null) : null
          }
          deletingId={remove.isPending ? (remove.variables ?? null) : null}
          onSave={(values) => update.mutate(values)}
          onDelete={(materialId) => remove.mutate(materialId)}
        />
      ) : selectedId ? null : (
        <p className="text-sm text-muted-foreground">
          Kein Engagement vorhanden.
        </p>
      )}
    </div>
  );
}
