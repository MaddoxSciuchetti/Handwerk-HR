import { apiJson } from '@/config/apiClient';

export type AutomationDocumentMaster = {
  id: string;
  name: string;
};

export type AutomationDocumentPage = {
  automation: string;
  name: string;
  documentMasterId: string | null;
  masters: AutomationDocumentMaster[];
};

type AutomationDocumentResponse = {
  success: boolean;
  data: AutomationDocumentPage;
};

export function getAutomationDocument(automation: string) {
  return apiJson
    .get<AutomationDocumentResponse>(`/automation/documents/${automation}`)
    .then((response) => response.data);
}

export function saveAutomationDocument(input: {
  automation: string;
  documentMasterId: string;
}) {
  return apiJson
    .put<AutomationDocumentResponse>(
      `/automation/documents/${input.automation}`,
      { documentMasterId: input.documentMasterId }
    )
    .then((response) => response.data);
}
