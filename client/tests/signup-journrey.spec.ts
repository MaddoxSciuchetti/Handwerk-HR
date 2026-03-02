import { expect, Page, test } from '@playwright/test';
import { TestUsers } from './helpers';

test.describe.serial('Signup journey', () => {
  let sharedPage: Page;
  const timestamp = Date.now();
  let browserName: string;

  let testUsers: TestUsers[];

  test.beforeAll(async ({ browser, browserName: bn }) => {
    browserName = bn;
    const context = await browser.newContext();
    sharedPage = await context.newPage();
  });

  test('should sign in as admin', async () => {
    await sharedPage.goto('/login');
  });

  //   test.afterAll(async () => {
  //     await sharedPage.close();
  //   });

  test('shoud login', async () => {
    await sharedPage.goto('/login');

    await expect(
      sharedPage.getByRole('heading', { name: /Sign in to your account/i })
    ).toBeVisible();

    // Filling in the sign in information

    await sharedPage.getByLabel(/Email address/i).fill('admin@example.com');
    await sharedPage.getByLabel(/Password/i).fill('Admin123!');
    await sharedPage.getByRole('button', { name: /Login/i }).click();

    await sharedPage.waitForURL('/handwerker');
    await expect(sharedPage).toHaveURL('/handwerker');
    await expect(
      sharedPage.locator(':has-text("Handwerker")').first()
    ).toBeVisible();
  });
});
