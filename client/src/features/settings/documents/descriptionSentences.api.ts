import { apiJson } from '@/config/apiClient';

export const descriptionSentencesKey = [
  'documents',
  'description-sentences',
] as const;

export function getDescriptionSentences() {
  return apiJson.get<string[]>('/document-masters/description-sentences');
}

export function saveDescriptionSentence(sentence: string) {
  return apiJson.post<string[]>('/document-masters/description-sentences', {
    sentence,
  });
}
