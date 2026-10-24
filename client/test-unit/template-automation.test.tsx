import { TemplateAutomationProgress } from '@/features/worker-task-management/components/tasks/TemplateAutomationProgress';
import { QueryClient } from '@tanstack/react-query';
import { TemplateApplyPrompt } from '@/features/worker-task-management/components/tasks/TemplateApplyPrompt';
import { TaskStatusIcon } from '@/features/all-tasks/components/ui/TaskStatusIcons';
import { renderWithProviders } from './test-utils';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  demo: false,
  preview: vi.fn(),
  apply: vi.fn(),
  savedRun: vi.fn(),
  dismiss: vi.fn(),
  mail: vi.fn(),
  senders: vi.fn(),
  channels: vi.fn(),
  connection: vi.fn(),
  connect: vi.fn(),
}));
vi.mock('@/config/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/config/env')>()),
  get TEMPLATE_DEMO_MODE() {
    return mocks.demo;
  },
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
  () => ({
    previewTemplate: mocks.preview,
    applyTemplate: mocks.apply,
    getTemplateApplication: mocks.savedRun,
    dismissTemplateApplication: mocks.dismiss,
  })
);
vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({ user: { id: 'user', organizationId: 'org' } }),
}));
vi.mock('@/features/worker-task-management/api/engagementMail.api', () => ({
  engagementMailKey: (id: string) => ['mail', id],
  getEngagementMailRecipients: mocks.mail,
  getMicrosoftMailAddresses: mocks.senders,
  recipientKey: (recipient: { kind: string; groupId: string }) =>
    `${recipient.kind}:${recipient.groupId}`,
}));
vi.mock('@/features/microsoft-teams/teams.api', () => ({
  getChannels: mocks.channels,
  getConnection: mocks.connection,
  connectTeams: mocks.connect,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/worker-task-management/api/microsoftLicenses.api', () => ({
  getMicrosoftLicenseAvailability: vi.fn(async () => ({
    available: 3,
    occupied: 2,
    skuPartNumber: 'BUSINESS',
    error: null,
  })),
}));
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
  mocks.demo = false;
  mocks.savedRun.mockResolvedValue(null);
  mocks.dismiss.mockResolvedValue({ dismissed: true });
  sessionStorage.clear();
  mocks.connection.mockResolvedValue({
    ready: true,
    live: true,
    status: 'connected',
    account: { username: 'user@example.com' },
  });
  mocks.connect.mockRejectedValue(new Error('Connection failed'));
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
  mocks.senders.mockResolvedValue({
    addresses: [
      { email: 'hr@example.com', label: 'HR', kind: 'mailbox' },
      { email: 'office@example.com', label: 'Office', kind: 'mailbox' },
    ],
    error: null,
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

it('spins the opener while the chosen template loads', async () => {
  mocks.preview.mockReturnValue(new Promise(() => {}));
  renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: /Automatisch/ })
  );
  const opener = screen.getByRole('button', { name: 'Template wählen' });
  expect(opener).toHaveAttribute('aria-busy', 'true');
  expect(opener.querySelector('.animate-spin')).toBeInTheDocument();
  expect(screen.queryByText('Template wird geladen…')).not.toBeInTheDocument();
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
    expect(screen.queryByText(/Microsoft 365 -/)).not.toBeInTheDocument();
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
  it('shows only automated tasks with expandable configuration', async () => {
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    await selectTemplate();
    const trigger = screen.getByRole('button', { name: 'Microsoft-Konto' });
    const details = trigger.closest('[data-slot=accordion-item]')!;
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(within(details).getByText('Microsoft-Konto')).toBeInTheDocument();
    expect(
      within(details).queryByText('Arbeitskleidung')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Mehr anzeigen')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Automatisierung starten?')
    ).not.toBeInTheDocument();
    expect(mocks.apply).not.toHaveBeenCalled();
  });
  it('shows Microsoft license availability inside account creation in demo mode', async () => {
    mocks.demo = true;
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    const user = await selectTemplate();
    await user.click(screen.getByRole('button', { name: 'Microsoft-Konto' }));
    const account = screen.getByRole('group', { name: 'Microsoft-Konto' });
    expect(
      await within(account).findByText('Microsoft 365 - 2/5')
    ).toBeInTheDocument();
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
    await user.click(screen.getByText('Willkommensmail'));
    const run = screen.getByRole('button', { name: 'Automatisierung starten' });
    expect(run).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Ohne Automatisierung' })
    ).toBeEnabled();
    await user.click(
      await screen.findByRole('combobox', {
        name: 'Absender für Willkommensmail',
      })
    );
    await user.click(
      await screen.findByRole('option', { name: 'HR', exact: true })
    );
    await user.click(
      screen.getByRole('button', { name: 'Empfänger für Willkommensmail' })
    );
    await user.click(await screen.findByRole('checkbox', { name: 'Team' }));
    expect(run).toBeEnabled();
    await user.click(
      screen.getByRole('combobox', { name: 'Absender für Willkommensmail' })
    );
    await user.click(
      await screen.findByRole('option', { name: 'Office', exact: true })
    );
    await user.click(
      screen.getByRole('button', { name: 'Empfänger für Willkommensmail' })
    );
    await user.click(screen.getByRole('checkbox', { name: 'Team' }));
    expect(run).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: 'Team' }));
    await user.click(screen.getByText('Willkommensmail'));
    await user.click(screen.getByText('Willkommensmail'));
    expect(
      screen.getByRole('combobox', { name: 'Absender für Willkommensmail' })
    ).toHaveTextContent('Office');
    await user.click(run);
    await waitFor(() =>
      expect(mocks.apply).toHaveBeenCalledWith(
        'worker',
        'automated',
        expect.objectContaining({
          choices: {
            a: expect.objectContaining({
              senderAddress: 'office@example.com',
              recipients: [expect.objectContaining({ groupId: 'team' })],
            }),
          },
        })
      )
    );
  });
  it('shows a shared Microsoft error once across lookups and automated tasks', async () => {
    const error =
      'Das Client-Secret der Microsoft-365-App ist abgelaufen. Bitte die Administration kontaktieren.';
    mocks.preview.mockResolvedValue({
      id: 'automated',
      name: 'Automatisch',
      items: ['a', 'b'].map((id) => ({
        ...automation,
        id,
        sequence: 'microsoft_send_email',
        title: `Mail ${id}`,
      })),
    });
    mocks.mail.mockResolvedValue({
      selected: [],
      groups: [],
      channels: [],
      groupsError: error,
      channelsError: error,
    });
    mocks.senders.mockResolvedValue({ addresses: [], error });
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    await selectTemplate();
    await screen.findByRole('alert');
    expect(screen.getAllByText(error)).toHaveLength(1);
    expect(
      screen.getByRole('link', { name: 'Microsoft-Zugangsdaten prüfen' })
    ).toHaveAttribute('href', '/settings/integrations');
    expect(
      screen.getByRole('button', { name: 'Automatisierung starten' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Ohne Automatisierung' })
    ).toBeEnabled();
  });
  it('shows sender lookup errors even when the recipient lookups succeed', async () => {
    mocks.preview.mockResolvedValue({
      id: 'automated',
      name: 'Automatisch',
      items: [{ ...automation, sequence: 'microsoft_send_email' }],
    });
    mocks.senders.mockResolvedValue({
      addresses: [],
      error: 'App-Zugangsdaten prüfen.',
    });
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    await selectTemplate();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'App-Zugangsdaten prüfen.'
    );
  });
  it('replaces the legacy email authentication error with credential guidance and avoids a false empty state', async () => {
    mocks.preview.mockResolvedValue({
      id: 'automated',
      name: 'Automatisch',
      items: [{ ...automation, sequence: 'microsoft_send_email' }],
    });
    mocks.mail.mockResolvedValue({
      selected: [],
      groups: [],
      channels: [],
      groupsError: 'Microsoft Graph hat die Anmeldung abgelehnt.',
      channelsError: 'Microsoft Graph hat die Anmeldung abgelehnt.',
    });
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    const user = await selectTemplate();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Mandanten-ID, Client-ID und das Client-Secret prüfen und korrigieren'
    );
    expect(
      screen.queryByText('Microsoft Graph hat die Anmeldung abgelehnt.')
    ).not.toBeInTheDocument();
    await user.click(screen.getByText('Microsoft-Konto'));
    await user.click(
      screen.getByRole('button', { name: 'Empfänger für Microsoft-Konto' })
    );
    expect(
      screen.queryByText('Keine Empfänger vorhanden.')
    ).not.toBeInTheDocument();
  });
  it.each(['disconnected', 'reconnect_required'])(
    'offers Microsoft sign-in once for Teams state %s in the shared error area',
    async (status) => {
      mocks.preview.mockResolvedValue({
        id: 'automated',
        name: 'Automatisch',
        items: ['a', 'b'].map((id) => ({
          ...automation,
          id,
          sequence: 'microsoft_send_teams_message',
          title: `Teams ${id}`,
          blockedReason:
            'Bitte Microsoft Teams in den Einstellungen verbinden.',
        })),
      });
      mocks.connection.mockResolvedValue({
        ready: true,
        live: true,
        status,
        account: null,
      });
      renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
      const user = await selectTemplate();
      const area = await screen.findByRole('region', {
        name: 'Probleme mit Automatisierungen',
      });
      expect(within(area).getAllByRole('alert')).toHaveLength(1);
      expect(area).toHaveTextContent('Melde dich erneut bei Microsoft an');
      expect(
        screen.queryByText(
          'Bitte Microsoft Teams in den Einstellungen verbinden.'
        )
      ).not.toBeInTheDocument();
      expect(mocks.channels).not.toHaveBeenCalled();
      await user.click(
        within(area).getByRole('button', {
          name: 'Erneut bei Microsoft anmelden',
        })
      );
      await waitFor(() => expect(mocks.connect).toHaveBeenCalledTimes(1));
      expect(
        await screen.findByRole('link', { name: 'Teams-Einstellungen öffnen' })
      ).toHaveAttribute('href', '/settings/integrations');
      expect(screen.getAllByRole('alert')).toHaveLength(1);
    }
  );
  it('offers sign-in when channel loading discovers an expired Teams session', async () => {
    mocks.preview.mockResolvedValue({
      id: 'automated',
      name: 'Automatisch',
      items: [{ ...automation, sequence: 'microsoft_send_teams_message' }],
    });
    mocks.channels.mockRejectedValueOnce({
      code: 'reconnect_required',
      message: 'Bitte Microsoft Teams erneut verbinden.',
    });
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    await selectTemplate();
    expect(
      await screen.findByRole('button', {
        name: 'Erneut bei Microsoft anmelden',
      })
    ).toBeEnabled();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });
  it('directs Teams configuration failures to organization credentials rather than sign-in', async () => {
    mocks.preview.mockResolvedValue({
      id: 'automated',
      name: 'Automatisch',
      items: [
        {
          ...automation,
          sequence: 'microsoft_send_teams_message',
          blockedReason:
            'Bitte Microsoft Teams in den Einstellungen verbinden.',
        },
      ],
    });
    mocks.connection.mockResolvedValue({
      ready: false,
      live: true,
      status: 'disconnected',
      account: null,
    });
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    await selectTemplate();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Microsoft-Integration der Organisation ist nicht vollständig eingerichtet'
    );
    expect(
      screen.getByRole('link', { name: 'Microsoft-Zugangsdaten prüfen' })
    ).toHaveAttribute('href', '/settings/integrations');
    expect(
      screen.queryByRole('button', { name: 'Erneut bei Microsoft anmelden' })
    ).not.toBeInTheDocument();
  });
  it('puts email and Teams recovery actions in the same area outside task dropdowns', async () => {
    mocks.preview.mockResolvedValue({
      id: 'automated',
      name: 'Automatisch',
      items: [
        { ...automation, sequence: 'microsoft_send_email' },
        {
          ...automation,
          id: 'teams',
          sequence: 'microsoft_send_teams_message',
        },
      ],
    });
    mocks.senders.mockResolvedValue({
      addresses: [],
      error: 'Microsoft Graph hat die Anmeldung abgelehnt.',
    });
    mocks.connection.mockResolvedValue({
      ready: true,
      live: true,
      status: 'reconnect_required',
      account: null,
    });
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    await selectTemplate();
    const area = await screen.findByRole('region', {
      name: 'Probleme mit Automatisierungen',
    });
    await within(area).findByRole('button', {
      name: 'Erneut bei Microsoft anmelden',
    });
    expect(
      within(area).getByRole('link', { name: 'Microsoft-Zugangsdaten prüfen' })
    ).toBeInTheDocument();
    expect(area.closest('details')).toBeNull();
    expect(within(area).getAllByRole('alert')).toHaveLength(2);
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
    await user.click(screen.getByText('Teams-Info'));
    await user.click(
      screen.getByRole('button', { name: 'Empfänger für Teams-Info' })
    );
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
  it('collapses configuration and keeps progress visible after the target disappears and until final task refresh completes', async () => {
    let finish!: (result: unknown) => void;
    let finishRefresh!: () => void;
    mocks.apply.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const view = renderWithProviders(
      <TemplateApplyPrompt targets={[target]} />
    );
    const user = await selectTemplate();
    await user.click(
      screen.getByRole('button', { name: 'Automatisierung starten' })
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'data-slot',
      'progress'
    );
    expect(
      screen.queryByRole('button', { name: 'Automatisierung starten' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Schließen' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Microsoft-Konto' })
    ).not.toBeInTheDocument();
    view.rerender(<TemplateApplyPrompt targets={[]} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    const refresh = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    const invalidate = vi
      .spyOn(QueryClient.prototype, 'invalidateQueries')
      .mockReturnValue(refresh);
    try {
      await act(async () =>
        finish({
          count: 1,
          issueIds: ['a'],
          outcomes: [{ issueId: 'a', status: 'completed' }],
          running: false,
        })
      );
      expect(await screen.findByRole('status')).toHaveTextContent(
        'Aufgabenstatus wird aktualisiert'
      );
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(mocks.apply).toHaveBeenCalledTimes(1);
      await act(async () => finishRefresh());
      await waitFor(() =>
        expect(screen.getByRole('progressbar')).toHaveAttribute(
          'aria-valuenow',
          '100'
        )
      );
    } finally {
      invalidate.mockRestore();
    }
  });
  it('renders the error state as an accessible red X', () => {
    renderWithProviders(<TaskStatusIcon status="error" />);
    const icon = screen.getByRole('img', { name: 'Fehler' });
    expect(icon.querySelector('circle')).toHaveAttribute('fill', '#DC2626');
  });
});

it('shows progress without automation and excludes tasks with no execution outcome, including saved results', async () => {
  mocks.demo = true;
  let finish!: (result: unknown) => void;
  mocks.apply.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  const result = {
    count: 1,
    issueIds: ['a'],
    outcomes: [],
    running: false,
    tasks: [
      {
        id: 'a',
        title: 'Microsoft-Konto',
        status: 'open',
        sequence: 'microsoft_create_account',
      },
    ],
  };
  const view = renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
  const user = await selectTemplate();
  await user.click(
    screen.getByRole('button', { name: 'Ohne Automatisierung' })
  );
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Aufgaben werden erstellt'
  );
  expect(
    screen.queryByRole('region', { name: 'Template auswählen' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Template wählen' })
  ).toBeDisabled();
  await act(async () => finish(result));
  await user.click(
    await screen.findByRole('button', { name: 'Ergebnisse anzeigen' })
  );
  expect(screen.getByText('Keine Automatisierungen ausgeführt.')).toBeVisible();
  expect(screen.queryByText('Microsoft-Konto')).not.toBeInTheDocument();
  view.unmount();
  mocks.savedRun.mockResolvedValue({ templateName: 'Automatisch', result });
  renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
  expect(
    await screen.findByText('Keine Automatisierungen ausgeführt.')
  ).toBeVisible();
  expect(screen.queryByText('Microsoft-Konto')).not.toBeInTheDocument();
});

it('shows one progress line above the shadcn progress bar and waits past ten seconds if needed', () => {
  vi.useFakeTimers();
  const view = renderWithProviders(
    <TemplateAutomationProgress mocked synchronizing={false} />
  );
  try {
    expect(screen.getByRole('status')).toHaveTextContent(
      'Automatisierung wird vorbereitet'
    );
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Anfrage an die Integration wird simuliert'
    );
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Warte auf simulierte Erfolgsbestätigung'
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '70'
    );
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '95'
    );
    view.rerender(<TemplateAutomationProgress mocked synchronizing />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Aufgabenstatus wird aktualisiert'
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '99'
    );
  } finally {
    view.unmount();
    vi.useRealTimers();
  }
});

it('keeps the bottom button and resets template selection for another demo run', async () => {
  mocks.demo = true;
  renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
  const user = await selectTemplate();
  await user.click(
    screen.getByRole('button', { name: 'Automatisierung starten' })
  );
  await waitFor(() =>
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100'
    )
  );
  await user.click(
    await screen.findByRole('button', { name: 'Ergebnisse anzeigen' })
  );
  await user.click(screen.getByRole('button', { name: 'Template Hinzufügen' }));
  await selectTemplate('Manuell');
  await user.click(screen.getByRole('button', { name: 'Aufgaben erstellen' }));
  await waitFor(() => expect(mocks.apply).toHaveBeenCalledTimes(2));
  expect(mocks.apply.mock.calls[0][2].idempotencyKey).not.toBe(
    mocks.apply.mock.calls[1][2].idempotencyKey
  );
});

it('reopens the completed run with named task statuses and provider details without applying again', async () => {
  mocks.demo = true;
  mocks.apply.mockResolvedValue({
    count: 3,
    issueIds: ['a', 'b', 'c'],
    running: false,
    tasks: [
      {
        id: 'a',
        title: 'Microsoft-Konto',
        status: 'done',
        sequence: 'microsoft_create_account',
      },
      {
        id: 'b',
        title: 'Teams-Nachricht',
        status: 'error',
        sequence: 'microsoft_send_teams_message',
      },
      { id: 'c', title: 'Arbeitskleidung', status: 'open', sequence: null },
    ],
    outcomes: [
      {
        issueId: 'a',
        status: 'completed',
        message: 'Lokale Simulation erfolgreich.',
      },
      {
        issueId: 'b',
        status: 'failed',
        message: 'Teams konnte nicht erreicht werden.',
      },
    ],
  });
  renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
  const user = await selectTemplate();
  await user.click(
    screen.getByRole('button', { name: 'Automatisierung starten' })
  );
  await waitFor(() =>
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100'
    )
  );
  await user.click(
    screen.getByRole('button', { name: 'Ausgeführte Aufgaben anzeigen' })
  );
  expect(
    screen.queryByRole('region', { name: 'Template auswählen' })
  ).not.toBeInTheDocument();
  const results = screen.getByRole('region', {
    name: 'Ergebnis der Automatisierung',
  });
  expect(
    within(results).getByRole('group', {
      name: /Microsoft-Konto: Abgeschlossen/,
    })
  ).toBeInTheDocument();
  expect(
    within(results).getByRole('button', {
      name: /Teams-Nachricht: Fehlgeschlagen/,
    })
  ).toBeInTheDocument();
  expect(
    within(results).queryByText('Arbeitskleidung')
  ).not.toBeInTheDocument();
  expect(
    within(results).queryByText('Ada · 2 Automatisierungen')
  ).not.toBeInTheDocument();
  expect(within(results).queryByText('Automatisch')).not.toBeInTheDocument();
  expect(
    within(results).queryByRole('button', {
      name: /Microsoft-Konto: Abgeschlossen/,
    })
  ).not.toBeInTheDocument();
  expect(
    within(results).queryByText('Lokale Simulation erfolgreich.')
  ).not.toBeInTheDocument();
  await user.click(
    within(results).getByRole('button', {
      name: /Teams-Nachricht: Fehlgeschlagen/,
    })
  );
  expect(
    within(results).getByText('Teams konnte nicht erreicht werden.')
  ).toBeVisible();
  await user.click(within(results).getByRole('button', { name: 'Schließen' }));
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: 'Ergebnis der Automatisierung' })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Ergebnisse anzeigen' }));
  expect(
    screen.getByRole('region', { name: 'Ergebnis der Automatisierung' })
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Leiste schließen' }));
  expect(mocks.dismiss).toHaveBeenCalledWith('worker', 'engagement');
  expect(
    screen.queryByRole('button', { name: 'Template wählen' })
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Ergebnisse anzeigen' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: 'Ergebnis der Automatisierung' })
  ).not.toBeInTheDocument();
  expect(mocks.apply).toHaveBeenCalledTimes(1);
});

it('expands horizontally with progress beside the icon while preserving the original height', async () => {
  let finish!: (result: unknown) => void;
  mocks.apply.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
  const user = await selectTemplate();
  const icon = screen.getByRole('button', { name: 'Template wählen' });
  expect(icon).toHaveClass('size-11');
  expect(icon.parentElement).toHaveClass('h-11');
  await user.click(
    screen.getByRole('button', { name: 'Automatisierung starten' })
  );
  expect(icon).toBeDisabled();
  expect(icon.parentElement).toHaveClass('h-11');
  expect(icon.parentElement).toContainElement(screen.getByRole('progressbar'));
  expect(icon).not.toContainElement(screen.getByRole('progressbar'));
  expect(icon.parentElement).toHaveClass('w-80');
  await act(async () =>
    finish({
      count: 1,
      issueIds: ['a'],
      outcomes: [{ issueId: 'a', status: 'completed' }],
      running: false,
    })
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Ergebnisse anzeigen' })
    ).toBeEnabled()
  );
  expect(icon.parentElement).toHaveClass('h-11');
  expect(screen.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '100'
  );
});

it('loads saved tasks when remounting and refreshes their current statuses when reopening results', async () => {
  mocks.demo = true;
  mocks.savedRun.mockResolvedValue({
    templateName: 'Onboarding Demo',
    result: {
      count: 1,
      issueIds: ['stored-task'],
      outcomes: [{ issueId: 'stored-task', status: 'completed' }],
      running: false,
      tasks: [
        {
          id: 'stored-task',
          title: 'Microsoft-Konto',
          status: 'done',
          sequence: 'microsoft_create_account',
        },
      ],
    },
  });
  const view = renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
  expect(
    await screen.findByRole('group', {
      name: 'Microsoft-Konto: Abgeschlossen',
    })
  ).toBeInTheDocument();
  expect(mocks.apply).not.toHaveBeenCalled();
  view.unmount();
  renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
  expect(
    await screen.findByRole('group', {
      name: 'Microsoft-Konto: Abgeschlossen',
    })
  ).toBeInTheDocument();
  expect(mocks.savedRun).toHaveBeenCalledWith('worker', 'engagement');
  expect(
    screen.queryByText('Ada · 1 Automatisierungen')
  ).not.toBeInTheDocument();
  expect(screen.queryByText('Onboarding Demo')).not.toBeInTheDocument();
  expect(mocks.apply).not.toHaveBeenCalled();
});

it('hides the finished bar after it is closed and keeps it hidden on a later visit', async () => {
  mocks.demo = true;
  const stored = {
    templateName: 'Automatisch',
    dismissed: false,
    result: { count: 1, issueIds: ['a'], outcomes: [], running: false },
  };
  mocks.savedRun.mockResolvedValue(stored);
  const view = renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
  await screen.findByRole('region', {
    name: 'Ergebnis der Automatisierung',
  });
  await userEvent.click(
    screen.getByRole('button', { name: 'Leiste schließen' })
  );
  expect(mocks.dismiss).toHaveBeenCalledWith('worker', 'engagement');
  expect(
    screen.queryByRole('button', { name: 'Template wählen' })
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  view.unmount();
  renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
  expect(
    screen.queryByRole('button', { name: 'Template wählen' })
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  sessionStorage.clear();
  mocks.savedRun.mockResolvedValue({ ...stored, dismissed: true });
  renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Template wählen' })
    ).not.toBeInTheDocument()
  );
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: 'Ergebnis der Automatisierung' })
  ).not.toBeInTheDocument();
  expect(mocks.apply).not.toHaveBeenCalled();
});

describe('work email required for Microsoft removal', () => {
  beforeEach(() => {
    mocks.preview.mockResolvedValue({
      id: 'automated', name: 'Offboarding', requiresWorkEmail: true,
      items: [{ ...automation, sequence: 'microsoft_deactivate_account' }],
    });
  });

  it.each(['Automatisierung starten', 'Ohne Automatisierung'])(
    'requires a valid work email before %s and submits it',
    async (action) => {
      renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
      const user = await selectTemplate();
      const start = screen.getByRole('button', { name: 'Automatisierung starten' });
      const manual = screen.getByRole('button', { name: 'Ohne Automatisierung' });
      expect(start).toBeDisabled();
      expect(manual).toBeDisabled();
      const email = screen.getByRole('textbox', { name: 'Arbeits-E-Mail' });
      await user.type(email, 'invalid');
      expect(start).toBeDisabled();
      expect(manual).toBeDisabled();
      await user.clear(email);
      await user.type(email, 'worker@example.com');
      await user.click(screen.getByRole('button', { name: action }));
      await waitFor(() => expect(mocks.apply).toHaveBeenCalledWith(
        'worker', 'automated', expect.objectContaining({
          workEmail: 'worker@example.com',
          runAutomation: action === 'Automatisierung starten',
        })
      ));
    }
  );

  it('hides the email prompt when an email is already saved', async () => {
    mocks.preview.mockResolvedValue({
      id: 'automated', name: 'Offboarding', requiresWorkEmail: false,
      items: [{ ...automation, sequence: 'microsoft_deactivate_account' }],
    });
    renderWithProviders(<TemplateApplyPrompt targets={[target]} />);
    await selectTemplate();
    expect(screen.queryByRole('textbox', { name: 'Arbeits-E-Mail' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Automatisierung starten' })).toBeEnabled();
  });
});
