import { screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { renderWithProviders } from 'test-unit/test-utils';
import { IntegrationsPage } from '@/features/settings/integrations/IntegrationsPage';
import {
  getIntegrations,
  type OrganizationIntegration,
} from '@/features/settings/integrations/integrations.api';

vi.mock('@/features/settings/integrations/integrations.api', () => ({
  getIntegrations: vi.fn(),
  saveIntegration: vi.fn(),
}));

it('keeps the integrations heading while loading rows, then reveals the settings', async () => {
  let complete!: (value: OrganizationIntegration[]) => void;
  vi.mocked(getIntegrations).mockReturnValueOnce(
    new Promise((resolve) => {
      complete = resolve;
    })
  );
  renderWithProviders(<IntegrationsPage />);
  expect(
    screen.getByRole('heading', { name: 'Integrationen' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('status', { name: 'Integrationen werden geladen' })
  ).toBeInTheDocument();
  expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  complete(
    ['microsoft_graph', 'crewmeister'].map((provider) => ({
      provider: provider as OrganizationIntegration['provider'],
      enabled: false,
      tenantId: '',
      clientId: '',
      domain: '',
      licenseSkuId: '',
      crewId: '',
      hasClientSecret: false,
      hasToken: false,
      live: false,
    }))
  );
  await screen.findAllByRole('switch');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'Microsoft' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'Crewmeister' })
  ).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Speichern' })).toHaveLength(2);
});
