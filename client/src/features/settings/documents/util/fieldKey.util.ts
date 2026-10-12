export function fieldSlug(label: string) {
  return (
    label
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'feld'
  );
}

export function contractFieldKey(label: string, fieldKey: string) {
  return fieldKey.trim() || `contract.${fieldSlug(label)}`;
}
