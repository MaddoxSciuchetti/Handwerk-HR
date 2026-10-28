export const DESCRIPTION_SENTENCE_MAX = 500;

export const DEFAULT_DESCRIPTION_SENTENCES = [
  "Montage von Hygieneartikeln",
  "Reinigung von Wartungsanlagen",
  "Durchführen von Thermischer Spülung",
] as const;

export function normalizeDescriptionSentence(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function descriptionSentenceKey(value: string) {
  return normalizeDescriptionSentence(value).toLocaleLowerCase("de-DE");
}

export function mergeDescriptionSentences(values: readonly string[]) {
  const seen = new Set<string>();
  return [...DEFAULT_DESCRIPTION_SENTENCES, ...values].filter((value) => {
    const key = descriptionSentenceKey(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
