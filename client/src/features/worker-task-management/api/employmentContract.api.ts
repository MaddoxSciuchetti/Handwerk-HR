import API from '@/config/apiClient';
import type { DocumentSegment } from '@/features/settings/documents/documentSegments';

export type EmploymentContractStatus = 'draft' | 'ready' | 'signed';

export type EmploymentContractDraft = {
  id: string;
  engagementId: string;
  status: EmploymentContractStatus;
  name: string;
  followsMaster: boolean;
  segments: DocumentSegment[];
  values: Record<string, string>;
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

export function confirmEngagementContractForSend(
  workerId: string,
  engagementId: string
): Promise<EmploymentContractDraft> {
  return API.post<Record<string, never>, ContractResponse>(
    `worker/${workerId}/engagements/${engagementId}/contract/confirm-send`,
    {}
  ).then((response) => response.data);
}
