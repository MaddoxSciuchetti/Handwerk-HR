import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from 'test-unit/test-utils';
import { EngagementMailRecipients } from '@/features/worker-task-management/components/tasks/EngagementMailRecipients';
import {
  getEngagementMailRecipients,
  saveEngagementMailRecipients,
  type EngagementMailPage,
} from '@/features/worker-task-management/api/engagementMail.api';

vi.mock(
  '@/features/worker-task-management/api/engagementMail.api',
  async (original) => ({
    ...(await original<object>()),
    getEngagementMailRecipients: vi.fn(),
    saveEngagementMailRecipients: vi.fn(),
  })
);

beforeEach(() => {
  vi.resetAllMocks();
  const page: EngagementMailPage = {
    selected: [],
    workers: [],
    channels: [],
    channelsError: null,
    groupsError: null,
    groups: Array.from({ length: 15 }, (_, i) => ({
      id: `group-${i}`,
      displayName: `Team ${i}`,
    })),
    licensedUsers: [
      {
        id: 'graph-ada',
        displayName: 'Ada Müller',
        email: 'ada@bsb-gruppe.de',
      },
    ],
    licensedUsersError: null,
  };
  vi.mocked(getEngagementMailRecipients).mockResolvedValue(page);
  vi.mocked(saveEngagementMailRecipients).mockImplementation(
    async (_, selected) => selected
  );
});

it('limits suggestions and searches all groups and licensed users by name or email', async () => {
  const user = userEvent.setup();
  renderWithProviders(<EngagementMailRecipients engagementId="engagement-1" />);
  await user.click(
    await screen.findByRole('button', { name: 'Empfänger wählen' })
  );
  expect(screen.getAllByRole('checkbox')).toHaveLength(10);
  expect(screen.getByRole('status')).toHaveTextContent('10 von 16');
  const search = screen.getByRole('textbox', { name: 'Empfänger suchen' });
  await user.type(search, 'Team 14');
  await user.click(screen.getByRole('checkbox', { name: 'Team 14' }));
  await waitFor(() =>
    expect(saveEngagementMailRecipients).toHaveBeenCalledTimes(1)
  );
  await user.clear(search);
  await user.type(search, 'muller');
  expect(
    screen.getByRole('checkbox', { name: /Ada Müller/ })
  ).not.toBeChecked();
  await user.clear(search);
  await user.type(search, 'ada@bsb');
  await user.click(screen.getByRole('checkbox', { name: /Ada Müller/ }));
  await waitFor(() =>
    expect(saveEngagementMailRecipients).toHaveBeenCalledTimes(2)
  );
  expect(saveEngagementMailRecipients).toHaveBeenLastCalledWith(
    'engagement-1',
    [
      expect.objectContaining({ kind: 'microsoft_group', groupId: 'group-14' }),
      expect.objectContaining({
        kind: 'microsoft_user',
        microsoftUserId: 'graph-ada',
        address: 'ada@bsb-gruppe.de',
      }),
    ]
  );
  await user.clear(search);
  await user.type(search, 'Team 14');
  expect(screen.getByRole('checkbox', { name: 'Team 14' })).toBeChecked();
  await user.click(screen.getByRole('checkbox', { name: 'Team 14' }));
  await waitFor(() =>
    expect(saveEngagementMailRecipients).toHaveBeenCalledTimes(3)
  );
  expect(saveEngagementMailRecipients).toHaveBeenLastCalledWith(
    'engagement-1',
    [expect.objectContaining({ microsoftUserId: 'graph-ada' })]
  );
});

it('shows a no-match message without losing selections', async () => {
  const user = userEvent.setup();
  renderWithProviders(<EngagementMailRecipients engagementId="engagement-1" />);
  await user.click(
    await screen.findByRole('button', { name: 'Empfänger wählen' })
  );
  await user.type(
    screen.getByRole('textbox', { name: 'Empfänger suchen' }),
    'no-such-recipient'
  );
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(
    screen.getByText('Keine passenden Empfänger gefunden.')
  ).toBeInTheDocument();
  expect(saveEngagementMailRecipients).not.toHaveBeenCalled();
});
