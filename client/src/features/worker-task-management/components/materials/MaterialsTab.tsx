import type { EngagementType } from '@/features/worker-lifecycle/types/index.types';
import { useState, type RefObject } from 'react';
import {
  useDeleteEngagementMaterial,
  useEngagementMaterials,
  useUpdateEngagementMaterial,
  useUploadEngagementMaterial,
} from '../../hooks/useEngagementMaterials';
import { MaterialsDropzone } from './MaterialsDropzone';
import { MaterialsEngagementPicker } from './MaterialsEngagementPicker';
import { MaterialsTable } from './MaterialsTable';

type MaterialsTabProps = {
  workerId: string;
  engagements: Array<{
    id: string;
    type: EngagementType;
    startDate: string | null;
  }>;
  fileInputRef: RefObject<HTMLInputElement | null>;
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
  fileInputRef,
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

  const documents = materials.data?.documents ?? [];
  const unassigned = materials.data?.unassigned ?? [];
  const hasRows = documents.length > 0 || unassigned.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-4" data-testid="materials-tab">
      <MaterialsEngagementPicker
        engagements={engagements}
        value={selectedId ?? ''}
        onChange={setEngagementId}
      />
      {selectedId ? (
        <MaterialsDropzone
          inputRef={fileInputRef}
          disabled={upload.isPending}
          onFile={(file) => upload.mutate(file)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Kein Engagement vorhanden.</p>
      )}
      {upload.isPending ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Materialien werden gelesen…
        </p>
      ) : null}
      {upload.isError ? (
        <p className="mb-4 text-sm text-destructive">{errorMessage(upload.error)}</p>
      ) : null}
      {update.isError ? (
        <p className="mb-4 text-sm text-destructive">{errorMessage(update.error)}</p>
      ) : null}
      {materials.isLoading ? (
        <p className="text-sm text-muted-foreground">Materialien werden geladen…</p>
      ) : null}
      {materials.isError ? (
        <p className="text-sm text-destructive">{errorMessage(materials.error)}</p>
      ) : null}
      {hasRows ? (
        <MaterialsTable
          documents={documents}
          unassigned={unassigned}
          savingId={update.isPending ? update.variables?.materialId ?? null : null}
          deletingId={remove.isPending ? remove.variables ?? null : null}
          onSave={(values) => update.mutate(values)}
          onDelete={(materialId) => remove.mutate(materialId)}
        />
      ) : materials.isSuccess ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Materialien. Lade eine Rechnung oder ein Foto hoch.
        </p>
      ) : null}
    </div>
  );
}
