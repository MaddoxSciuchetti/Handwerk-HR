import TaskAutomation from '@/features/all-tasks/components/TaskAutomation';
import { getIntegrations } from '@/features/settings/integrations/integrations.api';
import { toast } from 'sonner';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithAppQueryClient,
  renderWithProviders,
} from 'test-unit/test-utils';
import { describe, expect, it, vi } from 'vitest';

const { runIssueSequence } = vi.hoisted(() => ({
  runIssueSequence: vi.fn(),
}));

vi.mock('@/features/all-tasks/api/tasks.api', () => ({
  runIssueSequence,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/features/settings/integrations/integrations.api', () => ({
  getIntegrations: vi.fn(async () => [
    {
      provider: 'microsoft_graph',
      enabled: true,
      tenantId: 'tenant',
      clientId: 'client',
      domain: 'firma.de',
      licenseSkuId: 'sku',
      crewId: '',
      hasClientSecret: true,
      hasToken: false,
      live: true,
    },
  ]),
}));

function TaskAutomationHarness() {
  return (
    <TaskAutomation
      taskId="task-1"
      provider="microsoft_graph"
      sequence="microsoft_deactivate_account"
      disabled={false}
    />
  );
}

describe('TaskAutomation', () => {
  it('allows a clearly labelled simulation with no credentials and live execution off', async () => {
    vi.mocked(getIntegrations).mockResolvedValueOnce([
      {
        provider: 'microsoft_graph',
        enabled: true,
        simulated: true,
        live: false,
        tenantId: '',
        clientId: '',
        domain: '',
        licenseSkuId: '',
        crewId: '',
        hasClientSecret: false,
        hasToken: false,
      },
    ]);
    runIssueSequence.mockResolvedValueOnce(undefined);
    renderWithProviders(<TaskAutomationHarness />);
    expect(await screen.findByRole('note')).toHaveTextContent('Testmodus');
    const button = screen.getByRole('button', { name: 'Go' });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.setup().click(button);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Die Sequenz wurde simuliert. Die Testaufgabe ist erledigt.'
      )
    );
  });

  it('shows a purple loading indicator while an automation is running', async () => {
    let resolveAutomation: (() => void) | undefined;
    runIssueSequence.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveAutomation = resolve;
      })
    );
    const user = userEvent.setup();
    renderWithAppQueryClient(<TaskAutomationHarness />);

    const runButton = screen.getByRole('button', { name: 'Go' });
    await user.click(runButton);

    expect(runButton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status', { name: 'Loading' })).toHaveClass(
      'text-(--automation-accent)'
    );
    expect(screen.getByText('Wird ausgeführt…')).toBeInTheDocument();

    resolveAutomation?.();
    await waitFor(() =>
      expect(runButton).toHaveAttribute('aria-busy', 'false')
    );
  });
});
