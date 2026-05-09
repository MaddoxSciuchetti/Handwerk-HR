import { expect, test } from '@playwright/test';
import { API_BASE_URL } from './constants';
import { OutboxEmail } from './types';

function newestEmailFirst(emails: OutboxEmail[]): OutboxEmail[] {
  return [...emails].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

test.describe('Create employee journey', () => {
  test.setTimeout(90_000);

  let inviteEmail = '';
  let employee: {
    firstName: string;
    lastName: string;
    password: string;
  };

  test.beforeAll(async ({ request }, testInfo) => {
    /** File-level `Date.now()` collides across parallel workers (multiple browsers). */
    const suffix =
      `${testInfo.project.name}-w${testInfo.workerIndex}-${Date.now()}-` +
      `${Math.random().toString(36).slice(2, 11)}`;
    inviteEmail = `employee-${suffix}@example.com`.toLowerCase();
    employee = {
      firstName: 'E2E',
      lastName: `Mitarbeiter${suffix}`,
      password: 'TestPassword123!',
    };

    await request.delete(`${API_BASE_URL}/test/emails`, {
      data: { email: inviteEmail },
    });
  });

  test.afterAll(async ({ request }) => {
    await request.delete(`${API_BASE_URL}/test/deleteTestUser`, {
      data: { email: inviteEmail },
      failOnStatusCode: false,
    });
    await request.delete(`${API_BASE_URL}/test/emails`, {
      data: { email: inviteEmail },
    });
  });

  test('invites from settings, sends invite email, completes invite acceptance, and removes employee', async ({
    page,
    request,
  }) => {
    await page.goto('/settings/employees');
    await expect(page).toHaveURL(/\/settings\/employees$/);

    await expect(
      page.getByRole('heading', { name: /Mitarbeiter/i })
    ).toBeVisible();

    await page.getByPlaceholder('Mitarbeite Email').fill(inviteEmail);
    await page.getByRole('button', { name: /^Hinzufügen$/i }).click();

    await expect(page.getByText('Einladung erfolgreich gesendet.')).toBeVisible(
      { timeout: 15_000 }
    );

    await expect
      .poll(async () => {
        const response = await request.get(
          `${API_BASE_URL}/test/emails?recipient=${encodeURIComponent(inviteEmail)}`
        );
        if (!response.ok()) return 0;
        const body = (await response.json()) as { emails: OutboxEmail[] };
        return body.emails.filter((email) =>
          email.subject.includes("You've been invited")
        ).length;
      })
      .toBeGreaterThanOrEqual(1);

    const emailsAfterInviteResponse = await request.get(
      `${API_BASE_URL}/test/emails?recipient=${encodeURIComponent(inviteEmail)}`
    );
    const emailsAfterInvite = (await emailsAfterInviteResponse.json()) as {
      emails: OutboxEmail[];
    };
    const inviteCandidates = newestEmailFirst(
      emailsAfterInvite.emails.filter((email) =>
        email.subject.includes("You've been invited")
      )
    );
    const inviteMail = inviteCandidates[0];
    expect(inviteMail).toBeDefined();
    expect(inviteMail?.to?.toLowerCase()).toBe(inviteEmail);
    expect(inviteMail?.html).toMatch(/signup\?invite=([a-f0-9]+)/i);

    const tokenMatch = inviteMail!.html.match(/signup\?invite=([a-f0-9]+)/i);
    expect(tokenMatch).toBeTruthy();
    const inviteToken = tokenMatch![1];

    const acceptResponse = await request.post(
      `${API_BASE_URL}/invites/${inviteToken}/accept`,
      {
        data: {
          displayName: `${employee.firstName} ${employee.lastName}`,
          firstName: employee.firstName,
          lastName: employee.lastName,
          password: employee.password,
          confirmPassword: employee.password,
        },
      }
    );
    expect(acceptResponse.ok()).toBeTruthy();

    await expect
      .poll(async () => {
        const response = await request.get(
          `${API_BASE_URL}/test/emails?recipient=${encodeURIComponent(inviteEmail)}`
        );
        if (!response.ok()) return 0;
        const body = (await response.json()) as { emails: OutboxEmail[] };
        return body.emails.filter((email) =>
          email.subject.includes('Verfiziere dein Konto')
        ).length;
      })
      .toBeGreaterThanOrEqual(1);

    const emailsFinalResponse = await request.get(
      `${API_BASE_URL}/test/emails?recipient=${encodeURIComponent(inviteEmail)}`
    );
    const emailsFinal = (await emailsFinalResponse.json()) as {
      emails: OutboxEmail[];
    };
    const verificationCandidates = newestEmailFirst(
      emailsFinal.emails.filter((email) =>
        email.subject.includes('Verfiziere dein Konto')
      )
    );
    const verificationEmail = verificationCandidates[0];
    expect(verificationEmail).toBeDefined();
    expect(verificationEmail?.html).toContain('/email/verify/');
    expect(verificationEmail?.html).toContain(employee.password);

    await page.goto('/settings/employees');
    await expect(page).toHaveURL(/\/settings\/employees$/);

    const employeeRow = page
      .locator('div.flex.items-center.relative.group')
      .filter({
        hasText: new RegExp(`${employee.firstName}\\s+${employee.lastName}`),
      })
      .first();

    await expect(employeeRow).toBeVisible({ timeout: 15_000 });

    const deleteTrigger = employeeRow.getByRole('button', {
      name: /Löschen öffnen/i,
    });
    await expect(deleteTrigger).toBeVisible();
    await deleteTrigger.click();

    const confirmDeleteButton = page.getByRole('button', {
      name: /Löschen bestätigen/i,
    });
    await expect(confirmDeleteButton).toBeVisible();
    await confirmDeleteButton.click();

    await expect(employeeRow).not.toBeVisible({ timeout: 15_000 });
  });
});
