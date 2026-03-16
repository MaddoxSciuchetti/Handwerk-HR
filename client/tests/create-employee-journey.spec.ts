import { expect, test } from '@playwright/test';
import { API_BASE_URL } from './constants';
import { OutboxEmail } from './types';

test.describe('Create employee journey', () => {
  test.setTimeout(90_000);

  const timestamp = Date.now();
  const employee = {
    firstName: 'E2E',
    lastName: `Worker${timestamp}`,
    email: `employee-${timestamp}@example.com`,
    password: 'TestPassword123!',
  };

  test.beforeAll(async ({ request }) => {
    await request.delete(`${API_BASE_URL}/test/emails`, {
      data: { email: employee.email },
    });
  });

  test.afterAll(async ({ request }) => {
    await request.delete(`${API_BASE_URL}/test/emails`, {
      data: { email: employee.email },
    });
  });

  test('creates an employee, shows it in overview, and sends verification email', async ({
    page,
    request,
  }) => {
    await page.goto('/employee-overview');
    await expect(page).toHaveURL(/\/employee-overview$/);

    await page.getByRole('button', { name: /Mitarbeiter Hinzufügen/i }).click();

    await page.getByPlaceholder('Vorname').fill(employee.firstName);
    await page.getByPlaceholder('Nachname').fill(employee.lastName);
    await page.getByPlaceholder('email').fill(employee.email);
    await page
      .getByPlaceholder('password', { exact: true })
      .fill(employee.password);
    await page.getByPlaceholder('Confirm Password').fill(employee.password);
    await page.getByRole('button', { name: /Nutzer Erstellen/i }).click();

    await expect(
      page.getByText(/Neuen Mitarbeiter hinzufügen/i)
    ).not.toBeVisible({ timeout: 15_000 });

    const searchInput = page.getByPlaceholder('Suche bei Namen');
    await searchInput.fill(employee.firstName);

    await expect(
      page.getByText(
        new RegExp(`${employee.firstName}\\s*${employee.lastName}`)
      )
    ).toBeVisible();

    await expect
      .poll(async () => {
        const response = await request.get(
          `${API_BASE_URL}/test/emails?recipient=${encodeURIComponent(employee.email)}`
        );

        if (!response.ok()) {
          return 0;
        }

        const body = (await response.json()) as { emails: OutboxEmail[] };
        return body.emails.filter((email) =>
          email.subject.includes('Verfiziere dein Konto')
        ).length;
      })
      .toBe(1);

    const emailResponse = await request.get(
      `${API_BASE_URL}/test/emails?recipient=${encodeURIComponent(employee.email)}`
    );

    const body = (await emailResponse.json()) as { emails: OutboxEmail[] };
    const verificationEmail = body.emails.find((email) =>
      email.subject.includes('Verfiziere dein Konto')
    );

    expect(verificationEmail).toBeDefined();
    expect(verificationEmail?.to).toBe(employee.email);
    expect(verificationEmail?.subject).toContain('Verfiziere dein Konto');
    expect(verificationEmail?.html).toContain('/email/verify/');
    expect(verificationEmail?.html).toContain(employee.password);

    const employeeRow = page
      .locator('tr', {
        hasText: new RegExp(`${employee.firstName}\\s*${employee.lastName}`),
      })
      .first();
    await expect(employeeRow).toBeVisible();

    const actionsTrigger = employeeRow.getByRole('button', {
      name: /Löschen öffnen/i,
    });
    await expect(actionsTrigger).toBeVisible();
    await actionsTrigger.click();

    const confirmDeleteButton = page.getByRole('button', {
      name: /Löschen bestätigen/i,
    });
    await expect(confirmDeleteButton).toBeVisible();
    await confirmDeleteButton.click();

    await expect(employeeRow).not.toBeVisible();
  });
});
