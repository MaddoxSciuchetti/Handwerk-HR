export type TableColumn = {
  key: string;
  label: string;
  type: 'text' | 'date';
};

function fold(value: string) {
  return value
    .toLowerCase()
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]/g, '');
}

export function tableColumns(value: string): TableColumn[] | null {
  const labels = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (
    labels.length < 1 ||
    labels.length > 6 ||
    labels.some((label) => label.length > 80) ||
    new Set(labels).size !== labels.length
  ) {
    return null;
  }
  const used = new Set<string>();
  return labels.map((label) => {
    const folded = fold(label).slice(0, 24);
    const base = /^[a-z]/.test(folded) ? folded : `s${folded}`.slice(0, 24) || 'spalte';
    let key = base;
    let number = 2;
    while (used.has(key)) {
      key = `${base.slice(0, 20)}${number}`;
      number += 1;
    }
    used.add(key);
    return {
      key,
      label,
      type: /datum/i.test(label) ? 'date' : 'text',
    };
  });
}
