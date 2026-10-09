import { apiJson } from '@/config/apiClient';

export type WelcomeMailSettings = {
  senderAddress: string;
  groupId: string;
  groupName: string;
  subject: string;
  body: string;
};

export type MicrosoftGroupOption = {
  id: string;
  displayName: string;
};

export type WelcomeMailPageData = {
  settings: WelcomeMailSettings | null;
  groups: MicrosoftGroupOption[];
  groupsError: string | null;
};

type WelcomeMailPageResponse = {
  success: boolean;
  data: WelcomeMailPageData;
};

type WelcomeMailSettingsResponse = {
  success: boolean;
  data: WelcomeMailSettings;
};

export function getWelcomeMail() {
  return apiJson
    .get<WelcomeMailPageResponse>('/automation/welcome-mail')
    .then((response) => response.data);
}

export function saveWelcomeMail(input: WelcomeMailSettings) {
  return apiJson
    .put<WelcomeMailSettingsResponse>('/automation/welcome-mail', input)
    .then((response) => response.data);
}
