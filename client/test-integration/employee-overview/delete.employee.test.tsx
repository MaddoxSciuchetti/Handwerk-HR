import API from '@/config/apiClient';
import queryClient from '@/config/query.client';
import EmployeeOverview from '@/features/employee-overview/components/EmployeeOverview';
import { EmployeeModalProvider } from '@/features/employee-overview/context/ModalProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmployeeRecord } from '../types';
import { buildEmployee } from '../utils';

describe('Delete a employee', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it('should delete the employee and should not be seen', async () => {
    const user = userEvent.setup();

    const employee = buildEmployee();
    let employeeResponse: EmployeeRecord[] = [employee];
    const getSpy = vi
      .spyOn(API, 'get')
      .mockImplementation(async (url: string) => {
        if (url === '/employee/specificEmployeeData') {
          return employeeResponse;
        }
        return [];
      });

    const deleteSpy = vi
      .spyOn(API, 'delete')
      .mockImplementation(async (url: string) => {
        if (url === `/employee/deleteEmplyoee/${employee.id}`) {
          return (employeeResponse = []);
        }
        return [];
      });

    render(
      <QueryClientProvider client={queryClient}>
        <EmployeeModalProvider>
          <EmployeeOverview />
        </EmployeeModalProvider>
      </QueryClientProvider>
    );

    const row = (await screen.findByText('MaxMustermann')).closest('tr');
    expect(row).not.toBeNull();

    await user.hover(row!);
    const deleteButton = within(row!).getByRole('button', {
      name: /Löschen öffnen/i,
    });
    await user.click(deleteButton);

    await user.click(
      screen.getByRole('button', { name: /Löschen bestätigen/i })
    );
    expect(deleteSpy).toHaveBeenCalledWith(
      `/employee/deleteEmplyoee/${employee.id}`
    );
    expect(getSpy).toHaveBeenCalledWith('/employee/specificEmployeeData');

    await waitFor(() => {
      expect(screen.queryByText('MaxMustermann')).not.toBeInTheDocument();
    });
  });
});
