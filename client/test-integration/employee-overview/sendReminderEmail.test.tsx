import API from '@/config/apiClient';
import queryClient from '@/config/query.client';
import EmployeeOverview from '@/features/employee-overview/components/EmployeeOverview';
import { EmployeeModalProvider } from '@/features/employee-overview/context/ModalProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmployeeRecord } from '../types';
import { buildEmployee } from '../utils';

vi.mock('@/features/employee-overview/hooks/useDeleteEmployee', () => ({
  default: () => ({
    DeleteEmployee: vi.fn(),
    isPending: false,
  }),
}));

describe('Send Reminder email', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it('sends a email to the respective user', async () => {
    const user = userEvent.setup();
    let employeeResponse: EmployeeRecord[] = [buildEmployee()];
    const employeeWorkerResponse = [
      {
        description: 'Text Aufgabe',
        form_field_id: 1,
        owner: 'emp-1',
        fullname: 'MaxMustermann',
        auth_id: 'auth-1',
        is_substitute: false,
        substitute_id: null,
        original_owner: 'emp-1',
        substitute_name: null,
        inputs: [
          {
            id: 1,
            employee_form_id: 1,
            form_field_id: 1,
            status: 'Offen',
            timestamp: new Date('2026-01-01'),
            timeStampLastChange: new Date('2026-01-01'),
            employee: {
              id: 1,
              vorname: 'Max',
              nachname: 'Mustermann',
              email: 'max@example.com',
            },
          },
        ],
      },
    ];

    const getSpy = vi
      .spyOn(API, 'get')
      .mockImplementation(async (url: string) => {
        if (url === '/employee/specificEmployeeData') {
          return employeeResponse;
        }

        if (url === '/employee/getEmployeeWorkerData') {
          return employeeWorkerResponse;
        }

        return [];
      });

    const postSpy = vi
      .spyOn(API, 'post')
      .mockImplementation(async (url: string) => {
        if (url === '/index/sendReminder') {
          return { message: 'ok' };
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

    const presentText = await screen.findByText('Anwesend');
    expect(presentText).toHaveClass('text-(--chart-2)');
    const row = (await screen.findByText('MaxMustermann')).closest('tr');
    expect(row).not.toBeNull();

    await user.hover(row!);
    await user.click(within(row!).getByRole('button', { name: /Ansehen/i }));
    await screen.findByRole('button', { name: /Erinnerung senden/i });

    await user.click(
      screen.getByRole('button', { name: /Erinnerung senden/i })
    );

    const emailInput = screen.getByPlaceholderText('Email');
    const betreffInput = screen.getByPlaceholderText('Betreff');
    const textbox = screen.getByPlaceholderText('Nachricht');

    await user.type(emailInput, 'text@test.com');
    await user.type(betreffInput, 'betreff input');
    await user.type(textbox, 'other input');

    const secondButton = screen.getByRole('button', { name: /Senden/i });
    await user.click(secondButton);

    expect(postSpy).toHaveBeenCalledWith(
      '/index/sendReminder',
      expect.objectContaining({
        email: 'text@test.com',
        subject: 'betreff input',
        test: 'other input',
      })
    );

    expect(getSpy).toHaveBeenCalledWith('/employee/specificEmployeeData');
    expect(getSpy).toHaveBeenCalledWith('/employee/getEmployeeWorkerData');
  });
});
