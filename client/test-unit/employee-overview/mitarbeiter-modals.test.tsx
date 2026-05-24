import { EmployeeModalProvider } from '@/features/employee-overview/context/ModalProvider';
import type { EmployeeDataArray } from '@/features/employee-overview/schemas/schema';
import Employees from '@/features/settings/employees/Employees';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test-utils';

const sampleEmployee: EmployeeDataArray[number] = {
  id: 'emp-1',
  firstName: 'Max',
  lastName: 'Mustermann',
  email: 'max@example.com',
  isVerified: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  organizationMembers: [{ membershipRole: 'worker' }],
  absences: [],
};

vi.mock('@/features/employee-overview/hooks/useGetEmployees', () => ({
  default: () => ({
    EmployeeData: [sampleEmployee],
    isLoading: false,
  }),
}));

const handleDeleteEmployee = vi.fn();

vi.mock('@/features/employee-overview/hooks/useDeleteEmployee', () => ({
  default: () => ({
    handleDeleteEmployee,
    isErrorMutation: false,
    isPending: false,
  }),
}));

vi.mock('@/features/employee-overview/hooks/useEmployeeData', () => ({
  default: () => ({
    isLoading: false,
    tasksByEmployee: [],
    openTaskCountsByEmployee: new Map(),
  }),
}));

const createOrgInviteMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined)
);

vi.mock('@/features/auth/api/auth.api', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/auth/api/auth.api')>();
  return {
    ...actual,
    createOrgInvite: createOrgInviteMock,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock(
  '@/features/employee-overview/components/sidebar/contents/EmployeeAbsenceContent',
  () => ({
    default: () => <div>E2E stub: Abwesenheit Inhalt</div>,
  })
);

vi.mock(
  '@/features/employee-overview/components/sidebar/contents/EmployeeTasksContent',
  () => ({
    default: () => <div>E2E stub: Aufgaben Inhalt</div>,
  })
);

function renderEmployees() {
  renderWithProviders(
    <EmployeeModalProvider>
      <Employees />
    </EmployeeModalProvider>
  );
}

describe('Employees (settings) — invite, sidebar, delete', () => {
  beforeEach(() => {
    createOrgInviteMock.mockClear();
    handleDeleteEmployee.mockClear();
  });

  it('calls createOrgInvite after filling email and clicking Hinzufügen', async () => {
    const user = userEvent.setup();
    renderEmployees();

    await user.type(
      screen.getByPlaceholderText('Mitarbeite Email'),
      'neu@example.com'
    );
    await user.click(screen.getByRole('button', { name: /^Hinzufügen$/i }));

    expect(createOrgInviteMock).toHaveBeenCalledTimes(1);
    expect(createOrgInviteMock.mock.calls[0][0]).toEqual({
      email: 'neu@example.com',
    });
  });

  it('opens sidebar and shows absence flow when choosing Abwesenheit eintragen', async () => {
    const user = userEvent.setup();
    renderEmployees();

    await user.click(screen.getByText(/Max Mustermann/));

    const aside = await screen.findByRole('complementary');
    expect(within(aside).getByText(/^Max Mustermann$/)).toBeInTheDocument();

    await user.click(screen.getByText(/^Abwesenheit eintragen$/));

    expect(
      await screen.findByText(/^E2E stub: Abwesenheit Inhalt$/)
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('complementary')).getByText(
        /^Abwesenheit eintragen$/
      )
    ).toBeInTheDocument();
  });

  it('opens sidebar and shows tasks pane when choosing Aufgaben ansehen', async () => {
    const user = userEvent.setup();
    renderEmployees();

    await user.click(screen.getByText(/Max Mustermann/));
    await user.click(screen.getByText(/^Aufgaben ansehen$/));

    expect(
      await screen.findByText(/^E2E stub: Aufgaben Inhalt$/)
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('complementary')).getByText(/^Aufgaben$/)
    ).toBeInTheDocument();
  });

  it('opens delete confirm when trash is clicked', async () => {
    const user = userEvent.setup();
    renderEmployees();

    expect(screen.queryByText(/Bist du sicher?/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Löschen öffnen/i }));

    expect(await screen.findByText(/Bist du sicher?/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Löschen bestätigen/i })
    ).toBeInTheDocument();
  });
});
