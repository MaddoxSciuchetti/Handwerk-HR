import API from '@/config/apiClient';
import queryClient from '@/config/query.client';
import EmployeeOverview from '@/features/employee-overview/components/EmployeeOverview';
import { EmployeeModalProvider } from '@/features/employee-overview/context/ModalProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/employee-overview/hooks/useEmployeeData', () => ({
  default: () => ({
    openTaskCountsByOwner: new Map<string, number>(),
  }),
}));

vi.mock('@/features/employee-overview/hooks/useDeleteEmployee', () => ({
  default: () => ({
    DeleteEmployee: vi.fn(),
    isPending: false,
  }),
}));

type EmployeeStatusRecord = {
  id: string;
  userId: string;
  absence: string;
  absencetype: string | null;
  absencebegin: string | null;
  absenceEnd: string | null;
  substitute: string | null;
  sub_user: {
    id: string;
    vorname: string;
    nachname: string;
  } | null;
};

type EmployeeRecord = {
  id: string;
  vorname: string;
  nachname: string;
  email: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  user_permission: 'CHEF' | 'MITARBEITER';
  employeeStatus: EmployeeStatusRecord[];
};

const nowIso = new Date().toISOString();

const buildEmployee = (
  employeeStatus: EmployeeStatusRecord[] = []
): EmployeeRecord => ({
  id: 'emp-1',
  vorname: 'Max',
  nachname: 'Mustermann',
  email: 'max@example.com',
  verified: true,
  createdAt: nowIso,
  updatedAt: nowIso,
  user_permission: 'MITARBEITER',
  employeeStatus,
});

const absentStatus: EmployeeStatusRecord = {
  id: 'status-1',
  userId: 'emp-1',
  absence: 'true',
  absencetype: 'krank',
  absencebegin: '2030-01-10T00:00:00.000Z',
  absenceEnd: '2030-01-15T00:00:00.000Z',
  substitute: 'emp-2',
  sub_user: {
    id: 'emp-2',
    vorname: 'Erika',
    nachname: 'Musterfrau',
  },
};

describe('Employee absence status integration', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it('switches employee status from Anwesend (green) to Abwesend (red) after absence submit', async () => {
    const user = userEvent.setup();

    let employeeResponse: EmployeeRecord[] = [buildEmployee()];

    const getSpy = vi
      .spyOn(API, 'get')
      .mockImplementation(async (url: string) => {
        if (url === '/employee/specificEmployeeData') {
          return employeeResponse;
        }
        return [];
      });

    const putSpy = vi
      .spyOn(API, 'put')
      .mockImplementation(async (url: string, payload: unknown) => {
        if (url === '/employee/editAbsenceData') {
          employeeResponse = [buildEmployee([absentStatus])];
        }
        return payload;
      });

    render(
      <QueryClientProvider client={queryClient}>
        <EmployeeModalProvider>
          <EmployeeOverview />
        </EmployeeModalProvider>
      </QueryClientProvider>
    );

    const presentText = await screen.findByText('Anwesend');
    expect(presentText).toHaveClass('text-(--chart-2)');

    const row = screen.getByText('MaxMustermann').closest('tr');
    expect(row).not.toBeNull();

    await user.hover(row!);
    await user.click(
      within(row!).getByRole('button', { name: /Abwesenheit eintragen/i })
    );

    const selects = screen.getAllByRole('combobox');

    await user.click(selects[0]);
    await user.click(screen.getByRole('option', { name: 'Krank' }));

    const dateInputs = screen.getAllByPlaceholderText('DD.MM.YYYY');
    await user.type(dateInputs[0], '10.01.2030');
    await user.type(dateInputs[1], '15.01.2030');

    await user.click(selects[1]);
    await user.click(screen.getByRole('option', { name: 'MaxMustermann' }));

    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(putSpy).toHaveBeenCalledWith(
      '/employee/editAbsenceData',
      expect.objectContaining({
        id: 'emp-1',
        absencetype: 'krank',
        absencebegin: '10.01.2030',
        absenceEnd: '15.01.2030',
        substitute: 'emp-1',
      })
    );

    const absentText = await screen.findByText('Abwesend vom');
    expect(absentText).toHaveClass('text-(--chart-5)');
    expect(getSpy).toHaveBeenCalledWith('/employee/specificEmployeeData');
  });
});
