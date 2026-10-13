import { apiJson } from '@/config/apiClient';
import type { DocumentSegment } from '@/features/settings/documents/documentSegments';
import type { StyledDocument } from '@/features/settings/documents/styledDocument';
import type { PreparedPdf } from '@/features/worker-task-management/components/files/PreparedPdfPreview';

export type LetterValue = {
  key: string;
  label: string;
  value: string;
};

export type ArbeitszeugnisPreview = {
  masterId: string;
  name: string;
  workerId: string;
  engagementId: string;
  segments: DocumentSegment[];
  document: StyledDocument;
  values: Record<string, string>;
  unmatched: LetterValue[];
  unresolved: { key: string; label: string }[];
  alreadySent: boolean;
  outgoingFileUrl?: string | null;
  prepared?: PreparedPdf | null;
};

type PreviewResponse = {
  success: boolean;
  data: ArbeitszeugnisPreview;
};

export function getArbeitszeugnisPreview(issueId: string) {
  return apiJson
    .get<PreviewResponse>(`/automation/issues/${issueId}/arbeitszeugnis`)
    .then((response) => response.data);
}

export function sendArbeitszeugnis(issueId: string, artifactId: string) {
  return apiJson.post(`/automation/issues/${issueId}/arbeitszeugnis`, {
    artifactId,
  });
}

export function prepareArbeitszeugnisPdf(
  issueId: string,
  values: Record<string, string>
) {
  return apiJson
    .post<{
      data: PreparedPdf;
    }>(`/automation/issues/${issueId}/arbeitszeugnis/prepare-pdf`, { values })
    .then((response) => response.data);
}
export function saveArbeitszeugnisDraft(
  issueId: string,
  values: Record<string, string>
) {
  return apiJson.put(`/automation/issues/${issueId}/arbeitszeugnis/draft`, {
    values,
  });
}
