import { apiJson } from '@/config/apiClient';
import type {
  WelcomeMailPageData,
  WelcomeMailSettings,
} from '@/features/settings/welcome-mail/welcomeMail.api';

type DepartureMailPageResponse = {
  success: boolean;
  data: WelcomeMailPageData;
};

type DepartureMailSettingsResponse = {
  success: boolean;
  data: WelcomeMailSettings;
};

export function getDepartureMail() {
  return apiJson
    .get<DepartureMailPageResponse>('/automation/departure-mail')
    .then((response) => response.data);
}

export function saveDepartureMail(input: WelcomeMailSettings) {
  return apiJson
    .put<DepartureMailSettingsResponse>('/automation/departure-mail', input)
    .then((response) => response.data);
}
