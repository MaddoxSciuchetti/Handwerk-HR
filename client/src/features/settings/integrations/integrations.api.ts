import { apiJson } from '@/config/apiClient';

export type OrganizationIntegration = {
  provider: 'microsoft_graph' | 'crewmeister';
  enabled: boolean;
  tenantId: string;
  clientId: string;
  domain: string;
  licenseSkuId: string;
  crewId: string;
  hasClientSecret: boolean;
  hasToken: boolean;
  live: boolean;
  simulated?: boolean;
};

type IntegrationsResponse = {
  success: boolean;
  data: OrganizationIntegration[];
};

type IntegrationResponse = {
  success: boolean;
  data: OrganizationIntegration;
};

export function getIntegrations() {
  return apiJson
    .get<IntegrationsResponse>('/automation/integrations')
    .then((response) => response.data);
}

export function saveIntegration(
  provider: OrganizationIntegration['provider'],
  body: {
    enabled: boolean;
    tenantId?: string;
    clientId?: string;
    domain?: string;
    licenseSkuId?: string;
    crewId?: string;
    clientSecret?: string;
    token?: string;
  }
) {
  return apiJson
    .put<IntegrationResponse>(`/automation/integrations/${provider}`, body)
    .then((response) => response.data);
}
