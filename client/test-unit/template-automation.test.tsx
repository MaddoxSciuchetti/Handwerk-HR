import { TemplateApplyPrompt } from '@/features/worker-task-management/components/tasks/TemplateApplyPrompt';
import { TaskStatusIcon } from '@/features/all-tasks/components/ui/TaskStatusIcons';
import { renderWithProviders } from './test-utils';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  preview: vi.fn(),
  apply: vi.fn(),
  mail: vi.fn(),
  channels: vi.fn(),
}));
vi.mock('@/features/template-tasks/hooks/useGetTemplates', () => ({
  useGetTemplates: () => ({
    data: [
      { id: 'automated', name: 'Automatisch', _count: { items: 2 } },
      { id: 'manual', name: 'Manuell', _count: { items: 1 } },
    ],
    isLoading: false,
  }),
}));
vi.mock(
  '@/features/worker-task-management/api/templateApplication.api',
  () => ({ previewTemplate: mocks.preview, applyTemplate: mocks.apply })
);
vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({ user: { id: 'user', organizationId: 'org' } }),
}));
vi.mock('@/features/worker-task-management/api/engagementMail.api', () => ({
  engagementMailKey: (id: string) => ['mail', id],
  getEngagementMailRecipients: mocks.mail,
  getMicrosoftMailAddresses: async () => ({
    addresses: [{ email: 'hr@example.com', label: 'HR', kind: 'mailbox' }],
  }),
  recipientKey: (recipient: { kind: string; groupId: string }) =>
    `${recipient.kind}:${recipient.groupId}`,
}));
vi.mock('@/features/microsoft-teams/teams.api', () => ({
  getChannels: mocks.channels,
  getConnection: async () => ({
    ready: true,
    live: true,
    status: 'connected',
    account: { username: 'user@example.com' },
  }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const target = { workerId: 'worker', engagementId: 'engagement', label: 'Ada' };
const automation = {
  id: 'a',
  title: 'Microsoft-Konto',
  sequence: 'microsoft_create_account',
  integrationProvider: 'microsoft_graph',
  blockedReason: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  mocks.preview.mockImplementation(
    async (_worker, _engagement, templateId) => ({
      id: templateId,
      name: templateId === 'manual' ? 'Manuell' : 'Automatisch',
      items:
        templateId === 'manual'
          ? [{ ...automation, sequence: null, integrationProvider: null }]
          : [
              automation,
              {
                ...automation,
                id: 'm',
                title: 'Arbeitskleidung',
                sequence: null,
                integrationProvider: null,
              },
            ],
    })
  );
  mocks.apply.mockResolvedValue({
    count: 2,
    issueIds: ['a', 'b'],
    outcomes: [],
    running: false,
  });
  mocks.mail.mockResolvedValue({
    selected: [],
    groups: [{ id: 'team', displayName: 'Team' }],
    channels: [],
    groupsError: null,
    channelsError: null,
  });
  mocks.channels.mockResolvedValue({
    channels: [
      { teamId: 'team', channelId: 'channel', label: 'Team · Allgemein' },
    ],
    warnings: [],
  });
});

async function selectTemplate(name = 'Automatisch') {
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: new RegExp(name) })
  );
  await screen.findByRole('button', {
    name: name === 'Manuell' ? 'Aufgaben erstellen' : 'Automatisierung starten',
  });
  return user;
}

describe('template automation popup', () => {
  it('opens the existing bottom picker when a target becomes eligible', async () => {
    const { rerender } = renderWithProviders(
      <TemplateApplyPrompt targets={[]} />
    );
    expect(
      screen.queryByRole('region', { name: 'Template auswählen' })
    ).not.toBeInTheDocument();
    rerender(<TemplateApplyPrompt targets={[target]} />);
    expect(
      await screen.findByRole('region', { name: 'Template auswählen' })
    ).toBeInTheDocument();
  });
  it('closing creates nothing and does not auto-open again after remounting', async () => {
    const view = renderWithProviders(
      <TemplateApplyPrompt targets={[target]} />
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Schließen' })
    );
    expect(mocks.apply).not.toHaveBeenCalled();
    view.unmount();
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    expect(
      screen.queryByRole('region', { name: 'Template auswählen' })
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Template wählen' })
    );
    expect(
      screen.getByRole('region', { name: 'Template auswählen' })
    ).toBeInTheDocument();
  });
  it('keeps descriptions and immediate-execution notice in expandable details', async () => {
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    await selectTemplate();
    const details = screen.getByText('Mehr anzeigen').closest('details')!;
    expect(details).not.toHaveAttribute('open');
    expect(within(details).getByText('Microsoft-Konto')).toBeInTheDocument();
    expect(
      within(details).queryByText('Arbeitskleidung')
    ).not.toBeInTheDocument();
    expect(
      within(details).getByText(
        'Diese Aktionen werden nach dem Start sofort ausgeführt.'
      )
    ).toBeInTheDocument();
    expect(mocks.apply).not.toHaveBeenCalled();
  });
  it('supports creation with and without automation', async () => {
    const view = renderWithProviders(
      <TemplateApplyPrompt targets={[target]} />
    );
    const user = await selectTemplate();
    await user.click(
      screen.getByRole('button', { name: 'Ohne Automatisierung' })
    );
    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(
        'worker',
        'automated',
        expect.objectContaining({
          runAutomation: false,
          choices: {},
          workerEngagementId: 'engagement',
          idempotencyKey: expect.any(String),
        })
      )
    );
    view.unmount();
    sessionStorage.clear();
    mocks.apply.mockClear();
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    await selectTemplate();
    await user.click(
      screen.getByRole('button', { name: 'Automatisierung starten' })
    );
    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(
        'worker',
        'automated',
        expect.objectContaining({ runAutomation: true })
      )
    );
  });
  it('skips the automation question for manual templates', async () => {
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    const user = await selectTemplate('Manuell');
    expect(
      screen.queryByText('Automatisierung starten?')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Mehr anzeigen')).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Aufgaben erstellen' })
    );
    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(
        'worker',
        'manual',
        expect.objectContaining({ runAutomation: false })
      )
    );
  });
  it('collects sender and recipients before enabling mail automation', async () => {
    mocks.preview.mockResolvedValue({
      id: 'automated',
      name: 'Automatisch',
      items: [
        {
          ...automation,
          sequence: 'microsoft_send_email',
          title: 'Willkommensmail',
        },
      ],
    });
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    const user = await selectTemplate();
    const run = screen.getByRole('button', { name: 'Automatisierung starten' });
    expect(run).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Ohne Automatisierung' })
    ).toBeEnabled();
    await user.selectOptions(
      await screen.findByLabelText('Absender für Willkommensmail'),
      'hr@example.com'
    );
    await user.click(screen.getByText('Empfänger wählen (0)'));
    await user.click(await screen.findByRole('checkbox', { name: 'Team' }));
    expect(run).toBeEnabled();
    await user.click(run);
    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(
        'worker',
        'automated',
        expect.objectContaining({
          choices: {
            a: expect.objectContaining({
              senderAddress: 'hr@example.com',
              recipients: [expect.objectContaining({ groupId: 'team' })],
            }),
          },
        })
      )
    );
  });
  it('collects Teams channels and resets choices when switching employee', async () => {
    mocks.preview.mockResolvedValue({
      id: 'automated',
      name: 'Automatisch',
      items: [
        {
          ...automation,
          sequence: 'microsoft_send_teams_message',
          title: 'Teams-Info',
        },
      ],
    });
    renderWithProviders(
      <TemplateApplyPrompt
        targets={[
          target,
          {
            ...target,
            workerId: 'worker-2',
            engagementId: 'second',
            label: 'Grace',
          },
        ]}
      />
    );
    const user = await selectTemplate();
    expect(
      screen.getByRole('button', { name: 'Automatisierung starten' })
    ).toBeDisabled();
    await user.click(screen.getByText('Teams-Kanäle wählen (0)'));
    await user.click(
      await screen.findByRole('checkbox', { name: 'Team · Allgemein' })
    );
    expect(
      screen.getByRole('button', { name: 'Automatisierung starten' })
    ).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Grace' }));
    await selectTemplate();
    expect(
      screen.getByRole('button', { name: 'Automatisierung starten' })
    ).toBeDisabled();
    expect(mocks.preview).toHaveBeenCalledWith(
      'worker-2',
      'second',
      'automated'
    );
  });
  it('resets choices when changing template', async () => {
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    const user = await selectTemplate();
    await user.click(
      screen.getByRole('button', { name: 'Zurück zur Template-Auswahl' })
    );
    await selectTemplate('Manuell');
    expect(
      screen.queryByRole('button', { name: 'Automatisierung starten' })
    ).not.toBeInTheDocument();
  });
  it('accepts closing during execution without cancelling or submitting twice', async () => {
    let finish!: (result: unknown) => void;
    mocks.apply.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    const user = await selectTemplate();
    await user.click(
      screen.getByRole('button', { name: 'Automatisierung starten' })
    );
    expect(
      screen.getByRole('button', { name: 'Automatisierung starten' })
    ).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(mocks.apply).toHaveBeenCalledTimes(1);
    await act(async () =>
      finish({
        count: 1,
        issueIds: ['a'],
        outcomes: [{ issueId: 'a', status: 'completed' }],
        running: false,
      })
    );
  });
  it('renders the error state as an accessible red X', () => {
    renderWithProviders(<TaskStatusIcon status="error" />);
    const icon = screen.getByRole('img', { name: 'Fehler' });
    expect(icon.querySelector('circle')).toHaveAttribute('fill', '#DC2626');
  });
});
