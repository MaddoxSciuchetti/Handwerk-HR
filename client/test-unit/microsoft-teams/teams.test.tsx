import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { TeamsConnectionCard } from '@/features/microsoft-teams/TeamsConnectionCard';
import { IntegrationsPage } from '@/features/settings/integrations/IntegrationsPage';
import {
  TeamsSendAction,
  TeamsSendForm,
} from '@/features/microsoft-teams/TeamsSendAction';
import type { Preview } from '@/features/microsoft-teams/teams.api';

const mocks = vi.hoisted(() => ({
  getConnection: vi.fn(),
  connectTeams: vi.fn(),
  disconnectTeams: vi.fn(),
  getChannels: vi.fn(),
  getTeamsPreview: vi.fn(),
  sendTeams: vi.fn(),
  reviewDelivery: vi.fn(),
  getIntegrations: vi.fn(),
  saveIntegration: vi.fn(),
  user: {
    membershipRole: 'admin' as const,
    id: 'alice',
    organizationId: 'org-a',
    email: 'alice@app.example',
    createdAt: '',
    updatedAt: '',
  },
}));
vi.mock('@/features/settings/integrations/integrations.api', () => ({
  getIntegrations: mocks.getIntegrations,
  saveIntegration: mocks.saveIntegration,
}));
vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({ user: mocks.user }),
}));
vi.mock('@/features/microsoft-teams/teams.api', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/features/microsoft-teams/teams.api')
  >()),
  getConnection: mocks.getConnection,
  connectTeams: mocks.connectTeams,
  disconnectTeams: mocks.disconnectTeams,
  getChannels: mocks.getChannels,
  getTeamsPreview: mocks.getTeamsPreview,
  sendTeams: mocks.sendTeams,
  reviewDelivery: mocks.reviewDelivery,
}));
const connection = {
  organizationId: 'org-a',
  userId: 'alice',
  ready: true,
  live: true,
  status: 'connected' as const,
  account: {
    displayName: 'Alice Microsoft',
    username: 'alice@microsoft.example',
  },
};
const preview: Preview = {
  body: 'Hallo Ada',
  connection,
  operation: null,
  completed: false,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getConnection.mockResolvedValue(connection);
  mocks.getTeamsPreview.mockResolvedValue(preview);
  mocks.getChannels.mockResolvedValue({
    channels: [
      {
        teamId: 'team-a',
        channelId: 'channel-a',
        teamName: 'Office',
        channelName: 'General',
        label: 'Office · General',
      },
      {
        teamId: 'team-b',
        channelId: 'channel-b',
        teamName: 'Site',
        channelName: 'Crew',
        label: 'Site · Crew',
      },
    ],
    warnings: [],
  });
});
afterEach(() => vi.unstubAllEnvs());
describe('personal Microsoft Teams connection', () => {
  it('enables connecting immediately after Microsoft settings are saved', async () => {
    const user = userEvent.setup();
    const integrations = ['microsoft_graph', 'crewmeister'].map((provider) => ({
      provider,
      enabled: true,
      tenantId: '',
      clientId: '',
      clientSecret: '',
      domain: '',
      licenseSkuId: '',
      crewId: '',
      ready: false,
      live: true,
    }));
    mocks.getIntegrations.mockResolvedValue(integrations);
    mocks.saveIntegration.mockResolvedValue(integrations[0]);
    mocks.getConnection.mockResolvedValue({
      ...connection,
      ready: false,
      status: 'disconnected',
      account: null,
    });
    renderWithProviders(<IntegrationsPage />);
    const button = await screen.findByRole('button', { name: 'Verbinden' });
    await waitFor(() => expect(button).toBeDisabled());
    mocks.getConnection.mockResolvedValue({
      ...connection,
      status: 'disconnected',
      account: null,
    });
    const heading = await screen.findByRole('heading', {
      name: 'Microsoft 365',
    });
    await user.click(
      within(heading.closest('form')!).getByRole('button', {
        name: 'Speichern',
      })
    );
    await waitFor(() => expect(button).toBeEnabled());
    expect(mocks.getConnection).toHaveBeenCalledTimes(2);
  });

  it('detects newly available configuration and stops polling once ready', async () => {
    mocks.getConnection.mockResolvedValue({
      ...connection,
      ready: false,
      status: 'disconnected',
      account: null,
    });
    vi.useFakeTimers();
    const view = renderWithProviders(<TeamsConnectionCard user={mocks.user} />);
    try {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      const button = screen.getByRole('button', { name: 'Verbinden' });
      expect(button).toBeDisabled();
      mocks.getConnection.mockResolvedValue({
        ...connection,
        status: 'disconnected',
        account: null,
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5_001);
      });
      expect(button).toBeEnabled();
      expect(mocks.getConnection).toHaveBeenCalledTimes(2);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(15_000);
      });
      expect(mocks.getConnection).toHaveBeenCalledTimes(2);
    } finally {
      view.unmount();
      vi.useRealTimers();
    }
  });

  it.each([
    [
      'token_exchange_failed',
      'Microsoft konnte nicht verbunden werden. Bitte erneut verbinden.',
    ],
    [
      'connection_save_failed',
      'Verbindung konnte nicht gespeichert werden. Bitte erneut verbinden.',
    ],
  ])(
    'explains %s and preserves access to the existing connection',
    async (code, message) => {
      window.history.replaceState(
        {},
        '',
        `/settings/integrations?microsoft=${code}`
      );
      renderWithProviders(<TeamsConnectionCard user={mocks.user} />);
      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(
        await screen.findByText(/Verbunden als Alice Microsoft/)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Microsoft Teams trennen' })
      ).toBeEnabled();
      expect(window.location.search).toBe('');
    }
  );

  it('saves task edits and refreshes the message before sending from the sidebar', async () => {
    const user = userEvent.setup();
    let finishSave!: (saved: boolean) => void;
    const beforeSend = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          finishSave = resolve;
        })
    );
    renderWithProviders(
      <TeamsSendAction
        taskId="task-1"
        disabled={false}
        beforeSend={beforeSend}
      />
    );
    await screen.findByRole('option', { name: 'Office · General' });
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Teams-Kanal' }),
      'team-a:channel-a'
    );
    await user.click(
      screen.getByRole('button', { name: 'Teams-Nachricht senden' })
    );
    expect(beforeSend).toHaveBeenCalledOnce();
    expect(mocks.sendTeams).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    mocks.getTeamsPreview.mockResolvedValue({
      ...preview,
      body: 'Updated message',
    });
    finishSave(true);
    await waitFor(() =>
      expect(mocks.sendTeams).toHaveBeenCalledWith('task-1', {
        idempotencyKey: expect.any(String),
        destinations: [{ teamId: 'team-a', channelId: 'channel-a' }],
      })
    );
    expect(mocks.getTeamsPreview.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('does not send when task edits cannot be saved', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TeamsSendAction
        taskId="task-1"
        disabled={false}
        beforeSend={async () => false}
      />
    );
    await screen.findByRole('option', { name: 'Office · General' });
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Teams-Kanal' }),
      'team-a:channel-a'
    );
    await user.click(
      screen.getByRole('button', { name: 'Teams-Nachricht senden' })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.sendTeams).not.toHaveBeenCalled();
  });

  it('shows a personal connection to an ordinary employee and disconnects it', async () => {
    const user = userEvent.setup();
    mocks.disconnectTeams.mockResolvedValue({
      ...connection,
      status: 'disconnected',
      account: null,
    });
    renderWithProviders(
      <TeamsConnectionCard user={{ ...mocks.user, membershipRole: 'worker' }} />
    );
    expect(
      await screen.findByText(/Verbunden als Alice Microsoft/)
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Microsoft Teams trennen' })
    );
    await waitFor(() => expect(mocks.disconnectTeams).toHaveBeenCalledOnce());
    expect(
      await screen.findByRole('button', { name: 'Verbinden' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Microsoft Teams trennen' })
    ).not.toBeInTheDocument();
  });
  it('offers reconnection when required by Microsoft', async () => {
    mocks.getConnection.mockResolvedValue({
      ...connection,
      status: 'reconnect_required',
    });
    renderWithProviders(<TeamsConnectionCard user={mocks.user} />);
    expect(
      await screen.findByRole('button', { name: 'Erneut verbinden' })
    ).toBeEnabled();
  });
});
describe('Teams sending', () => {
  it('selects one channel and sends directly from the production sidebar without a dialog', async () => {
    vi.stubEnv('PROD', true);
    const user = userEvent.setup();
    mocks.sendTeams.mockResolvedValue({
      status: 'completed',
      destinations: [],
    });
    renderWithProviders(<TeamsSendAction taskId="task-a" disabled={false} />);
    const button = screen.getByRole('button', {
      name: 'Teams-Nachricht senden',
    });
    expect(button).toBeDisabled();
    await screen.findByRole('option', { name: 'Office · General' });
    const select = screen.getByRole('combobox', { name: 'Teams-Kanal' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Hallo Ada')).not.toBeInTheDocument();
    expect(screen.queryByText('Alice Microsoft')).not.toBeInTheDocument();
    await user.selectOptions(select, 'team-b:channel-b');
    await user.selectOptions(select, 'team-a:channel-a');
    await user.click(button);
    await waitFor(() =>
      expect(mocks.sendTeams).toHaveBeenCalledWith('task-a', {
        idempotencyKey: expect.any(String),
        destinations: [{ teamId: 'team-a', channelId: 'channel-a' }],
      })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('prevents sending when the sidebar action is disabled', async () => {
    renderWithProviders(<TeamsSendAction taskId="task-a" disabled />);
    await screen.findByRole('option', { name: 'Office · General' });
    expect(
      screen.getByRole('combobox', { name: 'Teams-Kanal' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Teams-Nachricht senden' })
    ).toBeDisabled();
    expect(mocks.sendTeams).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'shows environment diagnostics only outside production (production=%s)',
    async (production) => {
      vi.stubEnv('PROD', production);
      mocks.getTeamsPreview.mockResolvedValue({
        ...preview,
        connection: {
          ...connection,
          ready: false,
          live: false,
          status: 'disconnected',
          account: null,
        },
      });
      renderWithProviders(<TeamsSendForm taskId="task-a" />);
      expect(await screen.findByText('Hallo Ada')).toBeInTheDocument();
      expect(
        screen.getByRole('group', { name: 'Teams-Kanäle' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Nachricht senden' })
      ).toBeDisabled();
      if (production) {
        expect(
          screen.queryByText(/Microsoft Teams ist noch nicht eingerichtet/)
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/Sequenzen werden/)).not.toBeInTheDocument();
        expect(
          screen.queryByRole('link', {
            name: 'Zu den allgemeinen Einstellungen',
          })
        ).not.toBeInTheDocument();
      } else {
        expect(
          screen.getByText(/Microsoft Teams ist noch nicht eingerichtet/)
        ).toBeInTheDocument();
        expect(screen.getByText(/Sequenzen werden/)).toBeInTheDocument();
      }
      expect(mocks.getChannels).not.toHaveBeenCalled();
    }
  );

  it('previews the rendered body, filters channels and never asks for a sender email', async () => {
    const user = userEvent.setup();
    mocks.sendTeams.mockResolvedValue({
      status: 'completed',
      destinations: [],
    });
    renderWithProviders(<TeamsSendForm taskId="task-a" />);
    expect(await screen.findByText('Alice Microsoft')).toBeInTheDocument();
    expect(screen.getByText('Hallo Ada')).toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: /Absender/ })
    ).not.toBeInTheDocument();
    const search = await screen.findByRole('textbox', {
      name: 'Kanäle suchen',
    });
    await user.type(search, 'Office');
    expect(
      screen.queryByRole('checkbox', { name: 'Site · Crew' })
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('checkbox', { name: 'Office · General' })
    );
    await user.click(screen.getByRole('button', { name: 'Nachricht senden' }));
    await waitFor(() =>
      expect(mocks.sendTeams).toHaveBeenCalledWith('task-a', {
        idempotencyKey: expect.any(String),
        destinations: [
          expect.objectContaining({ teamId: 'team-a', channelId: 'channel-a' }),
        ],
      })
    );
    const input = mocks.sendTeams.mock.calls[0][1];
    expect(input).not.toHaveProperty('senderAddress');
    expect(input).not.toHaveProperty('userId');
  });
  it('blocks sending until the current employee connects her account', async () => {
    mocks.getTeamsPreview.mockResolvedValue({
      ...preview,
      connection: { ...connection, status: 'disconnected', account: null },
    });
    renderWithProviders(<TeamsSendForm taskId="task-a" />);
    expect(
      await screen.findByRole('link', {
        name: 'Zu den allgemeinen Einstellungen',
      })
    ).toHaveAttribute('href', '/settings/integrations');
    expect(
      screen.getByRole('button', { name: 'Nachricht senden' })
    ).toBeDisabled();
    expect(mocks.getChannels).not.toHaveBeenCalled();
  });
  it('requires an explicit Teams check before an uncertain delivery can be retried', async () => {
    const user = userEvent.setup();
    const operation = {
      senderName: 'Alice Microsoft',
      id: 'send-a',
      idempotencyKey: 'request-a',
      body: 'Hallo Ada',
      status: 'partial',
      leaseUntil: null,
      destinations: [
        {
          id: 'destination-a',
          teamId: 'team-a',
          channelId: 'channel-a',
          label: 'Office · General',
          status: 'unknown',
          error: 'Zustellung unklar.',
          retryAfter: null,
          messageUrl: null,
        },
      ],
    };
    mocks.getTeamsPreview.mockResolvedValue({ ...preview, operation });
    mocks.reviewDelivery.mockResolvedValue(operation);
    renderWithProviders(<TeamsSendForm taskId="task-a" />);
    expect(await screen.findByText('Zustellung unklar')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Offene Zustellungen erneut senden' })
    ).toBeDisabled();
    await user.click(
      screen.getByRole('button', { name: 'In Teams geprüft: nicht angekommen' })
    );
    await waitFor(() =>
      expect(mocks.reviewDelivery).toHaveBeenCalledWith(
        'task-a',
        'destination-a',
        false
      )
    );
    expect(mocks.sendTeams).not.toHaveBeenCalled();
  });
});
