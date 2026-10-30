export const CLOTHING_PRINT_TYPES = [
  'bedruckt',
  'sondersachen',
  'unbedruckt',
] as const;

export type ClothingPrintType = (typeof CLOTHING_PRINT_TYPES)[number];

export const CLOTHING_PRINT_TYPE_LABELS: Record<ClothingPrintType, string> = {
  bedruckt: 'Bedruckt',
  sondersachen: 'Sondersachen',
  unbedruckt: 'Unbedruckt',
};

/** Letter sizes plus the Hosen sizes from the Bestand sheet. */
export const CLOTHING_SIZES = [
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '25',
  '44',
  '46',
  '50',
  '52',
  '54',
  '56',
  '66',
] as const;

export type ClothingSize = (typeof CLOTHING_SIZES)[number];

export function isClothingPrintType(
  value: string
): value is ClothingPrintType {
  return (CLOTHING_PRINT_TYPES as readonly string[]).includes(value);
}

export function isClothingSize(value: string): value is ClothingSize {
  return (CLOTHING_SIZES as readonly string[]).includes(value);
}
