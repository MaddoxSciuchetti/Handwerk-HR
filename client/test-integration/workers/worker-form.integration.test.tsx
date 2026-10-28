import { WorkerForm } from '@/features/worker-lifecycle/components/lifycycle-modal-content/WorkerForm';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test-unit/test-utils';

vi.mock('@/config/apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/apiClient')>();
  return {
    ...actual,
    apiJson: {
      ...actual.apiJson,
      get: vi.fn().mockResolvedValue({
        data: { addresses: [], error: null },
      }),
    },
  };
});

const noop = () => {};

const addWorkerMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    success: true,
    data: {
      worker: { id: 'worker-new-1', firstName: 'Anna', lastName: 'Test' },
    },
  })
);

vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({
    user: { id: 'chef-user-1', firstName: 'Chef' },
  }),
}));

vi.mock('@/features/worker-lifecycle/api', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/worker-lifecycle/api')>();
  return {
    ...actual,
    addWorker: addWorkerMock,
  };
});

vi.mock('@/features/template-tasks/hooks/useGetTemplates', () => ({
  useGetTemplates: () => ({ data: [], isLoading: false }),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}));

function renderOnboardingForm() {
  renderWithProviders(
    <WorkerForm
      type="Onboarding"
      setSelectedOption={noop}
      toggleModal={noop}
      showInlineFormBackButton={false}
    />
  );
}

function renderOffboardingForm() {
  renderWithProviders(
    <WorkerForm
      type="Offboarding"
      setSelectedOption={noop}
      toggleModal={noop}
      showInlineFormBackButton={false}
    />
  );
}

describe('Worker form (integration)', () => {
  beforeEach(() => {
    addWorkerMock.mockClear();
    toastSuccess.mockClear();
    toastError.mockClear();
  });

  it('shows only fast-track onboarding without the manual fields or add button', () => {
    renderOnboardingForm();

    expect(
      screen.getByLabelText('Name oder E-Mail des Mitarbeiters')
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Anlegen' })).toBeVisible();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(screen.queryByText('oder')).not.toBeInTheDocument();
    for (const placeholder of [
      /^Vorname$/,
      /^Nachname$/,
      /^Email$/,
      /^Geburtsdatum/,
      /^Adresse/,
      /^Eintrittsdatum/,
      /^Position/,
    ]) {
      expect(
        screen.queryByPlaceholderText(placeholder)
      ).not.toBeInTheDocument();
    }
    expect(screen.queryByText('Template (optional)')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Hinzufügen$/i })
    ).not.toBeInTheDocument();
    expect(addWorkerMock).not.toHaveBeenCalled();
  });

  it('blocks offboarding submit when austrittsdatum is before eintrittsdatum and shows An error occurred', async () => {
    const user = userEvent.setup();
    renderOffboardingForm();

    await user.type(screen.getByPlaceholderText(/^Vorname$/), 'Max');
    await user.type(screen.getByPlaceholderText(/^Nachname$/), 'Aus');
    await user.type(screen.getByPlaceholderText(/^Email$/), 'max@test.example');
    await user.type(screen.getByPlaceholderText(/^Geburtsdatum/), '01.03.1985');
    await user.type(screen.getByPlaceholderText(/^Adresse/), 'weg 9');
    await user.type(
      screen.getByPlaceholderText(/^Eintrittsdatum/),
      '15.06.2025'
    );
    await user.type(screen.getByPlaceholderText(/^Position/), 'Labor');
    await user.type(
      screen.getByPlaceholderText(/^Austrittsdatum/),
      '10.06.2025'
    );

    await user.click(screen.getByRole('button', { name: /^Hinzufügen$/i }));

    expect(await screen.findByText(/^An error occurred$/)).toBeInTheDocument();
    expect(addWorkerMock).not.toHaveBeenCalled();
  });
});
