import { expect, test } from '@playwright/test';
import { API_BASE_URL } from './constants';
import type { CompleteSignupUser } from './utils/complete-signup-journey';
import { completeSignupAndLogin } from './utils/complete-signup-journey';

type SignupJourneyUser = CompleteSignupUser;

test.describe('Signup journey', () => {
  test.setTimeout(90_000);

  let testUser: SignupJourneyUser;

  test.beforeAll(async ({ browserName }) => {
    const timestamp = Date.now();
    testUser = {
      vorname: 'Test',
      nachname: 'Nutzer',
      displayName: 'Test Nutzer',
      orgName: `E2E Co ${browserName}-${timestamp}`,
      email: `test-${browserName}-${timestamp}@example.com`,
      password: 'TestPassword123!',
      confirmpassword: 'TestPassword123!',
    };
  });

  test.afterAll(async ({ request }) => {
    await request.delete(`${API_BASE_URL}/test/deleteTestUser`, {
      data: { email: testUser.email },
      failOnStatusCode: false,
    });
  });

  test('should complete onboarding signup and login flow', async ({ page }) => {
    await completeSignupAndLogin(page, testUser);
    await expect(
      page.getByText(testUser.vorname, { exact: true })
    ).toBeVisible();
  });
});
