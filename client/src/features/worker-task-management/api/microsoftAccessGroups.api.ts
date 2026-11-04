import { apiJson } from '@/config/apiClient';

export type MicrosoftAccessGroup = {
  id: string;
  displayName: string;
};

export type MicrosoftAccessGroupsResult = {
  groups: MicrosoftAccessGroup[];
  error: string | null;
};

export function getMicrosoftAccessGroups() {
  return apiJson
    .get<{
      success: boolean;
      data: MicrosoftAccessGroupsResult;
    }>('/automation/microsoft-365/access-groups')
    .then((response) => response.data);
}
