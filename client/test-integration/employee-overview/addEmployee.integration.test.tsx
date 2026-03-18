import API from '@/config/apiClient';
import queryClient from '@/config/query.client';
import EmployeeOverview from '@/features/employee-overview/components/EmployeeOverview';
import { EmployeeModalProvider } from '@/features/employee-overview/context/ModalProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmployeeRecord } from '../types';
import { buildEmployee } from '../utils';

describe('should create the employee', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });
  it('creates the new employee', async () => {
    const user = userEvent.setup();
    const employee = buildEmployee();
    let employeeResponse: EmployeeRecord[] = [];

    const postSpy = vi
      .spyOn(API, 'post')
      .mockImplementation(async (url: string, _data: unknown) => {
        if (url === '/auth/register') {
          employeeResponse = [employee];
          return {
            user: employee,
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          };
        }
        return [];
      });

    const getSpy = vi
      .spyOn(API, 'get')
      .mockImplementation(async (url: string) => {
        if (url === '/employee/specificEmployeeData') {
          return employeeResponse;
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

    const button = await screen.findByRole('button', {
      name: /Mitarbeiter Hinzufügen/i,
    });
    await user.click(button);

    const vornameInput = screen.getByPlaceholderText('Vorname');
    const nachnameInput = screen.getByPlaceholderText('Nachname');
    const emailInput = screen.getByPlaceholderText('email');
    const password = screen.getByPlaceholderText('password');
    const confirmPassword = screen.getByPlaceholderText('Confirm Password');

    await user.type(vornameInput, employee.vorname);
    await user.type(nachnameInput, employee.nachname);
    await user.type(emailInput, employee.email!);
    await user.type(password, '123123');
    await user.type(confirmPassword, '123123');

    await user.click(screen.getByRole('button', { name: 'Nutzer Erstellen' }));

    expect(postSpy).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({
        firstName: employee.vorname,
        lastName: employee.nachname,
        email: employee.email,
        password: '123123',
        confirmPassword: '123123',
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(`${employee.vorname}${employee.nachname}`)
      ).toBeInTheDocument();
    });
  });
});
