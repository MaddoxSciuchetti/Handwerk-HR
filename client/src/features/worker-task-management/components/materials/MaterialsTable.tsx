import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  EngagementMaterialDocument,
  EngagementMaterialItem,
} from '../../api/engagementMaterials.api';
import { MaterialItemRow } from './MaterialItemRow';

type MaterialsTableProps = {
  documents: EngagementMaterialDocument[];
  unassigned: EngagementMaterialItem[];
  savingId: string | null;
  deletingId: string | null;
  onSave: (values: {
    materialId: string;
    name: string;
    articleNumber: string;
    quantity: number;
    unitPrice: string;
  }) => void;
  onDelete: (materialId: string) => void;
};

function MaterialTable({
  items,
  savingId,
  deletingId,
  onSave,
  onDelete,
}: {
  items: EngagementMaterialItem[];
  savingId: string | null;
  deletingId: string | null;
  onSave: MaterialsTableProps['onSave'];
  onDelete: MaterialsTableProps['onDelete'];
}) {
  if (items.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-muted-foreground">
        Keine Positionen erkannt.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b border-border hover:bg-transparent">
          <TableHead className="px-3 py-2 text-left font-medium text-muted-foreground">
            Name
          </TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-muted-foreground">
            Artikelnummer
          </TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-muted-foreground">
            Menge
          </TableHead>
          <TableHead className="px-3 py-2 text-left font-medium text-muted-foreground">
            Einzelpreis
          </TableHead>
          <TableHead className="px-3 py-2" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <MaterialItemRow
            key={item.id}
            item={item}
            saving={savingId === item.id}
            deleting={deletingId === item.id}
            onSave={onSave}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}

export function MaterialsTable({
  documents,
  unassigned,
  savingId,
  deletingId,
  onSave,
  onDelete,
}: MaterialsTableProps) {
  return (
    <div className="flex flex-col gap-4" data-testid="materials-list">
      {documents.map((document) => (
        <section
          key={document.id}
          className="overflow-hidden rounded-md border border-border"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium">{document.name}</p>
            <a
              className="shrink-0 text-sm underline"
              href={document.presignedUrl}
              target="_blank"
              rel="noreferrer"
            >
              Beleg öffnen
            </a>
          </div>
          <MaterialTable
            items={document.materials}
            savingId={savingId}
            deletingId={deletingId}
            onSave={onSave}
            onDelete={onDelete}
          />
        </section>
      ))}
      {unassigned.length > 0 ? (
        <section className="overflow-hidden rounded-md border border-border">
          <p className="border-b border-border px-3 py-2 text-sm font-medium">
            Weitere Materialien
          </p>
          <MaterialTable
            items={unassigned}
            savingId={savingId}
            deletingId={deletingId}
            onSave={onSave}
            onDelete={onDelete}
          />
        </section>
      ) : null}
    </div>
  );
}
