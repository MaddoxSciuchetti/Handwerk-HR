import { apiJson } from '@/config/apiClient';

export type Microsoft365Automation = {
  id: 'microsoft-365';
  name: string;
  description: string;
  configured: boolean;
  missing: string[];
  permissions: string[];
};

type Microsoft365AutomationResponse = {
  success: boolean;
  data: Microsoft365Automation;
};

export function getMicrosoft365Automation() {
  return apiJson
    .get<Microsoft365AutomationResponse>('/automation/microsoft-365')
    .then((response) => response.data);
}
