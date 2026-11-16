import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { completeSignupAndLogin } from './complete-signup-journey';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authDir = path.resolve(__dirname, '../playwright/.auth');
const authStatePath = path.resolve(authDir, 'session.json');
const teardownMarkerPath = path.resolve(authDir, 'teardown-user.json');

setup(
  'sign up and persist session for authenticated journeys',
  async ({ page }) => {
    setup.setTimeout(120_000);

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    const testUser = {
      vorname: 'Test',
      nachname: 'Nutzer',
      displayName: 'Test Nutzer',
      orgName: `E2E Authenticated ${suffix}`,
      email: `e2e-auth-${suffix}@example.com`,
      password: 'TestPassword123!',
      confirmpassword: 'TestPassword123!',
    };

    await completeSignupAndLogin(page, testUser);

    await expect(
      page.getByText(testUser.vorname, { exact: true })
    ).toBeVisible();

    fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(
      teardownMarkerPath,
      JSON.stringify({ email: testUser.email })
    );
    await page.context().storageState({ path: authStatePath });
  }
);
