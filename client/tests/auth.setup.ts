import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authStatePath = path.resolve(__dirname, '../playwright/.auth/chef.json');

const chefEmail = process.env.PLAYWRIGHT_CHEF_EMAIL;
const chefPassword = process.env.PLAYWRIGHT_CHEF_PASSWORD;

setup('authenticate chef user', async ({ page }) => {
  if (!chefEmail || !chefPassword) {
    throw new Error(
      'Missing PLAYWRIGHT_CHEF_EMAIL or PLAYWRIGHT_CHEF_PASSWORD for authenticated E2E tests.'
    );
  }

  await page.goto('/login');
  await page.getByLabel(/Email Address/i).fill(chefEmail);
  await page.getByLabel(/^Password$/i).fill(chefPassword);
  await page.getByRole('button', { name: /^Login$/i }).click();

  await page.waitForURL('**/worker-lifycycle');
  await expect(page).toHaveURL(/\/worker-lifycycle$/);

  fs.mkdirSync(path.dirname(authStatePath), { recursive: true });
  await page.context().storageState({ path: authStatePath });
});
