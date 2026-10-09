import { apiJson } from '@/config/apiClient';
import type { DocumentSegment } from '@/features/settings/documents/documentSegments';

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
  values: Record<string, string>;
  unmatched: LetterValue[];
  unresolved: { key: string; label: string }[];
  alreadySent: boolean;
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

export function sendArbeitszeugnis(
  issueId: string,
  values: Record<string, string>
) {
  return apiJson.post(`/automation/issues/${issueId}/arbeitszeugnis`, {
    values,
  });
}
