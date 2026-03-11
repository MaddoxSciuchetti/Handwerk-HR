import { expect, test } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000';

test.describe('Signup journey', () => {
  test.setTimeout(60_000);

  test('should complete onboarding signup and login flow', async ({
    page,
    request,
    browserName,
  }) => {
    const timestamp = Date.now();
    const testUser = {
      vorname: 'Test',
      nachname: 'Nutzer',
      email: `test-${browserName}-${timestamp}@example.com`,
      password: 'TestPassword123!',
      confirmpassword: 'TestPassword123!',
    };

    try {
      // 1: Go to home page
      await page.goto('/home');

      await expect(
        page.getByRole('heading', {
          name: /Happy employees drive successful companies\./i,
        })
      ).toBeVisible();

      // 2-3: Click Get Started and land on signup page
      await page.getByRole('link', { name: /^Get Started$/i }).click();
      await page.waitForURL('**/signup');
      await expect(page).toHaveURL(/\/signup$/);

      // 4-6: Fill signup form and submit
      await page.getByLabel(/Email Address/i).fill(testUser.email);
      await page.getByLabel(/Vorname/i).fill(testUser.vorname);
      await page.getByLabel(/Nachname/i).fill(testUser.nachname);
      await page.getByLabel(/^Password$/i).fill(testUser.password);
      await page.getByLabel(/Confirm Password/i).fill(testUser.confirmpassword);
      await page.getByRole('button', { name: /Create Account/i }).click();

      // 7: Redirect to login screen
      await page.waitForURL('**/login');
      await expect(page).toHaveURL(/\/login$/);

      // 8-9: Enter login details and submit
      await page.getByLabel(/Email Address/i).fill(testUser.email);
      await page.getByLabel(/^Password$/i).fill(testUser.password);
      await page.getByRole('button', { name: /^Login$/i }).click();

      // 10: Email appears near user profile area on authenticated page
      await page.waitForURL('**/worker-lifycycle');
      await expect(page).toHaveURL(/\/worker-lifycycle$/);
      await expect(
        page.getByText(testUser.email, { exact: true })
      ).toBeVisible();
    } finally {
      await request.delete(`${API_BASE_URL}/test-users`, {
        data: { email: testUser.email },
      });
    }
  });
});
