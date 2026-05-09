import { expect, test } from '@playwright/test';
import { API_BASE_URL } from './constants';
import { LoginCredentials, SignupTestUser } from './types';

test.describe('Signin journey', () => {
  test.setTimeout(60_000);

  let testUser: SignupTestUser;
  let loginCredentials: LoginCredentials;

  test.beforeAll(async ({ request, browserName }) => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    testUser = {
      vorname: 'Test',
      nachname: 'Nutzer',
      email: `test-${browserName}-${suffix}@example.com`,
      password: 'TestPassword123!',
      confirmpassword: 'TestPassword123!',
    };

    loginCredentials = {
      email: testUser.email,
      password: testUser.password,
    };

    const registerResponse = await request.post(
      `${API_BASE_URL}/auth/v2/register/org`,
      {
        data: {
          email: testUser.email,
          firstName: testUser.vorname,
          lastName: testUser.nachname,
          displayName: `${testUser.vorname} ${testUser.nachname}`,
          password: testUser.password,
          confirmPassword: testUser.confirmpassword,
          orgName: `E2E Signin ${browserName}-${suffix}`,
        },
        failOnStatusCode: false,
      }
    );

    expect(registerResponse.ok()).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    await request.delete(`${API_BASE_URL}/test/deleteTestUser`, {
      data: { email: testUser.email },
      failOnStatusCode: false,
    });
  });

  test('should sign in with fixture user and show email in sidebar', async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel(/Email Address/i).fill(loginCredentials.email);
    await page.getByLabel(/^Password$/i).fill(loginCredentials.password);
    await page.getByRole('button', { name: /^Login$/i }).click();

    await page.waitForURL('**/worker-lifycycle', {
      timeout: 60_000,
      waitUntil: 'commit',
    });
    await expect(
      page.getByText(testUser.vorname, { exact: true })
    ).toBeVisible();
  });
});
