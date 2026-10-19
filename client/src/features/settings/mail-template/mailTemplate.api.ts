import { apiJson } from '@/config/apiClient';

export type MailTemplateContent = {
  subject: string;
  body: string;
};

export type MailTemplateListItem = {
  id: string;
  name: string;
  description: string;
};

export type MailTemplatePageData = {
  template: MailTemplateListItem;
  settings: MailTemplateContent;
};

type ListResponse = {
  success: boolean;
  data: MailTemplateListItem[];
};

type ItemResponse = {
  success: boolean;
  data: MailTemplateListItem;
};

type PageResponse = {
  success: boolean;
  data: MailTemplatePageData;
};

type SettingsResponse = {
  success: boolean;
  data: MailTemplateContent;
};

export function listMailTemplates() {
  return apiJson
    .get<ListResponse>('/automation/mail-templates')
    .then((response) => response.data);
}

export function createMailTemplate(input: {
  name: string;
  description: string;
}) {
  return apiJson
    .post<ItemResponse>('/automation/mail-templates', input)
    .then((response) => response.data);
}

export function updateMailTemplateDetails(
  id: string,
  input: { name: string; description: string }
) {
  return apiJson
    .put<ItemResponse>(`/automation/mail-templates/${id}/details`, input)
    .then((response) => response.data);
}

export function getMailTemplate(id: string) {
  return apiJson
    .get<PageResponse>(`/automation/mail-templates/${id}`)
    .then((response) => response.data);
}

export function saveMailTemplate(id: string, input: MailTemplateContent) {
  return apiJson
    .put<SettingsResponse>(`/automation/mail-templates/${id}`, input)
    .then((response) => response.data);
}

export function deleteMailTemplate(id: string) {
  return apiJson.delete(`/automation/mail-templates/${id}`);
}
