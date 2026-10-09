import API from '@/config/apiClient';
import type { DocumentSegment } from '@/features/settings/documents/documentSegments';

export type EmploymentContractStatus = 'draft' | 'ready' | 'signed';

export type UnmatchedQuestionnaireAnswer = {
  key: string;
  label: string;
  value: string;
};

export type EmploymentContractDraft = {
  id: string;
  engagementId: string;
  masterId: string;
  status: EmploymentContractStatus;
  name: string;
  followsMaster: boolean;
  segments: DocumentSegment[];
  values: Record<string, string>;
  unmatchedAnswers: UnmatchedQuestionnaireAnswer[];
  sentAt: string | null;
};

type ContractResponse = {
  success: boolean;
  data: EmploymentContractDraft;
};

export function getEngagementContract(
  workerId: string,
  engagementId: string
): Promise<EmploymentContractDraft> {
  return API.get<ContractResponse, ContractResponse>(
    `worker/${workerId}/engagements/${engagementId}/contract`
  ).then((response) => response.data);
}

export function saveEngagementContractDraft(
  workerId: string,
  engagementId: string,
  values: Record<string, string>
): Promise<EmploymentContractDraft> {
  return API.put<
    { values: Record<string, string> },
    ContractResponse
  >(`worker/${workerId}/engagements/${engagementId}/contract`, {
    values,
  }).then((response) => response.data);
}

export function sendFilledEmploymentContract(
  workerId: string,
  engagementId: string,
  issueId: string,
  values: Record<string, string>
): Promise<EmploymentContractDraft> {
  return API.post<
    { issueId: string; values: Record<string, string> },
    ContractResponse
  >(`worker/${workerId}/engagements/${engagementId}/contract/send`, {
    issueId,
    values,
  }).then((response) => response.data);
}

export function confirmEngagementContractForSend(
  workerId: string,
  engagementId: string
): Promise<EmploymentContractDraft> {
  return API.post<Record<string, never>, ContractResponse>(
    `worker/${workerId}/engagements/${engagementId}/contract/confirm-send`,
    {}
  ).then((response) => response.data);
}
