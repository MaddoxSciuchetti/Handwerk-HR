import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EngagementClothingItem } from '../../api/engagementClothing.api';
import { ClothingOrderRow } from './ClothingOrderRow';

type ClothingOrderTableProps = {
  items: EngagementClothingItem[];
  returningId: string | null;
  deletingId: string | null;
  onReturn: (clothingId: string, quantity: number) => Promise<unknown>;
  onDelete: (clothingId: string) => void;
};

export function ClothingOrderTable({
  items,
  returningId,
  deletingId,
  onReturn,
  onDelete,
}: ClothingOrderTableProps) {
  return (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-0">
        <TableRow className="border-0 hover:bg-transparent">
          <TableHead className="h-12 bg-card py-3 pl-10 pr-2">Artikel</TableHead>
          <TableHead className="bg-card py-3 px-2">Größe</TableHead>
          <TableHead className="bg-card py-3 px-2">Link</TableHead>
          <TableHead className="bg-card py-3 px-2">Herkunft</TableHead>
          <TableHead className="bg-card py-3 px-2">Anzahl</TableHead>
          <TableHead className="bg-card py-3 px-2">Rückgabe</TableHead>
          <TableHead className="bg-card py-3 pr-6 text-right"> </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr]:border-0 [&_td]:py-4 [&_td]:px-2">
        {items.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={7} className="px-8 py-8 text-sm text-muted-foreground">
              Noch keine Kleidung für dieses Engagement.
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <ClothingOrderRow
              key={item.id}
              item={item}
              returning={returningId === item.id}
              deleting={deletingId === item.id}
              onReturn={(quantity) => onReturn(item.id, quantity)}
              onDelete={() => onDelete(item.id)}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
