import API from '@/config/apiClient';
import queryClient from '@/config/query.client';
import EmployeeOverview from '@/features/employee-overview/components/EmployeeOverview';
import { EmployeeModalProvider } from '@/features/employee-overview/context/ModalProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmployeeRecord } from '../types';
import { absentStatus, buildEmployee } from '../utils';

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

    const updatedRow = screen.getByText('MaxMustermann').closest('tr');
    expect(updatedRow).not.toBeNull();
    const expectedSubstituteName = `${absentStatus.sub_user?.vorname} ${absentStatus.sub_user?.nachname}`;
    const rowCells = within(updatedRow!).getAllByRole('cell');
    const vertretungCell = rowCells[3];
    expect(vertretungCell).toHaveTextContent(expectedSubstituteName);
    expect(getSpy).toHaveBeenCalledWith('/employee/specificEmployeeData');
  });
});
