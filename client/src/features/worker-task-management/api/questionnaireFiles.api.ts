import { apiJson } from '@/config/apiClient';

export function fileQuestionnaireDocuments(
  workerId: string,
  engagementId: string,
  questionKey?: string
) {
  return apiJson.post<{ success: boolean }>(
    `worker/${workerId}/engagements/${engagementId}/questionnaire/files`,
    questionKey ? { questionKey } : {}
  );
}

export function renameQuestionnaireFile(
  workerId: string,
  engagementId: string,
  questionKey: string,
  name: string
) {
  return apiJson.patch<{ success: boolean; data: { name: string } }>(
    `worker/${workerId}/engagements/${engagementId}/questionnaire/files`,
    { questionKey, name }
  );
}
