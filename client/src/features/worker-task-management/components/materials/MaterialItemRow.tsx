import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import type { EngagementMaterialItem } from '../../api/engagementMaterials.api';

type MaterialItemRowProps = {
  item: EngagementMaterialItem;
  saving: boolean;
  deleting: boolean;
  onSave: (values: {
    materialId: string;
    name: string;
    articleNumber: string;
    quantity: number;
    unitPrice: string;
  }) => void;
  onDelete: (materialId: string) => void;
};

function priceLabel(unitPrice: string) {
  const value = Number(unitPrice);
  if (!Number.isFinite(value)) return unitPrice;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export function MaterialItemRow({
  item,
  saving,
  deleting,
  onSave,
  onDelete,
}: MaterialItemRowProps) {
  const [name, setName] = useState(item.name);
  const [articleNumber, setArticleNumber] = useState(item.articleNumber);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unitPrice, setUnitPrice] = useState(
    item.unitPrice.replace('.', ',')
  );
  const dirty =
    name !== item.name ||
    articleNumber !== item.articleNumber ||
    quantity !== String(item.quantity) ||
    unitPrice !== item.unitPrice.replace('.', ',');

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="Name"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          value={articleNumber}
          onChange={(event) => setArticleNumber(event.target.value)}
          aria-label="Artikelnummer"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          value={quantity}
          inputMode="numeric"
          onChange={(event) => setQuantity(event.target.value)}
          aria-label="Menge"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          value={unitPrice}
          onChange={(event) => setUnitPrice(event.target.value)}
          aria-label="Einzelpreis"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {priceLabel(item.unitPrice)}
        </p>
      </td>
      <td className="px-3 py-2">
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            className="rounded-2xl"
            disabled={!dirty || saving || !name.trim()}
            onClick={() =>
              onSave({
                materialId: item.id,
                name: name.trim(),
                articleNumber: articleNumber.trim(),
                quantity: Number(quantity),
                unitPrice,
              })
            }
          >
            Speichern
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-2xl"
            disabled={deleting}
            onClick={() => onDelete(item.id)}
          >
            Löschen
          </Button>
        </div>
      </td>
    </tr>
  );
}
