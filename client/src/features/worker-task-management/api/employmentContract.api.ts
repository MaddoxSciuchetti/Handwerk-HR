import API, { apiJson } from '@/config/apiClient';
import type { DocumentSegment } from '@/features/settings/documents/documentSegments';
import type { StyledDocument } from '@/features/settings/documents/styledDocument';
import type { PreparedPdf } from '@/features/worker-task-management/components/files/PreparedPdfPreview';

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
  document: StyledDocument;
  values: Record<string, string>;
  unmatchedAnswers: UnmatchedQuestionnaireAnswer[];
  questionnaireAnswers?: UnmatchedQuestionnaireAnswer[];
  masterRevision: number;
  matchedMasterRevision: number | null;
  questionnaireCompleted: boolean;
  sentAt: string | null;
  signedFileUrl: string | null;
  outgoingFileUrl?: string | null;
  prepared?: PreparedPdf | null;
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
  return API.put<{ values: Record<string, string> }, ContractResponse>(
    `worker/${workerId}/engagements/${engagementId}/contract`,
    {
      values,
    }
  ).then((response) => response.data);
}

export function fetchPreparedEmploymentContractPdf(
  workerId: string,
  engagementId: string,
  artifactId: string
) {
  return apiJson.get<Blob>(
    `worker/${workerId}/engagements/${engagementId}/contract/prepared-pdf/${artifactId}`,
    { responseType: 'blob' }
  );
}

export function recordPrintedEmploymentContract(
  workerId: string,
  engagementId: string,
  issueId: string,
  artifactId: string
): Promise<EmploymentContractDraft> {
  return API.post<
    { issueId: string; artifactId: string },
    ContractResponse
  >(`worker/${workerId}/engagements/${engagementId}/contract/send`, {
    issueId,
    artifactId,
  }).then((response) => response.data);
}

export function prepareEmploymentContractPdf(
  workerId: string,
  engagementId: string,
  values: Record<string, string>
) {
  return API.post<{ values: Record<string, string> }, { data: PreparedPdf }>(
    `worker/${workerId}/engagements/${engagementId}/contract/prepare-pdf`,
    { values }
  ).then((response) => response.data);
}

export function confirmReturnedEmploymentContract(
  workerId: string,
  engagementId: string,
  issueId: string
): Promise<EmploymentContractDraft> {
  return API.post<{ issueId: string }, ContractResponse>(
    `worker/${workerId}/engagements/${engagementId}/contract/confirm-return`,
    { issueId }
  ).then((response) => response.data);
}

export function resyncEngagementContractFromQuestionnaire(
  workerId: string,
  engagementId: string
): Promise<EmploymentContractDraft> {
  return API.post<Record<string, never>, ContractResponse>(
    `worker/${workerId}/engagements/${engagementId}/contract/resync`,
    {}
  ).then((response) => response.data);
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


export function selectEngagementContractTemplate(
  workerId: string,
  engagementId: string,
  masterId: string
): Promise<EmploymentContractDraft> {
  return API.post<{ masterId: string }, ContractResponse>(
    `worker/${workerId}/engagements/${engagementId}/contract/template`,
    { masterId }
  ).then((response) => response.data);
}
