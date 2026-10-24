vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({ user: { membershipRole: 'admin' } }),
}));
vi.mock('@/features/microsoft-teams/TeamsConnectionCard', () => ({
  TeamsConnectionCard: () => null,
}));
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from 'test-unit/test-utils';
import { IntegrationsPage } from '@/features/settings/integrations/IntegrationsPage';
import {
  getIntegrations,
  saveIntegration,
  type OrganizationIntegration,
} from '@/features/settings/integrations/integrations.api';

vi.mock('@/features/settings/integrations/integrations.api', () => ({
  getIntegrations: vi.fn(),
  saveIntegration: vi.fn(),
}));

const emptyIntegration = (
  provider: OrganizationIntegration['provider']
): OrganizationIntegration => ({
  provider,
  enabled: false,
  tenantId: '',
  clientId: '',
  domain: '',
  licenseSkuId: '',
  crewId: '',
  hasClientSecret: false,
  hasToken: false,
  ready: false,
  live: true,
});

beforeEach(() => vi.resetAllMocks());

it.each([
  ['microsoft_graph', 'Microsoft 365', 'Tenant-ID', 'Client-Geheimnis'],
  [
    'crewmeister',
    'Crewmeister',
    'Crew-ID, wenn der Token mehrere Crews sieht',
    'Token',
  ],
] as const)(
  'keeps %s editable with one toggle after saving, even while refreshing',
  async (provider, title, fieldLabel, secretLabel) => {
    const user = userEvent.setup();
    const integrations = [
      emptyIntegration('microsoft_graph'),
      emptyIntegration('crewmeister'),
    ];
    vi.mocked(getIntegrations).mockResolvedValueOnce(integrations);
    renderWithProviders(<IntegrationsPage />);
    const heading = await screen.findByRole('heading', { name: title });
    const form = heading.closest('form')!;
    const fields = within(form);
    expect(fields.queryByLabelText(fieldLabel)).not.toBeInTheDocument();
    expect(
      fields.queryByRole('button', { name: 'Zugangsdaten' })
    ).not.toBeInTheDocument();
    const disclosure = fields.getByRole('button', { name: title });
    await user.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(fields.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(saveIntegration).not.toHaveBeenCalled();
    const input = fields.getByLabelText(fieldLabel);
    await user.type(input, 'first-value');
    await user.type(fields.getByLabelText(secretLabel), 'temporary-secret');
    await user.click(fields.getByRole('switch'));
    expect(fields.getByLabelText(fieldLabel)).toBeVisible();

    const saved = {
      ...emptyIntegration(provider),
      enabled: true,
      ...(provider === 'microsoft_graph'
        ? { tenantId: 'first-value', hasClientSecret: true }
        : { crewId: 'first-value', hasToken: true }),
    };
    vi.mocked(saveIntegration).mockResolvedValue(saved);
    // A slow background refresh must not keep the save button disabled.
    vi.mocked(getIntegrations).mockReturnValue(new Promise(() => {}));
    await user.click(fields.getByRole('button', { name: 'Speichern' }));

    await waitFor(() =>
      expect(fields.getByRole('button', { name: 'Speichern' })).toBeEnabled()
    );
    expect(screen.getAllByRole('switch')).toHaveLength(2);
    expect(
      screen.getAllByRole('heading', { name: 'Microsoft 365' })
    ).toHaveLength(1);
    expect(
      screen.getAllByRole('heading', { name: 'Crewmeister' })
    ).toHaveLength(1);
    expect(fields.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('switch', {
        name: provider === 'microsoft_graph' ? 'Crewmeister' : 'Microsoft 365',
      })
    ).toBeInTheDocument();
    expect(fields.getByLabelText(fieldLabel)).toBe(input);
    expect(input).toHaveValue('first-value');
    expect(
      fields.getByLabelText(
        provider === 'microsoft_graph'
          ? secretLabel
          : `${secretLabel} (gespeichert)`
      )
    ).toHaveValue('');

    await user.clear(input);
    await user.type(input, 'edited-value');
    await user.click(fields.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(saveIntegration).toHaveBeenCalledTimes(2));
    expect(saveIntegration).toHaveBeenLastCalledWith(
      provider,
      expect.objectContaining({
        enabled: true,
        [provider === 'microsoft_graph' ? 'tenantId' : 'crewId']:
          'edited-value',
        [provider === 'microsoft_graph' ? 'clientSecret' : 'token']: '',
      })
    );
    await user.click(disclosure);
    expect(fields.queryByLabelText(fieldLabel)).not.toBeInTheDocument();
    expect(fields.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    await user.click(disclosure);
    expect(fields.getByLabelText(fieldLabel)).toHaveValue('edited-value');
  }
);
