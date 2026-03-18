import EmployeeOverview from '@/features/employee-overview/components/EmployeeOverview';
import { EmployeeModalProvider } from '@/features/employee-overview/context/ModalProvider';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test-utils';

vi.mock('@/features/employee-overview/hooks/useGetEmployees', () => ({
  default: () => ({
    EmployeeData: [
      {
        id: 'emp-1',
        vorname: 'Max',
        nachname: 'Mustermann',
        user_permission: 'EMPLOYEE',
        employeeStatus: [],
      },
    ],
  }),
}));

vi.mock('@/features/employee-overview/hooks/useDeleteEmployee', () => ({
  default: () => ({
    DeleteEmployee: vi.fn(),
    isPending: false,
  }),
}));

vi.mock(
  '@/features/employee-overview/components/modals/create-employee-modal/EmployeeModal',
  () => ({
    default: () => <div>Create employee modal</div>,
  })
);

vi.mock(
  '@/features/employee-overview/components/modals/edit-employee-modal/EmployeeModal',
  () => ({
    default: () => <div>Edit absence modal</div>,
  })
);

vi.mock(
  '@/features/employee-overview/components/modals/view-employeedata-modal/ViewEmployeeModal',
  () => ({
    default: () => <div>Aufgaben</div>,
  })
);

describe('Employee overview modal', () => {
  it('opens create Mitarbeiter modal when clicking the add button', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EmployeeModalProvider>
        <EmployeeOverview />
      </EmployeeModalProvider>
    );

    expect(
      screen.queryByText(/Create employee modal/i)
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /search-header-button/i })
    );

    expect(
      await screen.findByText(/Create employee modal/i)
    ).toBeInTheDocument();
  });

  it('opens the modal to add a employees absence', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EmployeeModalProvider>
        <EmployeeOverview />
      </EmployeeModalProvider>
    );

    expect(
      screen.queryByText(/Create employee modal/i)
    ).not.toBeInTheDocument();

    const row = screen.getByText(/MaxMustermann/i).closest('tr');
    expect(row).not.toBeNull();
    await user.hover(row!);
    await user.click(
      within(row!).getByRole('button', { name: /Abwesenheit eintragen/i })
    );
    expect(await screen.findByText(/Edit absence modal/i)).toBeInTheDocument();
  });

  it('should open the modal where the owner can see the open tasks of the employe', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EmployeeModalProvider>
        <EmployeeOverview />
      </EmployeeModalProvider>
    );

    expect(screen.queryByText(/^Aufgaben$/i)).not.toBeInTheDocument();
    const row = screen.getByText(/MaxMustermann/i).closest('tr');
    expect(row).not.toBeNull();
    await user.hover(row!);
    await user.click(within(row!).getByRole('button', { name: /Ansehen/i }));

    expect(await screen.findByText(/^Aufgaben$/i)).toBeInTheDocument();
  });

  it('should open the delete modal when the trash can is being clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <EmployeeModalProvider>
        <EmployeeOverview />
      </EmployeeModalProvider>
    );

    expect(screen.queryByText(/Bist du sicher?/i)).not.toBeInTheDocument();

    const row = screen.getByText(/MaxMustermann/i).closest('tr');
    expect(row).not.toBeNull();

    await user.hover(row!);
    await user.click(
      within(row!).getByRole('button', { name: /Löschen öffnen/i })
    );

    expect(await screen.findByText(/Bist du sicher?/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Löschen bestätigen/i })
    ).toBeInTheDocument();
  });
});
