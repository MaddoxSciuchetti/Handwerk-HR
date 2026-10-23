import { apiJson } from '@/config/apiClient';
import type { MailRecipient } from './engagementMail.api';

export type AutomationChoice = {
  senderAddress?: string;
  recipients?: MailRecipient[];
  destinations?: Array<{ teamId: string; channelId: string }>;
};
export type TemplatePreview = {
  id: string;
  name: string;
  revision: string;
  items: Array<{
    id: string;
    title: string;
    sequence: string | null;
    integrationProvider: string | null;
    blockedReason: string | null;
  }>;
};
export type TemplateApplicationResult = {
  count: number;
  issueIds: string[];
  outcomes: Array<{
    issueId: string;
    status: 'completed' | 'failed' | 'pending';
    message?: string;
  }>;
  running: boolean;
};
export function previewTemplate(
  workerId: string,
  engagementId: string,
  templateId: string
) {
  return apiJson
    .get<{ data: TemplatePreview }>(
      `/worker/${workerId}/templates/${templateId}/preview`,
      {
        params: { workerEngagementId: engagementId },
      }
    )
    .then((response) => response.data);
}
export function applyTemplate(
  workerId: string,
  templateId: string,
  input: {
    workerEngagementId: string;
    runAutomation: boolean;
    idempotencyKey: string;
    templateRevision?: string;
    choices: Record<string, AutomationChoice>;
  }
) {
  return apiJson
    .post<{
      data: TemplateApplicationResult;
    }>(`/worker/${workerId}/templates/${templateId}/apply`, input)
    .then((response) => response.data);
}
