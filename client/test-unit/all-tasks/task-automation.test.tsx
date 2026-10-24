import TaskAutomation from '@/features/all-tasks/components/TaskAutomation';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAppQueryClient } from 'test-unit/test-utils';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

afterAll(() => vi.unstubAllGlobals());

const { runIssueSequence } = vi.hoisted(() => ({
  runIssueSequence: vi.fn(),
}));

vi.mock('@/features/all-tasks/api/tasks.api', () => ({
  runIssueSequence,
}));

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
      ready: true,
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
      expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled()
    );
    expect(screen.queryByText('Wird ausgeführt…')).not.toBeInTheDocument();
  });

  it.each([
    ['microsoft_deactivate_account', 'Diese Sequenz wurde bereits ausgeführt.'],
    ['microsoft_send_email', 'Diese E-Mail wurde bereits gesendet.'],
    ['microsoft_send_teams_message', 'Diese Sequenz wurde bereits ausgeführt.'],
  ])(
    'disables completed %s and explains why on hover',
    async (sequence, message) => {
      runIssueSequence.mockClear();
      const beforeRun = vi.fn();
      const user = userEvent.setup();
      renderWithAppQueryClient(
        <TaskAutomation
          taskId="completed-task"
          provider="microsoft_graph"
          sequence={sequence}
          disabled={false}
          completed
          beforeRun={beforeRun}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('bg-muted', 'text-muted-foreground');
      await user.hover(screen.getByLabelText(message));
      expect(await screen.findByRole('tooltip')).toHaveTextContent(message);
      expect(runIssueSequence).not.toHaveBeenCalled();
      expect(beforeRun).not.toHaveBeenCalled();
    }
  );

  it('keeps failed sequences available for retry', async () => {
    runIssueSequence.mockRejectedValueOnce(new Error('Failed'));
    const user = userEvent.setup();
    renderWithAppQueryClient(<TaskAutomationHarness />);
    const button = screen.getByRole('button', { name: 'Go' });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await waitFor(() => expect(button).toBeEnabled());
    expect(
      screen.queryByLabelText('Diese Sequenz wurde bereits ausgeführt.')
    ).not.toBeInTheDocument();
  });
});
