import { apiJson } from '@/config/apiClient';
import type { MailRecipient } from './engagementMail.api';

export type AutomationChoice = {
  scheduledDeactivateAt?: string | null;
  senderAddress?: string;
  recipients?: MailRecipient[];
  destinations?: Array<{ teamId: string; channelId: string }>;
};
export type TemplatePreview = {
  mocked?: boolean;
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
  tasks?: Array<{
    id: string;
    title: string;
    status:
      | 'open'
      | 'in_progress'
      | 'done'
      | 'error'
      | 'cancelled'
      | 'not_applicable';
    sequence: string | null;
    scheduledDeactivateAt?: string | null;
    scheduledDeactivateTestAt?: string | null;
  }>;
  count: number;
  issueIds: string[];
  outcomes: Array<{
    issueId: string;
    status: 'completed' | 'failed' | 'pending' | 'scheduled';
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

export type StoredTemplateApplication = {
  idempotencyKey?: string;
  templateName: string;
  dismissed: boolean;
  result: TemplateApplicationResult;
};

export function getTemplateApplication(workerId: string, engagementId: string) {
  return apiJson
    .get<{
      data: StoredTemplateApplication | null;
    }>(`/worker/${workerId}/template-application`, {
      params: { workerEngagementId: engagementId },
    })
    .then((response) => response.data);
}

export function dismissTemplateApplication(
  workerId: string,
  engagementId: string
) {
  return apiJson
    .post<{
      data: { dismissed: boolean };
    }>(`/worker/${workerId}/template-application/dismiss`, { workerEngagementId: engagementId })
    .then((response) => response.data);
}
