import { apiJson } from '@/config/apiClient';

export type MicrosoftLicenseAvailability = {
  available: number | null;
  occupied?: number;
  skuPartNumber?: string;
  error: string | null;
};

export function getMicrosoftLicenseAvailability() {
  return apiJson
    .get<{
      success: boolean;
      data: MicrosoftLicenseAvailability;
    }>('/automation/microsoft-365/licenses')
    .then((response) => response.data);
}
