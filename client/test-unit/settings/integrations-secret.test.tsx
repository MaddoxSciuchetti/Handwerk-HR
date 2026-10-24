import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { renderWithProviders } from 'test-unit/test-utils';
import { IntegrationsPage } from '@/features/settings/integrations/IntegrationsPage';
import {
  getIntegrations,
  saveIntegration,
  type OrganizationIntegration,
} from '@/features/settings/integrations/integrations.api';

vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({ user: { membershipRole: 'admin' } }),
}));
vi.mock('@/features/microsoft-teams/TeamsConnectionCard', () => ({
  TeamsConnectionCard: () => <h2>Microsoft Teams</h2>,
}));

vi.mock('@/features/settings/integrations/integrations.api', () => ({
  getIntegrations: vi.fn(),
  saveIntegration: vi.fn(),
}));

function integration(
  provider: OrganizationIntegration['provider'],
  overrides: Partial<OrganizationIntegration> = {}
): OrganizationIntegration {
  return {
    provider,
    enabled: true,
    tenantId: 'tenant',
    clientId: 'client',
    domain: 'Hadox.onmicrosoft.com',
    licenseSkuId: 'sku',
    crewId: '',
    hasClientSecret: provider === 'microsoft_graph',
    hasToken: false,
    ready: false,
    live: true,
    ...overrides,
  };
}

it('shows the Microsoft client secret that will replace the saved one', async () => {
  const user = userEvent.setup();
  vi.mocked(getIntegrations).mockResolvedValue([
    integration('microsoft_graph'),
    integration('crewmeister', { hasClientSecret: false }),
  ]);
  vi.mocked(saveIntegration).mockResolvedValue(integration('microsoft_graph'));
  renderWithProviders(<IntegrationsPage />);

  const credentialButtons = await screen.findAllByRole('button', {
    name: 'Microsoft 365',
  });
  await user.click(credentialButtons[0]);
  const secret = screen.getByLabelText('Client-Geheimnis');
  expect(secret).toHaveAttribute('type', 'text');
  expect(
    screen.getByText('Leer lassen behält das gespeicherte Geheimnis.')
  ).toBeInTheDocument();

  await user.type(secret, 'new-secret-value');
  expect(secret).toHaveValue('new-secret-value');
  expect(
    screen.getByText('Dieser Text ersetzt das gespeicherte Geheimnis.')
  ).toBeInTheDocument();

  await user.click(screen.getAllByRole('button', { name: 'Speichern' })[0]);
  expect(saveIntegration).toHaveBeenCalledWith(
    'microsoft_graph',
    expect.objectContaining({ clientSecret: 'new-secret-value' })
  );
  expect(secret).toHaveValue('new-secret-value');
});
