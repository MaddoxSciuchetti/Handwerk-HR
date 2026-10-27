import TaskManagement from '@/features/worker-task-management/components/tasks/WorkerTaskManagement';
import { apiJson } from '@/config/apiClient';
import { renderWithProviders } from 'test-unit/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/config/apiClient', () => ({
  default: {},
  apiJson: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
}));
vi.mock('@/features/worker-task-management/hooks/useTaskData', () => ({
  default: () => ({
    isLoading: false,
    data: {
      data: {
        id: 'worker',
        firstName: 'Ada',
        lastName: 'Muster',
        engagements: [
          {
            id: 'engagement',
            type: 'onboarding',
            status: 'expected',
            questionnaireSubmission: null,
            issues: [],
          },
        ],
      },
    },
  }),
}));
vi.mock('@/features/worker-task-management/hooks/useGetWorkerFiles', () => ({
  default: () => ({ fetchFiles: [] }),
}));
vi.mock('@/features/all-tasks/components/TaskSidebar', () => ({
  TaskSidebar: () => null,
}));

const draft = {
  success: true,
  data: {
    engagementId: 'engagement',
    email: 'ada@example.test',
    sent: false,
    status: null,
    items: [
      {
        kind: 'field',
        key: 'salary',
        label: 'Gehalt',
        section: 'BSB',
        type: 'text',
        bsbOnly: true,
        defaultValue: '',
      },
    ],
    questions: [],
    repeaters: [],
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(apiJson.get).mockResolvedValue(draft);
  vi.mocked(apiJson.put).mockImplementation(async (_path, body) => {
    const saved = {
      ...draft,
      data: {
        ...draft.data,
        items: (body as { definition: { items: typeof draft.data.items } })
          .definition.items,
      },
    };
    vi.mocked(apiJson.get).mockResolvedValue(saved);
    return saved;
  });
  vi.mocked(apiJson.post).mockResolvedValue({
    success: true,
    data: { emailSent: true },
  });
});

it('keeps the send button and saved draft after closing and returning to the worker', async () => {
  const user = userEvent.setup();
  const firstVisit = renderWithProviders(<TaskManagement workerId="worker" />);
  await user.click(screen.getByRole('button', { name: 'Fragebogen senden' }));
  await user.type(
    await screen.findByRole('textbox', { name: 'Gehalt' }),
    '3200'
  );
  await user.click(screen.getByRole('button', { name: 'Schließen' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(
    screen.getByRole('button', { name: 'Fragebogen senden' })
  ).toBeEnabled();
  expect(apiJson.post).not.toHaveBeenCalled();

  // A fresh provider discards the query cache, as on a reload or later visit.
  firstVisit.unmount();
  renderWithProviders(<TaskManagement workerId="worker" />);
  await user.click(screen.getByRole('button', { name: 'Fragebogen senden' }));
  expect(await screen.findByRole('textbox', { name: 'Gehalt' })).toHaveValue(
    '3200'
  );
  const send = screen.getByRole('button', { name: 'Senden', exact: true });
  expect(send).toBeEnabled();
  await user.click(send);
  await waitFor(() =>
    expect(apiJson.post).toHaveBeenCalledWith(
      '/worker/engagements/engagement/questionnaire/send'
    )
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
});
