import { renderWithProviders } from './test-utils';
import { MicrosoftLicenseStatus } from '@/features/worker-task-management/components/tasks/MicrosoftLicenseStatus';
import { AutomationRequirementNotice } from '@/features/settings/integrations/AutomationRequirementNotice';
import { screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ licenses: vi.fn() }));
vi.mock('@/features/worker-task-management/api/microsoftLicenses.api', () => ({
  getMicrosoftLicenseAvailability: mocks.licenses,
}));
vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({ user: { organizationId: 'org' } }),
}));
beforeEach(() => vi.clearAllMocks());
it.each([
  [4, '4 Microsoft-Lizenzen verfügbar'],
  [1, '1 Microsoft-Lizenz verfügbar'],
  [0, '0 Microsoft-Lizenzen verfügbar'],
])(
  'shows %i available licenses in the automation notice',
  async (available, text) => {
    mocks.licenses.mockResolvedValue({ available, error: null });
    renderWithProviders(
      <AutomationRequirementNotice sequence="microsoft_create_account" />
    );
    expect(await screen.findByText(text)).toBeInTheDocument();
  }
);
it('does not fetch licenses for account deactivation', () => {
  renderWithProviders(
    <AutomationRequirementNotice sequence="microsoft_deactivate_account" />
  );
  expect(mocks.licenses).not.toHaveBeenCalled();
});
it('shows available seats', async () => {
  mocks.licenses.mockResolvedValue({
    available: 4,
    occupied: 6,
    skuPartNumber: 'BUSINESS',
    error: null,
  });
  renderWithProviders(<MicrosoftLicenseStatus />);
  expect(await screen.findByText('Microsoft 365 - 4')).toBeInTheDocument();
});
it('highlights zero availability in one line', async () => {
  mocks.licenses.mockResolvedValue({ available: 0, occupied: 10, error: null });
  renderWithProviders(<MicrosoftLicenseStatus />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Microsoft 365 - 0'
  );
  expect(screen.getByRole('alert')).toHaveAttribute(
    'title',
    'Die Administration muss eine neue Microsoft-Lizenz kaufen.'
  );
});
it('shows lookup errors without claiming seats are exhausted', async () => {
  mocks.licenses.mockResolvedValue({
    available: null,
    error: 'Microsoft ist nicht erreichbar.',
  });
  renderWithProviders(<MicrosoftLicenseStatus />);
  expect(
    await screen.findByText('Microsoft 365 - Nicht verfügbar')
  ).toBeInTheDocument();
  expect(screen.queryByText('Microsoft 365 - 0')).not.toBeInTheDocument();
});
