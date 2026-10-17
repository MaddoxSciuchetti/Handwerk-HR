import { apiJson } from '@/config/apiClient';
import type {
  WelcomeMailPageData,
  WelcomeMailSettings,
} from '@/features/settings/welcome-mail/welcomeMail.api';

export type MailTemplateListItem = {
  id: string;
  name: string;
  description: string;
};

export type MailTemplatePageData = WelcomeMailPageData & {
  template: MailTemplateListItem;
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
  data: WelcomeMailSettings;
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

export function saveMailTemplate(id: string, input: WelcomeMailSettings) {
  return apiJson
    .put<SettingsResponse>(`/automation/mail-templates/${id}`, input)
    .then((response) => response.data);
}

export function deleteMailTemplate(id: string) {
  return apiJson.delete(`/automation/mail-templates/${id}`);
}
