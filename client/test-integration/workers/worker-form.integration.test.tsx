import { WorkerForm } from '@/features/worker-lifecycle/components/lifycycle-modal-content/WorkerForm';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test-unit/test-utils';

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

  it('shows required errors when submitting an empty onboarding form', async () => {
    const user = userEvent.setup();
    renderOnboardingForm();

    await user.click(screen.getByRole('button', { name: /^Hinzufügen$/i }));

    const required = await screen.findAllByText(/^erforderlich$/);
    expect(required.length).toBeGreaterThan(0);

    expect(addWorkerMock).not.toHaveBeenCalled();
  });

  it('submits onboarding and calls addWorker with valid payloads', async () => {
    const user = userEvent.setup();
    renderOnboardingForm();

    await user.type(screen.getByPlaceholderText(/^Vorname$/), 'Anna');
    await user.type(screen.getByPlaceholderText(/^Nachname$/), 'Schmidt');
    await user.type(
      screen.getByPlaceholderText(/^Email$/),
      'anna@test.example'
    );
    await user.type(screen.getByPlaceholderText(/^Geburtsdatum/), '01.03.1992');
    await user.type(screen.getByPlaceholderText(/^Adresse/), 'Berlin Str. 1');
    await user.type(
      screen.getByPlaceholderText(/^Eintrittsdatum/),
      '01.08.2025'
    );
    await user.type(screen.getByPlaceholderText(/^Position/), 'Pflege');

    await user.click(screen.getByRole('button', { name: /^Hinzufügen$/i }));

    await vi.waitFor(() => expect(addWorkerMock).toHaveBeenCalledTimes(1));

    const payload = addWorkerMock.mock.calls[0][0];
    expect(payload.firstName).toBe('Anna');
    expect(payload.lastName).toBe('Schmidt');
    expect(payload.email).toBe('anna@test.example');
    expect(payload.engagementType).toBe('onboarding');

    expect(toastSuccess).toHaveBeenCalledWith(
      'Mitarbeiter erstellt und Benachrichtigungen versendet'
    );
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
